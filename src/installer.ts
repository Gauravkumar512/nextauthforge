import path from "path";
import { execSync } from "child_process";
import fs from "fs-extra";
import { PackageManager } from "./detect";
import { installCommand } from "./pm";

const SHARED_DEPS = ["jose", "bcryptjs", "react-hot-toast", "axios", "zod"];
const DB_DEPS: Record<string, string[]> = {
  mongodb: ["mongoose"],
};

/** Template dependencies that aren't in the project's package.json yet. */
export function missingDependencies(root: string, database: string): string[] {
  const pkg = fs.readJsonSync(path.join(root, "package.json"));
  const present = { ...pkg.dependencies, ...pkg.devDependencies };
  return [...SHARED_DEPS, ...(DB_DEPS[database] ?? [])].filter((dep) => !(dep in present));
}

export function installDependencies(root: string, pm: PackageManager, deps: string[]): void {
  execSync(installCommand(pm, deps), { cwd: root, stdio: "inherit" });
}
