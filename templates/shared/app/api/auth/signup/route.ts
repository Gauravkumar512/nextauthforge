import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "../../../../lib/auth/account";
import { toPublicUser } from "../../../../lib/auth/public-user";
import { registerUser } from "../../../../lib/auth/service";
import { runAfterResponse } from "../../../../lib/after";
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

    // The verification email always goes out, but after the response.
    runAfterResponse(() => sendVerificationEmail(result.user));

    if (result.tokens === null) {
      // requireEmailVerification: the account exists but there is no session yet.
      return NextResponse.json({ success: true, requiresVerification: true }, { status: 201 });
    }

    const response = NextResponse.json(
      { success: true, user: toPublicUser(result.user), requiresVerification: false },
      { status: 201 }
    );
    setSessionCookies(response, result.tokens);
    return response;
  } catch (error) {
    logError("signup", error);
    return serverError();
  }
}
