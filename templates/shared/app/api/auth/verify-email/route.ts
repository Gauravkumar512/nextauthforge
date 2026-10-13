import { NextRequest, NextResponse } from "next/server";
import { verifyEmail } from "../../../../lib/auth/account";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientIp, jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { verifyEmailSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const limit = await limiters.verifyEmail.check(getClientIp(request));
    if (!limit.allowed) return tooManyRequests(limit);

    const parsed = verifyEmailSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const ok = await verifyEmail(parsed.data.token);
    // Same answer for an unknown, expired or already used token.
    if (!ok) return jsonError("This link is invalid or has expired", 400);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    logError("verify-email", error);
    return serverError();
  }
}
