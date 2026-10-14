import path from "path";
import fs from "fs-extra";
import { UserChoices } from "./prompt";
import { ProjectInfo } from "./detect";
import { FileContext, FileResult, writeManaged } from "./fileops";
import { isStockNextPage } from "./stock";

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
  return isRootFile(templatePath) ? templatePath : path.posix.join(baseDir, templatePath);
}

/** Prisma's files always live at the project root, never under src/. */
function isRootFile(templatePath: string): boolean {
  return templatePath === "prisma.config.ts" || templatePath.startsWith("prisma/");
}

/**
 * Which option a template belongs to:
 *  - ui:        auth pages, error/not-found and the placeholder legal pages
 *  - landing:   the landing page and its copy (lib/site-config.ts)
 *  - dashboard: the protected dashboard and settings
 *  - kit:       the shared components + design tokens, needed by all three
 *  - core:      API, session and email plumbing (always generated)
 */
type Group = "ui" | "landing" | "dashboard" | "kit" | "core";

function groupOf(rel: string): Group {
  if (
    rel.startsWith("app/(auth)/") ||
    rel === "app/not-found.tsx" ||
    rel === "app/error.tsx" ||
    rel.startsWith("app/terms/") ||
    rel.startsWith("app/privacy/")
  ) {
    return "ui";
  }
  if (rel === "app/page.tsx" || rel === "lib/site-config.ts" || rel.startsWith("components/landing/")) {
    return "landing";
  }
  if (rel.startsWith("app/dashboard/") || rel.startsWith("components/dashboard/")) return "dashboard";
  if (rel.startsWith("components/auth/") || rel.startsWith("styles/")) return "kit";
  return "core";
}

function isSelected(group: Group, choices: UserChoices): boolean {
  switch (group) {
    case "ui":
      return choices.includeUI;
    case "landing":
      return choices.includeLanding;
    case "dashboard":
      return choices.includeDashboard;
    case "kit":
      // Pulled in automatically by whichever of the three needs it.
      return choices.includeUI || choices.includeLanding || choices.includeDashboard;
    default:
      return true;
  }
}
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

/** Only the chosen email adapter (and its env docs). */
export function emailTemplateDir(provider: string): string {
  return path.join(TEMPLATES_ROOT, `email-${provider}`);
}

/** `after()`-based lib/after.ts for Next.js >= 15.1 (shared has the fallback). */
function nextAfterTemplateDir(): string {
  return path.join(TEMPLATES_ROOT, "next-after");
}

/** Variants that read cookies under <Suspense>, which `cacheComponents` requires. */
function cacheComponentsTemplateDir(): string {
  return path.join(TEMPLATES_ROOT, "cache-components");
}

/** Template dirs whose `.env.example` files document the generated env vars. */
export function envExampleDirs(choices: UserChoices): string[] {
  return [dbTemplateDir(choices.database), sharedTemplateDir(), emailTemplateDir(choices.emailProvider)];
}

/**
 * Writes the init choices into lib/auth-config.ts (same idea as the
 * proxy/middleware name substitution).
 */
function configureAuth(choices: UserChoices): (content: string) => string {
  return (content) =>
    content
      .replace(
        /appName: ".*", \/\/ nextauthforge:appName/,
        () => `appName: ${JSON.stringify(choices.projectName.trim())}, // nextauthforge:appName`
      )
      .replace(
        /requireEmailVerification: (?:true|false), \/\/ nextauthforge:requireEmailVerification/,
        () =>
          `requireEmailVerification: ${choices.requireEmailVerification}, // nextauthforge:requireEmailVerification`
      );
}

/** URL schemes lib/env.ts accepts for DATABASE_URL, per database. */
const DATABASE_URL_SCHEMES: Record<string, string[]> = {
  mongodb: ["mongodb://", "mongodb+srv://"],
  postgresql: ["postgresql://", "postgres://"],
};

function configureEnv(database: string): (content: string) => string {
  const schemes = DATABASE_URL_SCHEMES[database] ?? [];
  return (content) =>
    content.replace(
      /const DATABASE_URL_SCHEMES = \[.*\]; \/\/ nextauthforge:dbSchemes/,
      () => `const DATABASE_URL_SCHEMES = ${JSON.stringify(schemes)}; // nextauthforge:dbSchemes`
    );
}

/**
 * Where the generated Prisma client goes, relative to prisma/schema.prisma:
 * next to the repositories, so under src/ for the src layout.
 */
function configurePrismaSchema(baseDir: string): (content: string) => string {
  const output = baseDir ? `../${baseDir}/lib/db/generated/prisma` : "../lib/db/generated/prisma";
  return (content) =>
    content.replace(
      /output   = ".*" \/\/ nextauthforge:output/,
      () => `output   = "${output}" // nextauthforge:output`
    );
}

/**
 * Shared templates merged with the chosen database, email adapter and (on Next
 * >= 15.1) the `after()` helper. Later directories win on a clash.
 */
export async function planFiles(
  project: ProjectInfo,
  choices: UserChoices
): Promise<TemplateFile[]> {
  const dbDir = dbTemplateDir(choices.database);
  if (!(await fs.pathExists(dbDir))) {
    throw new Error(`No templates for database "${choices.database}".`);
  }

  const emailDir = emailTemplateDir(choices.emailProvider);
  if (!(await fs.pathExists(emailDir))) {
    throw new Error(`No templates for email provider "${choices.emailProvider}".`);
  }

  const dirs = [sharedTemplateDir(), dbDir, emailDir];
  if (project.supportsAfter) dirs.push(nextAfterTemplateDir());
  if (project.cacheComponents) dirs.push(cacheComponentsTemplateDir());

  const sources = new Map<string, string>();
  for (const dir of dirs) {
    for (const rel of await listFiles(dir)) sources.set(rel, path.join(dir, rel));
  }

  return [...sources.keys()]
    .sort()
    .filter((rel) => !isEnvExample(rel))
    .filter((rel) => isSelected(groupOf(rel), choices))
    .map((rel): TemplateFile => {
      const srcPath = sources.get(rel)!;
      if (rel === "proxy.ts") return { ...proxyFile(project.nextMajor), srcPath, relPath: rel };
      if (rel === "lib/env.ts") {
        return { srcPath, relPath: rel, transform: configureEnv(choices.database) };
      }
      if (rel === "prisma/schema.prisma") {
        return { srcPath, relPath: rel, transform: configurePrismaSchema(project.baseDir) };
      }
      if (rel === "lib/auth-config.ts") {
        return { srcPath, relPath: rel, transform: configureAuth(choices) };
      }
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

    // The untouched create-next-app home page is replaced automatically (with a
    // .bak backup); any other existing page follows the normal conflict rules.
    const autoReplace =
      file.relPath === "app/page.tsx"
        ? { when: isStockNextPage, note: "replaced the stock create-next-app page" }
        : undefined;
    results.push(await writeManaged(ctx, rel, content, autoReplace));
  }

  return results;
}
