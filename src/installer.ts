import { execSync } from "child_process";

const DEPS = ["jose", "bcryptjs", "mongoose", "react-hot-toast", "axios", "zod"];

export function installDependencies(targetDir: string): void {
  execSync(`npm install ${DEPS.join(" ")}`, {
    cwd: targetDir,
    stdio: "inherit",
  });
}