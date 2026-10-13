import { NextRequest, NextResponse } from "next/server";
import { changePassword } from "../../../../lib/auth/account";
import { setSessionCookies } from "../../../../lib/auth/cookies";
import { getRequestUser } from "../../../../lib/auth/request";
import { isSameOrigin } from "../../../../lib/csrf";
import { getClientMeta, jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { limiters, tooManyRequests } from "../../../../lib/rate-limit";
import { changePasswordSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const user = await getRequestUser(request);
    if (!user) return jsonError("Not authenticated", 401);

    const limit = await limiters.changePassword.check(user.id);
    if (!limit.allowed) return tooManyRequests(limit);

    const parsed = changePasswordSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const result = await changePassword(
      user.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
      getClientMeta(request)
    );
    if (!result.ok) return jsonError("Current password is incorrect", 400);

    // Every session (including this one) was revoked; this device gets a new one.
    const response = NextResponse.json({ success: true }, { status: 200 });
    setSessionCookies(response, result.tokens);
    return response;
  } catch (error) {
    logError("change-password", error);
    return serverError();
  }
}
