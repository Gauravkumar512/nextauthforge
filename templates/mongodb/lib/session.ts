import { cookies } from "next/headers";

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(process.env.COOKIE_NAME!)?.value ?? null;
}