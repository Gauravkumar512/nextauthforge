import { NextResponse,NextRequest } from "next/server";
import { COOKIE_NAME } from "@/src/lib/auth-config";

export async function POST(request: NextRequest){
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
        
    } catch (error: any) {
        return NextResponse.json({error: error.message},{status: 500})
    }
}