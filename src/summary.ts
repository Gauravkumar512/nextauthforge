import chalk from "chalk";
import { ProjectInfo } from "./detect";
import { UserChoices } from "./prompt";
import { FileAction, FileResult } from "./fileops";
import { ManualStep } from "./layout-patch";
import { runScriptCommand } from "./pm";

export type InstallOutcome =
  | { kind: "installed"; commands: string[] }
  | { kind: "already" }
  | { kind: "skipped"; commands: string[] }
  | { kind: "dry-run"; commands: string[] };

export type PostInstall =
  | { kind: "none" }
  | { kind: "done"; commands: string[] }
  | { kind: "pending"; commands: string[] };

export interface SummaryInput {
  project: ProjectInfo;
  choices: UserChoices;
  results: FileResult[];
  manual?: ManualStep;
  install: InstallOutcome;
  generated: PostInstall;
  dryRun: boolean;
}

const LABELS: Record<FileAction, { done: string; planned: string; color: (s: string) => string }> = {
  created: { done: "created", planned: "would create", color: chalk.green },
  patched: { done: "patched", planned: "would patch", color: chalk.cyan },
  overwritten: { done: "overwritten", planned: "would overwrite", color: chalk.yellow },
  skipped: { done: "skipped", planned: "skipped", color: chalk.dim },
};

const ORDER: FileAction[] = ["created", "patched", "overwritten", "skipped"];

