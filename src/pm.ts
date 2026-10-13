import { PackageManager } from "./detect";

export function installCommand(pm: PackageManager, deps: string[], dev = false): string {
  const verb = pm === "npm" ? "install" : "add";
  const devFlag = dev ? (pm === "bun" ? " -d" : " -D") : "";
  return `${pm} ${verb}${devFlag} ${deps.join(" ")}`;
}

export function runScriptCommand(pm: PackageManager, script: string): string {
  return pm === "npm" || pm === "bun" ? `${pm} run ${script}` : `${pm} ${script}`;
}
