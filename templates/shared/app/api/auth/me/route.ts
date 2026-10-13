import { NextRequest, NextResponse } from "next/server";
import { authConfig } from "../../../../lib/auth-config";
import { getUserFromAccessToken } from "../../../../lib/auth/service";
import { jsonError, logError, serverError } from "../../../../lib/http";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

export async function GET(request: NextRequest) {
  // Look at the cookie first: signed-out requests never touch env or the DB.
  // (Outside the try on purpose: Next signals "this route is dynamic" by
  // throwing from request APIs, and that must not be caught and logged.)
  const token = request.cookies.get(authConfig.cookies.accessName)?.value;
  if (!token) return jsonError("Not authenticated", 401);

  try {
    // Verifies the JWT, then loads the user.
    const user = await getUserFromAccessToken(token);
    if (!user) return jsonError("Not authenticated", 401);

    return NextResponse.json(
      { success: true, user },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    logError("me", error);
    return serverError();
  }
}
