import path from "path";
import fs from "fs-extra";
import { UserChoices } from "./prompt";
import { ProjectInfo } from "./detect";
import { FileContext, FileResult, writeManaged } from "./fileops";

interface TemplateFile {
  /** Path relative to the template directory. */
  src: string;
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

const CORE_FILES: string[] = [
  "app/api/auth/login/route.ts",
  "app/api/auth/signup/route.ts",
  "app/api/auth/logout/route.ts",
  "app/api/auth/me/route.ts",
  "lib/jwt.ts",
  "lib/session.ts",
  "lib/auth-config.ts",
  "lib/env.ts",
  "lib/hash.ts",
  "lib/dbConfig.ts",
  "models/user.models.js",
  "hooks/useAuth.tsx",
  "components/ToasterProvider.tsx",
];

const UI_FILES = [
  "app/(auth)/login/page.tsx",
  "app/(auth)/signup/page.tsx",
  "app/page.tsx",
];

const DASHBOARD_FILES = ["app/dashboard/page.tsx"];

/**
 * Next >= 16 uses proxy.ts / `proxy`; older versions use middleware.ts /
 * `middleware`. One template, name substituted at generation time.
 */
function proxyFile(nextMajor: number): TemplateFile {
  if (nextMajor >= 16) return { src: "proxy.ts" };
  return {
    src: "proxy.ts",
    destName: "middleware.ts",
    transform: (content) => content.replace(/\bfunction proxy\b/, "function middleware"),
  };
}

export function templateDirFor(database: string): string {
  return path.join(__dirname, "..", "templates", database);
}

export function planFiles(project: ProjectInfo, choices: UserChoices): TemplateFile[] {
  return [
    ...CORE_FILES.map((src) => ({ src })),
    proxyFile(project.nextMajor),
    ...(choices.includeUI ? UI_FILES : []).map((src) => ({ src })),
    ...(choices.includeDashboard ? DASHBOARD_FILES : []).map((src) => ({ src })),
  ];
}

export async function generateFiles(
  ctx: FileContext,
  project: ProjectInfo,
  choices: UserChoices
): Promise<FileResult[]> {
  const templateDir = templateDirFor(choices.database);
  const results: FileResult[] = [];

  for (const file of planFiles(project, choices)) {
    const srcPath = path.join(templateDir, file.src);
    const rel = destPath(
      project.baseDir,
      file.destName
        ? path.posix.join(path.posix.dirname(file.src), file.destName)
        : file.src
    );

    if (!(await fs.pathExists(srcPath))) {
      throw new Error(`Template file missing from the package: ${file.src}`);
    }

    // Next 16 refuses to start when both middleware.ts and proxy.ts exist.
    if (project.nextMajor >= 16 && file.src === "proxy.ts") {
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

    let content = await fs.readFile(srcPath, "utf8");
    if (file.transform) content = file.transform(content);
    results.push(await writeManaged(ctx, rel, content));
  }

  return results;
}
