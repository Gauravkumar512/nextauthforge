import { execSync } from "child_process";

const DEPS = ["jose", "bcrypt", "mongoose", "react-hot-toast","axios"];
const DEV_DEPS = ["@types/bcrypt"];

export function installDependencies(targetDir: string): void {
  execSync(`npm install ${DEPS.join(" ")}`, {
    cwd: targetDir,
    stdio: "inherit",
  });

  execSync(`npm install -D ${DEV_DEPS.join(" ")}`, {
    cwd: targetDir,
    stdio: "inherit",
  });
}