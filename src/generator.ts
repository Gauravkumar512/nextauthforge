import path from "path";
import fs from "fs-extra";
import { UserChoices } from "./prompt";
import { ProjectInfo } from "./detect";
import { FileContext, FileResult, writeManaged } from "./fileops";

interface TemplateFile {
  /** Absolute path of the template file. */
  srcPath: string;
  /** Path relative to the template root; also the destination path below the base dir. */
  relPath: string;
  /** Replaces the default destination file name (e.g. proxy.ts -> middleware.ts). */
  destName?: string;
  transform?: (content: string) => string;
}

/**
 * The single template -> destination mapping: everything lives under the
 * layout's base dir ("src" or "").
 */
export function destPath(baseDir: string, templatePath: string): string {
  return path.posix.join(baseDir, templatePath);
}

const isUiFile = (rel: string) => rel.startsWith("app/(auth)/") || rel === "app/page.tsx";
const isDashboardFile = (rel: string) => rel.startsWith("app/dashboard/");
// Handled by env-files.ts, not copied like a normal template.
const isEnvExample = (rel: string) => rel === ".env.example";

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await fs.readdir(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...(await listFiles(dir, rel)));
    else files.push(rel);
  }
  return files;
}

/**
 * Route handlers carry `export const dynamic = "force-dynamic"` (marked with
 * nextauthforge:dynamic). Next rejects that option when `cacheComponents` is
 * on, where handlers are dynamic by default anyway, so the line is dropped.
 */
function stripDynamicExport(content: string): string {
  return content
    .split("\n")
    .filter((line) => !line.includes("nextauthforge:dynamic"))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
}

/**
 * Next >= 16 uses proxy.ts / `proxy`; older versions use middleware.ts /
 * `middleware`. One template, name substituted at generation time.
 */
function proxyFile(nextMajor: number): Pick<TemplateFile, "destName" | "transform"> {
  if (nextMajor >= 16) return {};
  return {
    destName: "middleware.ts",
    transform: (content) => content.replace(/\bfunction proxy\b/, "function middleware"),
  };
}

const TEMPLATES_ROOT = path.join(__dirname, "..", "templates");

/** DB-agnostic templates: routes, service layer, config, proxy, UI. */
export function sharedTemplateDir(): string {
  return path.join(TEMPLATES_ROOT, "shared");
}

/** Only the database-specific code (connection, models, repositories). */
export function dbTemplateDir(database: string): string {
  return path.join(TEMPLATES_ROOT, database);
}

/** Shared templates merged with the chosen database's (the database wins on a clash). */
export async function planFiles(
  project: ProjectInfo,
  choices: UserChoices
): Promise<TemplateFile[]> {
  const dbDir = dbTemplateDir(choices.database);
  if (!(await fs.pathExists(dbDir))) {
    throw new Error(`No templates for database "${choices.database}".`);
  }

  const sources = new Map<string, string>();
  for (const dir of [sharedTemplateDir(), dbDir]) {
    for (const rel of await listFiles(dir)) sources.set(rel, path.join(dir, rel));
  }

  return [...sources.keys()]
    .sort()
    .filter((rel) => !isEnvExample(rel))
    .filter((rel) => (isUiFile(rel) ? choices.includeUI : true))
    .filter((rel) => (isDashboardFile(rel) ? choices.includeDashboard : true))
    .map((rel): TemplateFile => {
      const srcPath = sources.get(rel)!;
      if (rel === "proxy.ts") return { ...proxyFile(project.nextMajor), srcPath, relPath: rel };
      if (project.cacheComponents && rel.startsWith("app/api/")) {
        return { srcPath, relPath: rel, transform: stripDynamicExport };
      }
      return { srcPath, relPath: rel };
    });
}

export async function generateFiles(
  ctx: FileContext,
  project: ProjectInfo,
  choices: UserChoices
): Promise<FileResult[]> {
  const results: FileResult[] = [];

  for (const file of await planFiles(project, choices)) {
    const rel = destPath(
      project.baseDir,
      file.destName
        ? path.posix.join(path.posix.dirname(file.relPath), file.destName)
        : file.relPath
    );

    // Next 16 refuses to start when both middleware.ts and proxy.ts exist.
    if (project.nextMajor >= 16 && file.relPath === "proxy.ts") {
      const legacy = ["middleware.ts", "middleware.js"].find((f) =>
        fs.pathExistsSync(path.join(project.root, destPath(project.baseDir, f)))
      );
      if (legacy) {
        results.push({
          path: rel,
          action: "skipped",
          note: `${legacy} already exists and Next.js 16 can't use both; migrate it to proxy.ts or merge by hand`,
        });
        continue;
      }
    }

    let content = await fs.readFile(file.srcPath, "utf8");
    if (file.transform) content = file.transform(content);
    results.push(await writeManaged(ctx, rel, content));
  }

  return results;
}
