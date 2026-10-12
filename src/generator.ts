import path from "path";
import fs from "fs-extra";
import { UserChoices } from "./prompt";
import { ProjectInfo } from "./detect";

interface TemplateFile {
  /** Path relative to the template directory. */
  src: string;
  /** Replaces the default destination file name (e.g. proxy.ts -> middleware.ts). */
  destName?: string;
  transform?: (content: string) => string;
}

/**
 * The single template -> destination mapping. Everything lives under the
 * layout's base dir ("src" or ""), except .env.example which is project-root.
 */
export function destPath(baseDir: string, templatePath: string): string {
  if (templatePath === ".env.example") return templatePath;
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
  ".env.example",
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

export function planFiles(project: ProjectInfo, choices: UserChoices): TemplateFile[] {
  return [
    ...CORE_FILES.map((src) => ({ src })),
    proxyFile(project.nextMajor),
    ...(choices.includeUI ? UI_FILES : []).map((src) => ({ src })),
    ...(choices.includeDashboard ? DASHBOARD_FILES : []).map((src) => ({ src })),
  ];
}

export async function generateFiles(
  project: ProjectInfo,
  choices: UserChoices
): Promise<void> {
  const templateDir = path.join(__dirname, "..", "templates", choices.database);

  for (const file of planFiles(project, choices)) {
    const srcPath = path.join(templateDir, file.src);
    const rel = destPath(project.baseDir, file.destName
      ? path.posix.join(path.posix.dirname(file.src), file.destName)
      : file.src);
    const destFile = path.join(project.root, rel);

    if (!(await fs.pathExists(srcPath))) {
      console.warn(`⚠ Template file not found, skipping: ${file.src}`);
      continue;
    }

    let content = await fs.readFile(srcPath, "utf8");
    if (file.transform) content = file.transform(content);

    await fs.ensureDir(path.dirname(destFile));
    if (await fs.pathExists(destFile)) continue;
    await fs.writeFile(destFile, content);
  }
}
