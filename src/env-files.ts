import path from "path";
import crypto from "crypto";
import fs from "fs-extra";
import { FileContext, FileResult } from "./fileops";

const ENV_LOCAL = ".env.local";
const ENV_EXAMPLE = ".env.example";
const GITIGNORE = ".gitignore";

/** .gitignore lines that already cover .env.local. */
const ENV_IGNORE_RULES = new Set([".env*", ".env", ".env.*", ".env.local", ".env*.local"]);

function hasKey(content: string, key: string, allowCommented = false): boolean {
  const prefix = allowCommented ? "^\s*#?\s*" : "^\s*";
  return new RegExp(`${prefix}(?:export\s+)?${key}\s*=`, "m").test(content);
}

function appendBlock(existing: string, block: string): string {
  const sep = existing === "" || existing.endsWith("\n") ? "" : "\n";
  return `${existing}${sep}${block}`;
}

async function ensureEnvLocal(ctx: FileContext): Promise<FileResult> {
  const abs = path.join(ctx.root, ENV_LOCAL);
  const exists = await fs.pathExists(abs);
  const existing = exists ? await fs.readFile(abs, "utf8") : "";

  const lines: string[] = [];
  const added: string[] = [];
  if (!hasKey(existing, "DATABASE_URL")) {
    lines.push("DATABASE_URL=");
    added.push("DATABASE_URL");
  }
  if (!hasKey(existing, "AUTH_SECRET")) {
    lines.push(`AUTH_SECRET=${crypto.randomBytes(32).toString("hex")}`);
    added.push("AUTH_SECRET");
  }

  if (added.length === 0) {
    return { path: ENV_LOCAL, action: "skipped", note: "already has DATABASE_URL and AUTH_SECRET" };
  }

  const block = lines.join("\n") + "\n";
  if (!ctx.dryRun) await fs.writeFile(abs, appendBlock(existing, block));
  return {
    path: ENV_LOCAL,
    action: exists ? "patched" : "created",
    note: `added ${added.join(", ")}`,
  };
}

async function ensureEnvExample(ctx: FileContext, templateDir: string): Promise<FileResult> {
  const abs = path.join(ctx.root, ENV_EXAMPLE);
  const template = await fs.readFile(path.join(templateDir, ENV_EXAMPLE), "utf8");

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

export async function writeEnvFiles(ctx: FileContext, templateDir: string): Promise<FileResult[]> {
  return [
    await ensureEnvLocal(ctx),
    await ensureEnvExample(ctx, templateDir),
    await ensureGitignore(ctx),
  ];
}
