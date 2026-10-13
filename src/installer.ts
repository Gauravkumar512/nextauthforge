import path from "path";
import { execSync } from "child_process";
import fs from "fs-extra";
import { PackageManager } from "./detect";
import { installCommand } from "./pm";

const SHARED_DEPS = ["jose", "bcryptjs", "react-hot-toast", "zod"];
const DB_DEPS: Record<string, string[]> = {
  mongodb: ["mongoose"],
};
const EMAIL_DEPS: Record<string, { deps: string[]; devDeps: string[] }> = {
  smtp: { deps: ["nodemailer"], devDeps: ["@types/nodemailer"] },
  resend: { deps: [], devDeps: [] },
  console: { deps: [], devDeps: [] },
};

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
  const email = EMAIL_DEPS[choices.emailProvider] ?? { deps: [], devDeps: [] };
  const missing = (list: string[]) => list.filter((dep) => !(dep in present));
  return {
    deps: missing([...SHARED_DEPS, ...(DB_DEPS[choices.database] ?? []), ...email.deps]),
    devDeps: missing(email.devDeps),
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
