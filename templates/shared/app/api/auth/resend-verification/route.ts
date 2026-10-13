import { NextRequest, NextResponse } from "next/server";
import { runAfterResponse } from "../../../../lib/after";
import { resendVerification } from "../../../../lib/auth/account";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientIp, jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { resendVerificationSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

// Always the same answer: unknown email, already verified, in cooldown, or sent.
const RESPONSE = {
  success: true,
  message: "If that account needs verification, a new email is on its way.",
};

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const ipLimit = await limiters.resendVerificationIp.check(getClientIp(request));
    if (!ipLimit.allowed) return tooManyRequests(ipLimit);

    const parsed = resendVerificationSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const emailLimit = await limiters.resendVerificationEmail.check(parsed.data.email);
    if (!emailLimit.allowed) return tooManyRequests(emailLimit);

    // Lookup, cooldown check and send all run after the response.
    runAfterResponse(() => resendVerification(parsed.data.email));

    return NextResponse.json(RESPONSE, { status: 200 });
  } catch (error) {
    logError("resend-verification", error);
    return serverError();
  }
}
