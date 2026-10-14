import path from "path";
import crypto from "crypto";
import fs from "fs-extra";
import { FileContext, FileResult } from "./fileops";
import { UserChoices } from "./prompt";

const ENV_LOCAL = ".env.local";
const ENV_EXAMPLE = ".env.example";
const GITIGNORE = ".gitignore";

/** .gitignore lines that already cover .env.local. */
const ENV_IGNORE_RULES = new Set([".env*", ".env", ".env.*", ".env.local", ".env*.local"]);

function hasKey(content: string, key: string, allowCommented = false): boolean {
  const prefix = allowCommented ? String.raw`^\s*#?\s*` : String.raw`^\s*`;
  return new RegExp(String.raw`${prefix}(?:export\s+)?${key}\s*=`, "m").test(content);
}

function appendBlock(existing: string, block: string): string {
  const sep = existing === "" || existing.endsWith("\n") ? "" : "\n";
  return `${existing}${sep}${block}`;
}

interface EnvEntry {
  key: string;
  /** Called only when the key has to be added (so secrets are generated lazily). */
  value: () => string;
}

/** The keys .env.local needs for the chosen options (existing keys are never touched). */
function envLocalEntries(choices: UserChoices): EnvEntry[] {
  const plain = (key: string, value = ""): EnvEntry => ({ key, value: () => value });
  return [
    plain("DATABASE_URL"),
    { key: "AUTH_SECRET", value: () => crypto.randomBytes(32).toString("hex") },
    plain("APP_URL", "http://localhost:3000"),
    plain("EMAIL_PROVIDER", choices.emailProvider),
    plain("EMAIL_FROM", choices.emailProvider === "console" ? "noreply@localhost" : ""),
    ...(choices.emailProvider === "smtp"
      ? [plain("SMTP_HOST"), plain("SMTP_PORT", "587"), plain("SMTP_USER"), plain("SMTP_PASS")]
      : []),
    ...(choices.emailProvider === "resend" ? [plain("RESEND_API_KEY")] : []),
  ];
}

async function ensureEnvLocal(ctx: FileContext, choices: UserChoices): Promise<FileResult> {
  const abs = path.join(ctx.root, ENV_LOCAL);
  const exists = await fs.pathExists(abs);
  const existing = exists ? await fs.readFile(abs, "utf8") : "";

  const lines: string[] = [];
  const added: string[] = [];
  for (const entry of envLocalEntries(choices)) {
    if (hasKey(existing, entry.key)) continue;
    lines.push(`${entry.key}=${entry.value()}`);
    added.push(entry.key);
  }

  if (added.length === 0) {
    return { path: ENV_LOCAL, action: "skipped", note: "already has all keys" };
  }

  const block = lines.join("\n") + "\n";
  if (!ctx.dryRun) await fs.writeFile(abs, appendBlock(existing, block));
  return {
    path: ENV_LOCAL,
    action: exists ? "patched" : "created",
    note: `added ${added.join(", ")}`,
  };
}

async function ensureEnvExample(ctx: FileContext, templateDirs: string[]): Promise<FileResult> {
  const abs = path.join(ctx.root, ENV_EXAMPLE);
  const parts: string[] = [];
  for (const dir of templateDirs) {
    const file = path.join(dir, ENV_EXAMPLE);
    if (await fs.pathExists(file)) parts.push((await fs.readFile(file, "utf8")).replace(/\r\n/g, "\n").trimEnd());
  }
  const template = parts.join("\n\n") + "\n";

  if (!(await fs.pathExists(abs))) {
    if (!ctx.dryRun) await fs.writeFile(abs, template);
    return { path: ENV_EXAMPLE, action: "created" };
  }

  // Never replace the user's file: only add documented blocks for missing keys.
  const existing = await fs.readFile(abs, "utf8");
  const blocks = template.replace(/\r\n/g, "\n").trim().split(/\n\s*\n/);
  const added: string[] = [];
  let next = existing;
  for (const block of blocks) {
    const key = block.match(/^#?\s*([A-Z][A-Z0-9_]*)=/m)?.[1];
    if (!key || hasKey(next, key, true)) continue;
    next = appendBlock(next, (next.endsWith("\n\n") || next === "" ? "" : "\n") + block + "\n");
    added.push(key);
  }

  if (added.length === 0) {
    return { path: ENV_EXAMPLE, action: "skipped", note: "already documents all keys" };
  }
  if (!ctx.dryRun) await fs.writeFile(abs, next);
  return { path: ENV_EXAMPLE, action: "patched", note: `added ${added.join(", ")}` };
}

async function ensureGitignore(ctx: FileContext): Promise<FileResult> {
  const abs = path.join(ctx.root, GITIGNORE);
  const exists = await fs.pathExists(abs);
  const existing = exists ? await fs.readFile(abs, "utf8") : "";

  const covered = existing
    .split(/\r?\n/)
    .some((line) => ENV_IGNORE_RULES.has(line.trim()));
  if (covered) {
    return { path: GITIGNORE, action: "skipped", note: "already ignores .env files" };
  }

  const block = "\n# env files (nextauthforge)\n.env*\n!.env.example\n";
  if (!ctx.dryRun) await fs.writeFile(abs, appendBlock(existing, existing === "" ? block.trimStart() : block));
  return { path: GITIGNORE, action: exists ? "patched" : "created", note: "ignore .env* except .env.example" };
}

export async function writeEnvFiles(
  ctx: FileContext,
  templateDirs: string[],
  choices: UserChoices
): Promise<FileResult[]> {
  return [
    await ensureEnvLocal(ctx, choices),
    await ensureEnvExample(ctx, templateDirs),
    await ensureGitignore(ctx),
  ];
}

/** The generated Prisma client is build output: keep it out of git. */
export async function ensureGeneratedIgnored(ctx: FileContext, baseDir: string): Promise<FileResult> {
  const rule = `${baseDir ? `/${baseDir}` : ""}/lib/db/generated/`;
  const abs = path.join(ctx.root, GITIGNORE);
  const exists = await fs.pathExists(abs);
  const existing = exists ? await fs.readFile(abs, "utf8") : "";
  if (existing.split(/\r?\n/).some((line) => line.trim() === rule)) {
    return { path: GITIGNORE, action: "skipped", note: "already ignores the generated Prisma client" };
  }
  const block = `# generated Prisma client (nextauthforge)\n${rule}\n`;
  if (!ctx.dryRun) await fs.writeFile(abs, appendBlock(existing, existing === "" ? block : `\n${block}`));
  return { path: GITIGNORE, action: exists ? "patched" : "created", note: "ignore the generated Prisma client" };
}
