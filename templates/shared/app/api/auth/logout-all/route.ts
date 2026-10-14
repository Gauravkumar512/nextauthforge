import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "../../../../lib/auth-config";
import { logoutAllDevices } from "../../../../lib/auth/account";
import { clearSessionCookies } from "../../../../lib/auth/cookies";
import { getRequestUser } from "../../../../lib/auth/request";
import { getUserIdByRefreshToken } from "../../../../lib/auth/service";
import { isSameOrigin } from "../../../../lib/csrf";
import { jsonError, logError, serverError } from "../../../../lib/http";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

// Signs the user out everywhere. Works with an expired access token as long as
// the refresh cookie is still valid.
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    let userId = (await getRequestUser(request))?.id ?? null;
    if (!userId) {
      const refreshToken = request.cookies.get(authConfig.cookies.refreshName)?.value;
      if (refreshToken) userId = await getUserIdByRefreshToken(refreshToken);
    }
    if (!userId) return jsonError("Not authenticated", 401);

    await logoutAllDevices(userId);

    const response = NextResponse.json({ success: true }, { status: 200 });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    logError("logout-all", error);
    return serverError();
  }
}
