// Client-safe on purpose (no imports): the login/signup pages use it too.

const DEFAULT_NEXT = "/dashboard";
// Control characters (browsers strip some of them from URLs) and backslashes
// (browsers treat "/\host" like "//host").
function hasUnsafeChars(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f || code === 0x5c) return true;
  }
  return false;
}

/**
 * Only same-origin relative paths are allowed ("/dashboard", "/a/b?x=1").
 * Anything else (absolute URLs, "//host", "/\host", "javascript:", control
 * characters, and encoded versions of those) falls back to `fallback`.
 */
export function safeNext(value: unknown, fallback: string = DEFAULT_NEXT): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 2048) {
    return fallback;
  }

  // Check the raw value and every percent-decoded form (up to 3 layers), so
  // "%2F%2Fevil.com" and "/%5Cevil.com" are caught too.
  const forms = [value];
  let current = value;
  for (let i = 0; i < 3; i++) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(current);
    } catch {
      return fallback;
    }
    if (decoded === current) break;
    forms.push(decoded);
    current = decoded;
  }

  for (const form of forms) {
    if (hasUnsafeChars(form)) return fallback;
    if (!form.startsWith("/") || form.startsWith("//")) return fallback;
  }

  // Final check with a real URL parser: it must stay on the same origin.
  try {
    if (new URL(value, "http://localhost").origin !== "http://localhost") return fallback;
  } catch {
    return fallback;
  }

  return value;
}
