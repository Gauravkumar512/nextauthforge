import type { NextRequest } from "next/server";

function hostOf(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).host;
  } catch {
    return null; // includes the literal string "null" some browsers send
  }
}

/**
 * Same-origin check for state-changing requests.
 *
 * Origin is compared to the Host the request was sent to (Referer is the
 * fallback). A mismatch is rejected.
 *
 * If neither header is present the request is allowed unless the browser says
 * (Sec-Fetch-Site) that it is cross-site. That is safe because every browser
 * sends Origin on cross-origin POSTs and Sec-Fetch-Site on all requests, so a
 * request with none of them is not a browser (curl, server-to-server) and a
 * CSRF attack needs a browser. Cookies are also sameSite=lax, so cross-site
 * POSTs don't carry them anyway; this check is defence in depth.
 */
export function isSameOrigin(request: NextRequest): boolean {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return false;

  const origin = request.headers.get("origin");
  if (origin !== null) return hostOf(origin) === host;

  const referer = request.headers.get("referer");
  if (referer !== null) return hostOf(referer) === host;

  const fetchSite = request.headers.get("sec-fetch-site");
  return fetchSite === null || fetchSite === "same-origin" || fetchSite === "none";
}
