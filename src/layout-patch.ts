import path from "path";
import fs from "fs-extra";
import { ProjectInfo } from "./detect";
import { FileContext, FileResult, backupFile } from "./fileops";

export interface ManualStep {
  path: string;
  reason: string;
  snippet: string;
}

export interface LayoutPatchOutcome {
  result: FileResult;
  /** Set when the layout could not be patched safely. */
  manual?: ManualStep;
}

type PatchSource =
  | { kind: "patched"; content: string }
  | { kind: "already" }
  | { kind: "unrecognised"; reason: string };

const IMPORT_RE = /^import\s[^;]*?(["'])[^"']+\1;?[ \t]*$/gm;

/** Index just past the `>` that closes the opening <body ...> tag, or -1. */
function findBodyOpenEnd(src: string, bodyStart: number): number {
  let depth = 0;
  let quote: string | null = null;
  for (let i = bodyStart + "<body".length; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") quote = ch;
    else if (ch === "{") depth++;
    else if (ch === "}") depth--;
    else if (ch === ">" && depth === 0) return src[i - 1] === "/" ? -1 : i + 1;
  }
  return -1;
}

export function patchLayoutSource(source: string, importPath: string): PatchSource {
  if (/<ToasterProvider[\s/>]/.test(source)) return { kind: "already" };

  const eol = source.includes("\r\n") ? "\r\n" : "\n";

  const imports = [...source.matchAll(IMPORT_RE)];
  if (imports.length === 0) {
    return { kind: "unrecognised", reason: "no import statements found" };
  }
  const lastImport = imports[imports.length - 1];
  const importEnd = lastImport.index! + lastImport[0].length;
  const quote = lastImport[1];
  const semi = lastImport[0].trimEnd().endsWith(";") ? ";" : "";

  const bodies = [...source.matchAll(/<body(?=[\s>/])/g)];
  if (bodies.length !== 1) {
    return {
      kind: "unrecognised",
      reason: bodies.length === 0 ? "no <body> tag found" : "more than one <body> tag found",
    };
  }
  const bodyStart = bodies[0].index!;
  const bodyEnd = findBodyOpenEnd(source, bodyStart);
  if (bodyEnd === -1 || bodyEnd <= importEnd) {
    return { kind: "unrecognised", reason: "could not parse the opening <body> tag" };
  }

  const restOfLine = source.slice(bodyEnd).split(/\r?\n/, 1)[0];
  if (restOfLine.trim() !== "") {
    return { kind: "unrecognised", reason: "content follows <body> on the same line" };
  }

  const lineStart = source.lastIndexOf("\n", bodyStart) + 1;
  const bodyIndent = source.slice(lineStart, bodyStart).match(/^[ \t]*/)![0];
  const indent = bodyIndent + (bodyIndent.includes("\t") ? "\t" : "  ");

  const importLine = `import { ToasterProvider } from ${quote}${importPath}${quote}${semi}`;

  // Apply the later edit first so earlier indexes stay valid.
  let content =
    source.slice(0, bodyEnd) + eol + indent + "<ToasterProvider />" + source.slice(bodyEnd);
  content = content.slice(0, importEnd) + eol + importLine + content.slice(importEnd);
  return { kind: "patched", content };
}

export function toasterImportPath(layoutRel: string, baseDir: string): string {
  const target = path.posix.join(baseDir, "components/ToasterProvider");
  const rel = path.posix.relative(path.posix.dirname(layoutRel), target);
  return rel.startsWith(".") ? rel : `./${rel}`;
}

export function manualSnippet(importPath: string): string {
  return [
    `import { ToasterProvider } from "${importPath}";`,
    "",
    "// ...and inside <body>:",
    "<ToasterProvider />",
  ].join("\n");
}

export async function patchLayout(
  ctx: FileContext,
  project: ProjectInfo
): Promise<LayoutPatchOutcome> {
  const layoutRel = path.posix.join(project.baseDir, "app/layout.tsx");
  const layoutAbs = path.join(ctx.root, layoutRel);
  const importPath = toasterImportPath(layoutRel, project.baseDir);

  const manual = (reason: string): LayoutPatchOutcome => ({
    result: { path: layoutRel, action: "skipped", note: `needs a manual edit (${reason})` },
    manual: { path: layoutRel, reason, snippet: manualSnippet(importPath) },
  });

  if (!(await fs.pathExists(layoutAbs))) return manual("file not found");

  const source = await fs.readFile(layoutAbs, "utf8");
  const patch = patchLayoutSource(source, importPath);

  if (patch.kind === "already") {
    return { result: { path: layoutRel, action: "skipped", note: "<ToasterProvider /> already mounted" } };
  }
  if (patch.kind === "unrecognised") return manual(patch.reason);

  const backup = await backupFile(ctx, layoutAbs);
  if (!ctx.dryRun) await fs.writeFile(layoutAbs, patch.content);
  return { result: { path: layoutRel, action: "patched", backup } };
}
