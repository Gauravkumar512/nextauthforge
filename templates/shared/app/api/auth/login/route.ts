import { NextRequest, NextResponse } from "next/server";
import { toPublicUser } from "../../../../lib/auth/public-user";
import { loginUser } from "../../../../lib/auth/service";
import { setSessionCookies } from "../../../../lib/auth/cookies";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientMeta, jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { loginSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const meta = getClientMeta(request);
    const ip = meta.ip ?? "unknown";

    const ipLimit = await limiters.loginIp.check(ip);
    if (!ipLimit.allowed) return tooManyRequests(ipLimit);

    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const key = `${ip}:${parsed.data.email}`;
    const limit = await limiters.login.check(key);
    if (!limit.allowed) return tooManyRequests(limit);

    const result = await loginUser(parsed.data, meta);
    if (!result.ok) {
      // Only reachable with the correct password, so it does not help guessing.
      if (result.reason === "unverified") {
        return NextResponse.json(
          { error: "Please verify your email before signing in", code: "EMAIL_NOT_VERIFIED" },
          { status: 403 }
        );
      }
      // Identical for "no such email" and "wrong password".
      return jsonError("Invalid email or password", 401);
    }

    await limiters.login.reset(key);

    const response = NextResponse.json({ success: true, user: toPublicUser(result.user) }, { status: 200 });
    setSessionCookies(response, result.tokens);
    return response;
  } catch (error) {
    logError("login", error);
    return serverError();
  }
}
