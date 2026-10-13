import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "./lib/auth-config";
import { verifyAccessToken } from "./lib/jwt";

// Edge-safe: only jose (via lib/jwt) is used here. No database, no bcrypt.

const matches = (routes: string[], pathname: string) =>
  routes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(authConfig.cookies.accessName)?.value;

  // Reachable by everyone, signed in or not (reset/verify links).
  if (matches(authConfig.publicRoutes, pathname)) return NextResponse.next();

  if (matches(authConfig.protectedRoutes, pathname)) {
    const original = pathname + search;

    // Never signed in (or signed out): go to the login page.
    if (!token) {
      const url = new URL(authConfig.loginPath, request.url);
      url.searchParams.set("next", original);
      return NextResponse.redirect(url);
    }

    if (await verifyAccessToken(token)) return NextResponse.next();

    // Expired or invalid token: the refresh route (which can see the refresh
    // cookie) renews the session and sends the user back, or to /login.
    const url = new URL("/api/auth/refresh", request.url);
    url.searchParams.set("next", original);
    return NextResponse.redirect(url);
  }

  if (matches(authConfig.authRoutes, pathname) && token && (await verifyAccessToken(token))) {
    return NextResponse.redirect(new URL(authConfig.afterLoginPath, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Static (the matcher can't reference imports); the route lists above are
  // applied inside the function. Skips API routes, Next internals and files.
  matcher: ["/((?!api/|_next/|favicon.ico|.*\\..*).*)"],
};
