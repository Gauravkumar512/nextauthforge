import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "../../../../lib/auth-config";
import { clearSessionCookies } from "../../../../lib/auth/cookies";
import { revokeSession } from "../../../../lib/auth/service";
import { isSameOrigin } from "../../../../lib/csrf";
import { jsonError, logError, serverError } from "../../../../lib/http";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

// Works without a valid access token: only the refresh cookie is needed.
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const refreshToken = request.cookies.get(authConfig.cookies.refreshName)?.value;
    if (refreshToken) await revokeSession(refreshToken);

    const response = NextResponse.json({ success: true }, { status: 200 });
    clearSessionCookies(response);
    return response;
  } catch (error) {
    logError("logout", error);
    // Still drop the cookies locally even if the server-side revoke failed.
    const response = serverError();
    clearSessionCookies(response);
    return response;
  }
}
