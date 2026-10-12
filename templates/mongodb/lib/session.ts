import { cookies } from "next/headers";
import { COOKIE_NAME } from "./auth-config";

export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value ?? null;
}