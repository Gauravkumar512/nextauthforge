import path from "path";
import fs from "fs-extra";

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun";
export type Layout = "src" | "root";

export interface ProjectInfo {
  root: string;
  nextVersion: string;
  nextMajor: number;
  layout: Layout;
  /** "src" for the src/ layout, "" for the root layout. */
  baseDir: "src" | "";
  typescript: boolean;
  tailwind: boolean;
  /** Next.js >= 15.1 has a stable `after()`. */
  supportsAfter: boolean;
  /** next.config enables `cacheComponents`, which forbids `export const dynamic`. */
  cacheComponents: boolean;
  packageManager: PackageManager;
  warnings: string[];
}

/** Thrown when the target project can't be scaffolded; the message is user-facing. */
export class DetectError extends Error {}

const NEXT_CONFIGS = [
  "next.config.ts",
  "next.config.mts",
  "next.config.js",
  "next.config.mjs",
  "next.config.cjs",
];

const TAILWIND_CONFIGS = [
  "tailwind.config.js",
  "tailwind.config.cjs",
  "tailwind.config.mjs",
  "tailwind.config.ts",
];

function detectNext(root: string, pkg: any): { version: string; major: number } {
  const installedPkg = path.join(root, "node_modules", "next", "package.json");
  let version: string | undefined;

  if (fs.pathExistsSync(installedPkg)) {
    version = fs.readJsonSync(installedPkg).version;
  } else {
    const range: string | undefined =
      pkg.dependencies?.next ?? pkg.devDependencies?.next;
    if (!range) {
      throw new DetectError(
        "Next.js was not found. Run this command from the root of a Next.js project (13 or newer)."
      );
    }
    const match = range.match(/\d+(\.\d+)*/);
    if (!match) {
      throw new DetectError(
        `Could not determine the Next.js version from "${range}". Install your dependencies first, then re-run.`
      );
    }
    version = match[0];
  }

  const major = parseInt(String(version).split(".")[0], 10);
  if (Number.isNaN(major)) {
    throw new DetectError(`Could not parse the Next.js version "${version}".`);
  }
  if (major < 13) {
    throw new DetectError(
      `Next.js ${version} is not supported. nextauthforge needs the App Router (Next.js 13 or newer).`
    );
  }
  return { version: String(version), major };
}

function detectPackageManager(root: string): PackageManager {
  const has = (f: string) => fs.pathExistsSync(path.join(root, f));
  if (has("pnpm-lock.yaml")) return "pnpm";
  if (has("yarn.lock")) return "yarn";
  if (has("bun.lockb") || has("bun.lock")) return "bun";
  return "npm";
}

/**
 * Tailwind v3 only generates classes for files matched by `content` in its
 * config. Returns a warning when the generated app/ or components/ folders look
 * uncovered (v4 detects sources automatically, so nothing to check there).
 */
function tailwindContentWarning(root: string, baseDir: string, deps: Record<string, string>): string | undefined {
  const range = deps.tailwindcss;
  if (!range || parseInt(range.replace(/^\D*/, ""), 10) !== 3) return undefined;

  const configFile = TAILWIND_CONFIGS.find((f) => fs.pathExistsSync(path.join(root, f)));
  if (!configFile) return undefined;

  const text = fs.readFileSync(path.join(root, configFile), "utf8");
  const array = /content\s*:\s*\[([\s\S]*?)\]/.exec(text);
  if (!array) return undefined; // can't tell (dynamic config); don't guess

  const globs = [...array[1].matchAll(/["'`]([^"'`]+)["'`]/g)].map((m) => m[1].replace(/^\.\//, ""));
  const prefix = baseDir ? `${baseDir}/` : "";
  const covers = (dir: string) =>
    globs.some((g) => g.startsWith(`${prefix}${dir}/`) || g.startsWith(`${prefix}**/`) || g.startsWith("**/"));

  const missing = ["app", "components"].filter((dir) => !covers(dir));
  if (missing.length === 0) return undefined;
  return (
    `Tailwind v3: ${configFile} "content" doesn't cover ${missing.map((d) => `${prefix}${d}/`).join(" and ")}, ` +
    `so the generated UI may be unstyled. Add e.g. "./${prefix}${missing[0]}/**/*.{js,ts,jsx,tsx,mdx}" to content.`
  );
}

function supportsAfter(version: string): boolean {
  const [major, minor] = version.split(".").map((n) => parseInt(n, 10));
  return major > 15 || (major === 15 && minor >= 1);
}

export function detectProject(root: string): ProjectInfo {
  const pkgPath = path.join(root, "package.json");
  if (!fs.pathExistsSync(pkgPath)) {
    throw new DetectError(
      `No package.json found in ${root}. Run this command from the root of your Next.js project.`
    );
  }
  const pkg = fs.readJsonSync(pkgPath);
  const warnings: string[] = [];

  const next = detectNext(root, pkg);

  const hasRootApp = fs.pathExistsSync(path.join(root, "app"));
  const hasSrcApp = fs.pathExistsSync(path.join(root, "src", "app"));
  if (!hasRootApp && !hasSrcApp) {
    throw new DetectError(
      "No app/ or src/app/ directory found. nextauthforge only supports the App Router; create an app/ directory first."
    );
  }
  // Next.js ignores src/app when a root app/ exists, so root wins.
  const layout: Layout = hasRootApp ? "root" : "src";
  if (hasRootApp && hasSrcApp) {
    warnings.push(
      "Both app/ and src/app/ exist. Next.js uses the root app/, so files will be written to the project root."
    );
  }

  if (!fs.pathExistsSync(path.join(root, "tsconfig.json"))) {
    throw new DetectError(
      "No tsconfig.json found. nextauthforge generates TypeScript files, so your project must use TypeScript."
    );
  }

  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const tailwind =
    "tailwindcss" in deps ||
    TAILWIND_CONFIGS.some((f) => fs.pathExistsSync(path.join(root, f)));

  const tailwindWarning = tailwindContentWarning(root, layout === "src" ? "src" : "", deps);
  if (tailwindWarning) warnings.push(tailwindWarning);

  const cacheComponents = NEXT_CONFIGS.some((f) => {
    const file = path.join(root, f);
    return fs.pathExistsSync(file) && /\bcacheComponents\s*:\s*true\b/.test(fs.readFileSync(file, "utf8"));
  });

  return {
    root,
    nextVersion: next.version,
    nextMajor: next.major,
    layout,
    baseDir: layout === "src" ? "src" : "",
    typescript: true,
    tailwind,
    cacheComponents,
    supportsAfter: supportsAfter(next.version),
    packageManager: detectPackageManager(root),
    warnings,
  };
}
