import type { NextResponse } from "next/server";
import { authConfig } from "../auth-config";
import type { SessionTokens } from "./tokens";

const { cookies, tokens } = authConfig;

const base = {
  httpOnly: cookies.httpOnly,
  secure: cookies.secure,
  sameSite: cookies.sameSite,
};

export function setSessionCookies(response: NextResponse, session: SessionTokens): void {
  // The access cookie deliberately lives as long as the refresh token even
  // though the JWT inside expires after minutes: an expired-but-present token
  // is how the proxy knows a session exists and sends the user through
  // /api/auth/refresh. The JWT's own `exp` is what actually limits access.
  response.cookies.set(cookies.accessName, session.accessToken, {
    ...base,
    path: "/",
    maxAge: tokens.refreshTtlSeconds,
  });
  response.cookies.set(cookies.refreshName, session.refreshToken, {
    ...base,
    path: cookies.refreshPath,
    maxAge: tokens.refreshTtlSeconds,
  });
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(cookies.accessName, "", { ...base, path: "/", maxAge: 0 });
  response.cookies.set(cookies.refreshName, "", { ...base, path: cookies.refreshPath, maxAge: 0 });
}
