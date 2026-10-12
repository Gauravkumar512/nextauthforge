import path from "path";
import fs from "fs-extra";
import inquirer from "inquirer";

export type FileAction = "created" | "skipped" | "overwritten" | "patched";

export interface FileResult {
  /** Project-relative, forward-slash path. */
  path: string;
  action: FileAction;
  note?: string;
  backup?: string;
}

export interface FileContext {
  root: string;
  dryRun: boolean;
  /** Non-interactive: never prompt. */
  yes: boolean;
  /** With --yes, overwrite existing files (with a .bak backup). */
  force: boolean;
}

export function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

const normalizeEol = (s: string) => s.replace(/\r\n/g, "\n");

/** Writes `file.bak` (or `file.bak.1`, ... if taken) and returns its project-relative path. */
export async function backupFile(ctx: FileContext, abs: string): Promise<string> {
  let target = `${abs}.bak`;
  for (let i = 1; await fs.pathExists(target); i++) target = `${abs}.bak.${i}`;
  if (!ctx.dryRun) await fs.copy(abs, target);
  return toPosix(path.relative(ctx.root, target));
}

type Decision = "skip" | "overwrite" | "backup";

async function decide(ctx: FileContext, rel: string): Promise<{ decision: Decision; note?: string }> {
  if (ctx.force) return { decision: "backup" };
  if (ctx.yes) return { decision: "skip", note: "already exists, use --force to overwrite" };
  if (ctx.dryRun) return { decision: "skip", note: "already exists, would ask what to do" };

  const { choice } = await inquirer.prompt([
    {
      type: "list",
      name: "choice",
      message: `${rel} already exists. What should I do?`,
      default: "skip",
      choices: [
        { name: "Skip (keep my file)", value: "skip" },
        { name: "Overwrite", value: "overwrite" },
        { name: "Overwrite and keep a .bak backup", value: "backup" },
      ],
    },
  ]);
  return { decision: choice as Decision, note: choice === "skip" ? "already exists, kept" : undefined };
}

/** Writes a file, applying the conflict rules when it already exists. */
export async function writeManaged(
  ctx: FileContext,
  rel: string,
  content: string
): Promise<FileResult> {
  const abs = path.join(ctx.root, rel);

  if (!(await fs.pathExists(abs))) {
    if (!ctx.dryRun) {
      await fs.ensureDir(path.dirname(abs));
      await fs.writeFile(abs, content);
    }
    return { path: rel, action: "created" };
  }

  const existing = await fs.readFile(abs, "utf8");
  if (normalizeEol(existing) === normalizeEol(content)) {
    return { path: rel, action: "skipped", note: "already up to date" };
  }

  const { decision, note } = await decide(ctx, rel);
  if (decision === "skip") return { path: rel, action: "skipped", note };

  const backup = decision === "backup" ? await backupFile(ctx, abs) : undefined;
  if (!ctx.dryRun) await fs.writeFile(abs, content);
  return { path: rel, action: "overwritten", backup };
}
