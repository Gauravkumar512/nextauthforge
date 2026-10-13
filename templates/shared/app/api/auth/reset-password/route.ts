import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "../../../../lib/auth/account";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientIp, jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { resetPasswordSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

// Doesn't sign the user in: the client sends them to the login page.
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const limit = await limiters.resetPassword.check(getClientIp(request));
    if (!limit.allowed) return tooManyRequests(limit);

    const parsed = resetPasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const ok = await resetPassword(parsed.data.token, parsed.data.password);
    // Same answer for an unknown, expired or already used token.
    if (!ok) return jsonError("This link is invalid or has expired", 400);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError("reset-password", error);
    return serverError();
  }
}
