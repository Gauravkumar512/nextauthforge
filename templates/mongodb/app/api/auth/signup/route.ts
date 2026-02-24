import { NextRequest, NextResponse } from "next/server";
import { User } from "@/src/models/user.models";
import { connect } from "@/src/lib/dbConfig";
import { hashedPassword } from "@/src/lib/hash";
import { signJWT } from "@/src/lib/jwt";

export async function POST(request: NextRequest) {
  try {
    await connect();

    const { username, email, password, confirmPassword } = await request.json();

    if (!username || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "Fields can't be empty" },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: "Both passwords should match" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username or Email already exists" },
        { status: 409 }
      );
    }

    const hashPass = await hashedPassword(password);
    const savedUser = await new User({ username, email, password: hashPass }).save();

    const token = await signJWT({ id: savedUser._id.toString(), email: savedUser.email });

    const response = NextResponse.json(
      { message: "Account created successfully", success: true },
      { status: 201 }
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