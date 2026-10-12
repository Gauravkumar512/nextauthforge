import { NextResponse } from "next/server";
import { COOKIE_NAME } from "../../../../lib/auth-config";

export async function POST(){
    try {
        const response = NextResponse.json({
            message: 'Logout successfully',
            success: true
        },
    {
        status: 200
    })
        
    response.cookies.set(COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response
        
    } catch (error) {
        console.error("[auth] request failed:", error);
        return NextResponse.json({error: "Something went wrong"},{status: 500})
    }
}