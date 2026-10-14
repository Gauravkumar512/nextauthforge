import path from "path";
import { execSync } from "child_process";
import fs from "fs-extra";
import { PackageManager } from "./detect";
import { installCommand } from "./pm";

/**
 * The ONE place template dependency versions are pinned. Each range is the
 * major the templates were tested against, so a future major release can't
 * silently break a fresh scaffold.
 */
const VERSIONS: Record<string, string> = {
  jose: "^6",
  bcryptjs: "^3",
  "react-hot-toast": "^2",
  zod: "^4",
  mongoose: "^9",
  nodemailer: "^10",
  "@types/nodemailer": "^8",
  "@prisma/client": "^7",
  "@prisma/adapter-pg": "^7",
  prisma: "^7",
  dotenv: "^18",
};

const SHARED_DEPS = ["jose", "bcryptjs", "react-hot-toast", "zod"];
const DB_DEPS: Record<string, { deps: string[]; devDeps: string[] }> = {
  mongodb: { deps: ["mongoose"], devDeps: [] },
  // prisma (CLI) and dotenv are only used by `prisma migrate` / prisma.config.ts.
  postgresql: { deps: ["@prisma/client", "@prisma/adapter-pg"], devDeps: ["prisma", "dotenv"] },
};
const EMAIL_DEPS: Record<string, { deps: string[]; devDeps: string[] }> = {
  smtp: { deps: ["nodemailer"], devDeps: ["@types/nodemailer"] },
  resend: { deps: [], devDeps: [] },
  console: { deps: [], devDeps: [] },
};

/** "jose" -> "jose@^6" */
function pinned(name: string): string {
  const range = VERSIONS[name];
  if (!range) throw new Error(`No pinned version for template dependency "${name}".`);
  return `${name}@${range}`;
}

export interface DependencyPlan {
  deps: string[];
  devDeps: string[];
}

/** Template dependencies that aren't in the project's package.json yet. */
export function missingDependencies(
  root: string,
  choices: { database: string; emailProvider: string }
): DependencyPlan {
  const pkg = fs.readJsonSync(path.join(root, "package.json"));
  const present = { ...pkg.dependencies, ...pkg.devDependencies };
  const none = { deps: [], devDeps: [] };
  const email = EMAIL_DEPS[choices.emailProvider] ?? none;
  const db = DB_DEPS[choices.database] ?? none;
  const missing = (list: string[]) =>
    list.filter((dep) => !(dep in present)).map(pinned);
  return {
    deps: missing([...SHARED_DEPS, ...db.deps, ...email.deps]),
    devDeps: missing([...db.devDeps, ...email.devDeps]),
  };
}

/** The shell commands needed to install the plan (one per non-empty group). */
export function installCommands(pm: PackageManager, plan: DependencyPlan): string[] {
  return [
    ...(plan.deps.length ? [installCommand(pm, plan.deps)] : []),
    ...(plan.devDeps.length ? [installCommand(pm, plan.devDeps, true)] : []),
  ];
}

export function installDependencies(root: string, pm: PackageManager, plan: DependencyPlan): void {
  for (const command of installCommands(pm, plan)) {
    execSync(command, { cwd: root, stdio: "inherit" });
  }
}

/** Commands that must run after the install (not needed for MongoDB). */
export function postInstallCommands(choices: { database: string }): string[] {
  return choices.database === "postgresql" ? ["npx prisma generate"] : [];
}

export function runPostInstall(root: string, commands: string[]): void {
  for (const command of commands) execSync(command, { cwd: root, stdio: "inherit" });
}
