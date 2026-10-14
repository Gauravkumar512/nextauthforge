import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "../../../../lib/auth-config";
import { clearSessionCookies, setSessionCookies } from "../../../../lib/auth/cookies";
import { rotateSession } from "../../../../lib/auth/service";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientMeta, jsonError, logError, serverError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { safeNext } from "../../../../lib/safe-redirect";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

// POST: for client code. Rotates the tokens and answers with JSON.
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const meta = getClientMeta(request);
    const limit = await limiters.refresh.check(meta.ip ?? "unknown");
    if (!limit.allowed) return tooManyRequests(limit);

    const refreshToken = request.cookies.get(authConfig.cookies.refreshName)?.value;
    if (!refreshToken) return jsonError("Not authenticated", 401);

    const result = await rotateSession(refreshToken, meta);
    if (!result.ok) {
      const response = jsonError("Not authenticated", 401);
      // Lost a race with a concurrent refresh: the winner already set new
      // cookies, so leave the browser's cookies alone.
      if (result.reason === "raced") return response;
      clearSessionCookies(response);
      return response;
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    setSessionCookies(response, result.tokens);
    return response;
  } catch (error) {
    logError("refresh", error);
    return serverError();
  }
}

// GET: used by the proxy for page navigations. Rotates the tokens, then
// redirects to ?next= (same-origin paths only) or to the login page.
export async function GET(request: NextRequest) {
  const next = safeNext(request.nextUrl.searchParams.get("next"), authConfig.afterLoginPath);
  // Read outside the try: Next signals "this route is dynamic" by throwing
  // from request APIs, and that must not be caught.
  const refreshToken = request.cookies.get(authConfig.cookies.refreshName)?.value;
  const toLogin = () => {
    const url = new URL(authConfig.loginPath, request.url);
    url.searchParams.set("next", next);
    const response = NextResponse.redirect(url);
    clearSessionCookies(response);
    return response;
  };

  try {
    const meta = getClientMeta(request);
    const limit = await limiters.refresh.check(meta.ip ?? "unknown");
    if (!limit.allowed) return tooManyRequests(limit);

    if (!refreshToken) return toLogin();

    const result = await rotateSession(refreshToken, meta);
    if (!result.ok) {
      // Lost a race with a concurrent refresh (see refreshReuseGraceSeconds):
      // keep the cookies the winner set and just continue to the page.
      if (result.reason === "raced") return NextResponse.redirect(new URL(next, request.url));
      return toLogin();
    }

    const response = NextResponse.redirect(new URL(next, request.url));
    setSessionCookies(response, result.tokens);
    return response;
  } catch (error) {
    logError("refresh", error);
    return serverError();
  }
}
