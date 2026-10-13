import { NextRequest, NextResponse } from "next/server";
import { updateProfile } from "../../../../lib/auth/account";
import { toPublicUser } from "../../../../lib/auth/public-user";
import { getRequestUser } from "../../../../lib/auth/request";
import { isSameOrigin } from "../../../../lib/csrf";
import { jsonError, logError, readJson, serverError, validationError } from "../../../../lib/http";
import { profileSchema } from "../../../../lib/validators";

export const dynamic = "force-dynamic"; // nextauthforge:dynamic

// Only the display name can be changed (there is no email-change flow).
export async function PATCH(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return jsonError("Forbidden", 403);

    const user = await getRequestUser(request);
    if (!user) return jsonError("Not authenticated", 401);

    const parsed = profileSchema.safeParse(await readJson(request));
    if (!parsed.success) return validationError(parsed.error);

    const updated = await updateProfile(user.id, parsed.data.name);
    if (!updated) return jsonError("Not authenticated", 401);

    return NextResponse.json({ success: true, user: toPublicUser(updated) }, { status: 200 });
  } catch (error) {
    logError("profile", error);
    return serverError();
  }
}
