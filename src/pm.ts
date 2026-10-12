import { PackageManager } from "./detect";

export function installCommand(pm: PackageManager, deps: string[]): string {
  const verb = pm === "npm" ? "install" : "add";
  return `${pm} ${verb} ${deps.join(" ")}`;
}

export function runScriptCommand(pm: PackageManager, script: string): string {
  return pm === "npm" || pm === "bun" ? `${pm} run ${script}` : `${pm} ${script}`;
}