export function printSummary({ project, choices, results, manual, install, generated, dryRun }: SummaryInput): void {
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
  const cmds = (list: string[]) => list.map((c) => chalk.cyan(c)).join(" and ");
  if (install.kind === "installed") out.push(`  installed with ${cmds(install.commands)}`);
  else if (install.kind === "already") out.push("  all template dependencies are already installed");
  else if (install.kind === "dry-run") out.push(`  would run ${cmds(install.commands)}`);
  else out.push(`  skipped (--no-install); run ${cmds(install.commands)}`);

  if (generated.kind === "done") out.push(`  ran ${chalk.cyan(generated.commands.join(" && "))}`);
  else if (generated.kind === "pending") {
    out.push(`  ${dryRun ? "would run" : "skipped (--no-install); run"} ${chalk.cyan(generated.commands.join(" && "))}`);
  }

  const replaced = results.find((r) => r.note?.includes("stock create-next-app page"));
  if (replaced) {
    out.push(
      "",
      chalk.cyan(
        `ℹ ${replaced.path} was the untouched create-next-app home page, so it ${dryRun ? "would be" : "was"} replaced by the landing page` +
          (replaced.backup ? ` (backup: ${replaced.backup})` : "")
      )
    );
  }

  if (manual) {
    out.push(
      "",
      chalk.yellow(`⚠ ${manual.path} was ${dryRun ? "not changed" : "not fully changed"} (${manual.reason}). Add this by hand:`),
      "",
      ...manual.snippet.split("\n").map((l) => `    ${chalk.dim(l)}`)
    );
  }

  const schema = results.find((r) => r.path === "prisma/schema.prisma");
  if (schema?.action === "skipped" && !schema.note?.includes("up to date")) {
    out.push(
      "",
      chalk.yellow("⚠ prisma/schema.prisma already exists and was kept. Add the User, RefreshToken and UserToken models"),
      chalk.yellow(
        `  from the template by hand (or re-run with --force), with the generator output set to ${project.baseDir ? "../src/" : "../"}lib/db/generated/prisma.`
      )
    );
  }

  const envLocal = results.find((r) => r.path === ".env.local");
  const generatedSecret = envLocal?.note?.includes("AUTH_SECRET");
  const dev = runScriptCommand(project.packageManager, "dev");

  // Exactly the values that are still empty after init, for the chosen provider.
  const toFill = ["DATABASE_URL"];
  if (choices.emailProvider === "smtp") toFill.push("EMAIL_FROM", "SMTP_HOST", "SMTP_USER", "SMTP_PASS");
  if (choices.emailProvider === "resend") toFill.push("EMAIL_FROM", "RESEND_API_KEY");

  let step = 1;
  out.push("", chalk.white.bold("Next steps:"));
  out.push(
    `  ${chalk.dim(`${step++}.`)} Fill in ${toFill.map((k) => chalk.cyan(k)).join(", ")} in ${chalk.cyan(".env.local")}`
  );
  if (choices.database === "postgresql") {
    out.push(chalk.dim("     DATABASE_URL example: postgresql://user:password@localhost:5432/mydb"));
  }
  out.push(
    chalk.dim(
      generatedSecret
        ? "     (AUTH_SECRET was generated for you; keep it secret. In production set APP_URL to your real URL.)"
        : "     (make sure AUTH_SECRET is set, 32+ characters. In production set APP_URL to your real URL.)"
    )
  );
  if (manual) {
    out.push(
      `  ${chalk.dim(`${step++}.`)} Mount ${chalk.cyan("<ToasterProvider />")} in ${chalk.cyan(manual.path)} (snippet above)`
    );
  }
  if (choices.database === "postgresql") {
    out.push(`  ${chalk.dim(`${step++}.`)} Create the tables: ${chalk.cyan("npx prisma migrate dev --name init")}`);
  }
  out.push(`  ${chalk.dim(`${step++}.`)} Start your app: ${chalk.cyan(dev)}`);

  const pages: string[] = [];
  if (choices.includeLanding) pages.push("/");
  if (choices.includeUI) pages.push("/login", "/signup", "/forgot-password", "/reset-password", "/verify-email", "/terms", "/privacy");
  if (choices.includeDashboard) pages.push("/dashboard", "/dashboard/settings");
  if (pages.length > 0) {
    out.push("", chalk.white.bold("Pages:"), `  ${pages.map((p) => chalk.cyan(p)).join("  ")}`);
  }
  if ((choices.includeLanding || choices.includeDashboard) && !choices.includeUI) {
    out.push(
      chalk.yellow("⚠ --no-ui: links to /login, /signup, /terms and /privacy point at pages that were not generated.")
    );
  }
  if (pages.length > 0) {
    const base = project.baseDir ? `${project.baseDir}/` : "";
    out.push(
      "",
      chalk.white.bold("Branding:"),
      `  ${chalk.cyan(`${base}styles/authforge.css`)}  colours and corner radius (one variable each)`,
      ...(choices.includeLanding ? [`  ${chalk.cyan(`${base}lib/site-config.ts`)}  landing page copy`] : []),
      `  ${chalk.cyan(`${base}lib/auth-config.ts`)}  app name (used in emails and the UI)`
    );
  }

  if (choices.emailProvider === "console") {
    out.push(
      "",
      chalk.yellow(
        "⚠ Email provider is \"console\": emails (and their links) are only printed to the server log in development."
      ),
      chalk.yellow(
        `  It refuses to send in production. Re-run with ${chalk.cyan("--email smtp")} or ${chalk.cyan("--email resend")} before you deploy.`
      )
    );
  }
  if (choices.requireEmailVerification) {
    out.push(
      "",
      chalk.dim("Email verification is required: new users must click the emailed link before they can sign in.")
    );
  }

  out.push(
    "",
    chalk.dim("────────────────────────────────────────────────────"),
    chalk.dim("Auth routes available:"),
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/signup")}`,
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/login")}`,
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/logout")}`,
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/refresh")}`,
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/forgot-password")}  ${chalk.dim("reset-password, verify-email, resend-verification")}`,
    `  ${chalk.dim("POST")} ${chalk.cyan("/api/auth/change-password")}  ${chalk.dim("logout-all")}`,
    `  ${chalk.dim("PATCH")} ${chalk.cyan("/api/auth/profile")}`,
    `  ${chalk.dim("GET")}  ${chalk.cyan("/api/auth/me")}`,
    ""
  );

  console.log(out.join("\n"));
}
