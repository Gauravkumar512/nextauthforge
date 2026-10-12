import path from "path";
import { execSync } from "child_process";
import fs from "fs-extra";
import { PackageManager } from "./detect";
import { installCommand } from "./pm";

const DEPS = ["jose", "bcryptjs", "mongoose", "react-hot-toast", "axios", "zod"];

/** Template dependencies that aren't in the project's package.json yet. */
export function missingDependencies(root: string): string[] {
  const pkg = fs.readJsonSync(path.join(root, "package.json"));
  const present = { ...pkg.dependencies, ...pkg.devDependencies };
  return DEPS.filter((dep) => !(dep in present));
}

export function installDependencies(root: string, pm: PackageManager, deps: string[]): void {
  execSync(installCommand(pm, deps), { cwd: root, stdio: "inherit" });
}
