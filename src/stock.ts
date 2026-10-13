/**
 * True when `source` looks like the untouched app/page.tsx that create-next-app
 * generates (every recent version links to its templates with a
 * utm_source=create-next-app URL and uses next/image for the logo). A page the
 * user has rewritten loses those markers, so it is never matched.
 */
export function isStockNextPage(source: string): boolean {
  if (source.length > 8000) return false;
  const fromCreateNextApp = source.includes("utm_source=create-next-app");
  const usesNextImage = /from\s+["']next\/image["']/.test(source);
  const boilerplateCopy =
    /Get started by editing|To get started, edit the|Deploy now|Looking for a starting point or more instructions/.test(source);
  return fromCreateNextApp && usesNextImage && boilerplateCopy;
}
