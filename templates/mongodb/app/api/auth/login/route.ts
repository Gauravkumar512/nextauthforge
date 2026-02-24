import { NextRequest, NextResponse } from "next/server";
import { User } from "@/src/models/user.models";
import { connect } from "@/src/lib/dbConfig";
import { comparePassword } from "@/src/lib/hash";
import { signJWT } from "@/src/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connect();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Fields can't be empty" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isPasswordCorrect = await comparePassword(password, user.password);

    if (!isPasswordCorrect) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signJWT({ id: user._id.toString(), email: user.email });

    const response = NextResponse.json(
      { message: "Login successfully", success: true },
      { status: 200 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}