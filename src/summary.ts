import chalk from "chalk";
import { ProjectInfo } from "./detect";
import { FileAction, FileResult } from "./fileops";
import { ManualStep } from "./layout-patch";
import { runScriptCommand } from "./pm";

export type InstallOutcome =
  | { kind: "installed"; command: string }
  | { kind: "already" }
  | { kind: "skipped"; command: string }
  | { kind: "dry-run"; command: string };

export interface SummaryInput {
  project: ProjectInfo;
  results: FileResult[];
  manual?: ManualStep;
  install: InstallOutcome;
  dryRun: boolean;
}

const LABELS: Record<FileAction, { done: string; planned: string; color: (s: string) => string }> = {
  created: { done: "created", planned: "would create", color: chalk.green },
  patched: { done: "patched", planned: "would patch", color: chalk.cyan },
  overwritten: { done: "overwritten", planned: "would overwrite", color: chalk.yellow },
  skipped: { done: "skipped", planned: "skipped", color: chalk.dim },
};

const ORDER: FileAction[] = ["created", "patched", "overwritten", "skipped"];

export function printSummary({ project, results, manual, install, dryRun }: SummaryInput): void {
  const out: string[] = [""];

  out.push(
    dryRun
      ? chalk.bold.yellow("DRY RUN — nothing was written or installed. This is what would happen:")
      : chalk.bold.hex("#e8ff47")("✔ NEXTAUTHFORGE setup complete!")
  );

  out.push("", chalk.white.bold("Files:"));
  for (const action of ORDER) {
    const { done, planned, color } = LABELS[action];
    const label = dryRun ? planned : done;
    for (const r of results.filter((x) => x.action === action)) {
      const extras = [r.note, r.backup ? `backup: ${r.backup}` : undefined].filter(Boolean);
      out.push(
        `  ${color(label.padEnd(15))} ${r.path}${extras.length ? chalk.dim(`  (${extras.join("; ")})`) : ""}`
      );
    }
  }
  const counts = ORDER.map((a) => `${results.filter((r) => r.action === a).length} ${a}`);
  out.push(chalk.dim(`  ${counts.join(" · ")}`));

  out.push("", chalk.white.bold("Dependencies:"));
  if (install.kind === "installed") out.push(`  installed with ${chalk.cyan(install.command)}`);
  else if (install.kind === "already") out.push("  all template dependencies are already installed");
  else if (install.kind === "dry-run") out.push(`  would run ${chalk.cyan(install.command)}`);
  else out.push(`  skipped (--no-install); run ${chalk.cyan(install.command)}`);

  if (manual) {
    out.push(
      "",
      chalk.yellow(`⚠ ${manual.path} was not changed (${manual.reason}). Add this by hand:`),
      "",
      ...manual.snippet.split("\n").map((l) => `    ${chalk.dim(l)}`)
    );
  }

  const envLocal = results.find((r) => r.path === ".env.local");
  const generatedSecret = envLocal?.note?.includes("AUTH_SECRET");
  const dev = runScriptCommand(project.packageManager, "dev");
  let step = 1;
  out.push("", chalk.white.bold("Next steps:"));
  out.push(
    `  ${chalk.dim(`${step++}.`)} Set ${chalk.cyan("DATABASE_URL")} in ${chalk.cyan(".env.local")} to your MongoDB connection string`
  );
  out.push(
    chalk.dim(
      generatedSecret
        ? "     (AUTH_SECRET was generated for you; keep it secret)"
        : "     (and make sure AUTH_SECRET is set, 32+ characters)"
    )
  );
  if (manual) {
    out.push(
      `  ${chalk.dim(`${step++}.`)} Mount ${chalk.cyan("<ToasterProvider />")} in ${chalk.cyan(manual.path)} (snippet above)`
    );
  }
  out.push(`  ${chalk.dim(`${step++}.`)} Start your app: ${chalk.cyan(dev)}`);

  out.push(
    "",
    chalk.dim("────────────────────────────────────────────────────"),
    chalk.dim("Auth routes available:"),
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/signup")}`,
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/login")}`,
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/logout")}`,
    `  ${chalk.dim("GET")}  ${chalk.cyan("/api/auth/me")}`,
    ""
  );

  console.log(out.join("\n"));
}
