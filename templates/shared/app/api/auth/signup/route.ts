import { NextRequest, NextResponse } from "next/server";
import { registerUser } from "../../../../lib/auth/service";
import { setSessionCookies } from "../../../../lib/auth/cookies";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientMeta, jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { signupSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const meta = getClientMeta(request);
    const limit = await limiters.signup.check(meta.ip ?? "unknown");
    if (!limit.allowed) return tooManyRequests(limit);

    const parsed = signupSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const result = await registerUser(parsed.data, meta);
    if (!result.ok) {
      // Signup tells the user the email is taken (a deliberate usability
      // trade-off: it does reveal that an account exists).
      return jsonError("An account with this email already exists", 409);
    }

    const response = NextResponse.json({ success: true, user: result.user }, { status: 201 });
    setSessionCookies(response, result.tokens);
    return response;
  } catch (error) {
    logError("signup", error);
    return serverError();
  }
}
