import { NextRequest, NextResponse } from "next/server";
import { runAfterResponse } from "../../../../lib/after";
import { requestPasswordReset } from "../../../../lib/auth/account";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientIp, jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { forgotPasswordSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

// Always the same answer, whether or not the account exists.
const RESPONSE = {
  success: true,
  message: "If an account exists for that email, a password reset link is on its way.",
};

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const ipLimit = await limiters.forgotPasswordIp.check(getClientIp(request));
    if (!ipLimit.allowed) return tooManyRequests(ipLimit);

    const parsed = forgotPasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    // Counted per email even for unknown ones, so the limit leaks nothing.
    const emailLimit = await limiters.forgotPasswordEmail.check(parsed.data.email);
    if (!emailLimit.allowed) return tooManyRequests(emailLimit);

    // The lookup AND the send happen after the response, so how long this
    // request takes doesn't depend on whether the account exists.
    runAfterResponse(() => requestPasswordReset(parsed.data.email));

    return NextResponse.json(RESPONSE, { status: 200 });
  } catch (error) {
    logError("forgot-password", error);
    return serverError();
  }
}
