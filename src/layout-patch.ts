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
  /** Set when (part of) the layout could not be patched safely. */
  manual?: ManualStep;
}

export interface ProviderImports {
  toaster: string;
  auth: string;
}

type PatchSource =
  | { kind: "patched"; content: string; added: string[]; missing?: { reason: string; snippet: string } }
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

export function manualSnippet(imports: ProviderImports, need: { toaster: boolean; auth: boolean }): string {
  return [
    ...(need.toaster ? [`import { ToasterProvider } from "${imports.toaster}";`] : []),
    ...(need.auth ? [`import { AuthProvider } from "${imports.auth}";`] : []),
    "",
    "// ...and inside <body>:",
    ...(need.toaster ? ["<ToasterProvider />"] : []),
    ...(need.auth ? ["<AuthProvider>{children}</AuthProvider>"] : []),
  ].join("\n");
}

/**
 * Mounts <ToasterProvider /> right after the opening <body> tag and wraps
 * {children} in <AuthProvider>. Each is added only if it isn't there yet, so
 * re-running changes nothing.
 */
export function patchLayoutSource(source: string, imports: ProviderImports): PatchSource {
  const needToaster = !/<ToasterProvider[\s/>]/.test(source);
  const needAuth = !/<AuthProvider[\s>]/.test(source);
  if (!needToaster && !needAuth) return { kind: "already" };

  const eol = source.includes("\r\n") ? "\r\n" : "\n";

  const importMatches = [...source.matchAll(IMPORT_RE)];
  if (importMatches.length === 0) {
    return { kind: "unrecognised", reason: "no import statements found" };
  }
  const lastImport = importMatches[importMatches.length - 1];
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

  // One-line bodies (<body className="..">{children}</body>) get the component inline.
  const sameLine = source.slice(bodyEnd).split(/\r?\n/, 1)[0].trim() !== "";
  const lineStart = source.lastIndexOf("\n", bodyStart) + 1;
  const bodyIndent = source.slice(lineStart, bodyStart).match(/^[ \t]*/)![0];
  const indent = bodyIndent + (bodyIndent.includes("\t") ? "\t" : "  ");

  // Edits as [position, characters to remove, text to insert]; applied from the end.
  const edits: Array<[number, number, string]> = [];
  const added: string[] = [];
  let missing: { reason: string; snippet: string } | undefined;

  if (needToaster) {
    const component = sameLine ? "<ToasterProvider />" : eol + indent + "<ToasterProvider />";
    edits.push([bodyEnd, 0, component]);
    added.push("ToasterProvider");
  }

  let authWrapped = false;
  if (needAuth) {
    const closeBody = source.indexOf("</body>", bodyEnd);
    const region = closeBody === -1 ? "" : source.slice(bodyEnd, closeBody);
    const childrenMatch = /\{\s*children\s*\}/.exec(region);
    if (childrenMatch) {
      const at = bodyEnd + childrenMatch.index;
      edits.push([at, childrenMatch[0].length, `<AuthProvider>${childrenMatch[0]}</AuthProvider>`]);
      added.push("AuthProvider");
      authWrapped = true;
    } else {
      missing = {
        reason: "{children} not found inside <body>",
        snippet: manualSnippet(imports, { toaster: false, auth: true }),
      };
    }
  }

  const importLines = [
    ...(needToaster ? [`import { ToasterProvider } from ${quote}${imports.toaster}${quote}${semi}`] : []),
    ...(authWrapped ? [`import { AuthProvider } from ${quote}${imports.auth}${quote}${semi}`] : []),
  ];
  if (importLines.length > 0) edits.push([importEnd, 0, eol + importLines.join(eol)]);

  if (edits.length === 0) {
    return { kind: "unrecognised", reason: missing?.reason ?? "nothing to patch" };
  }

  let content = source;
  // Highest position first; at the same position the replacement goes before the
  // insertion (a one-line body puts both at the same spot).
  for (const [pos, remove, insert] of edits.sort((a, b) => b[0] - a[0] || b[1] - a[1])) {
    content = content.slice(0, pos) + insert + content.slice(pos + remove);
  }
  return { kind: "patched", content, added, missing };
}

/** Import path from the layout file to a generated module, e.g. "../hooks/useAuth". */
export function importPathFor(layoutRel: string, baseDir: string, target: string): string {
  const rel = path.posix.relative(path.posix.dirname(layoutRel), path.posix.join(baseDir, target));
  return rel.startsWith(".") ? rel : `./${rel}`;
}

export async function patchLayout(
  ctx: FileContext,
  project: ProjectInfo
): Promise<LayoutPatchOutcome> {
  const layoutRel = path.posix.join(project.baseDir, "app/layout.tsx");
  const layoutAbs = path.join(ctx.root, layoutRel);
  const imports: ProviderImports = {
    toaster: importPathFor(layoutRel, project.baseDir, "components/ToasterProvider"),
    auth: importPathFor(layoutRel, project.baseDir, "hooks/useAuth"),
  };

  const manual = (reason: string, need = { toaster: true, auth: true }): LayoutPatchOutcome => ({
    result: { path: layoutRel, action: "skipped", note: `needs a manual edit: ${reason}` },
    manual: { path: layoutRel, reason, snippet: manualSnippet(imports, need) },
  });

  if (!(await fs.pathExists(layoutAbs))) return manual("file not found");

  const source = await fs.readFile(layoutAbs, "utf8");
  const patch = patchLayoutSource(source, imports);

  if (patch.kind === "already") {
    return {
      result: { path: layoutRel, action: "skipped", note: "<ToasterProvider /> and <AuthProvider> already mounted" },
    };
  }
  if (patch.kind === "unrecognised") {
    return manual(patch.reason, {
      toaster: !/<ToasterProvider[\s/>]/.test(source),
      auth: !/<AuthProvider[\s>]/.test(source),
    });
  }

  const backup = await backupFile(ctx, layoutAbs);
  if (!ctx.dryRun) await fs.writeFile(layoutAbs, patch.content);

  const result: FileResult = {
    path: layoutRel,
    action: "patched",
    note: `mounted ${patch.added.join(" + ")}`,
    backup,
  };
  if (patch.missing) {
    return {
      result,
      manual: { path: layoutRel, reason: patch.missing.reason, snippet: patch.missing.snippet },
    };
  }
  return { result };
}
