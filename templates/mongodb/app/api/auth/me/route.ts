import { NextResponse } from "next/server";
import { User } from "@/src/models/user.models";
import { connect } from "@/src/lib/dbConfig";
import { verifyJWT } from "@/src/lib/jwt";
import { getSessionCookie } from "@/src/lib/session";

export async function GET() {
  try {
    await connect();

    const token = await getSessionCookie();

    if (!token) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token);

    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const user = await User.findById(payload.id).select("-password");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, user },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}