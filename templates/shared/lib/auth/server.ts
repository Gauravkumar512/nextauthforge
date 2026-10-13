import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "../auth-config";
import type { User } from "../db/types";
import { getUserFromAccessToken } from "./service";

/**
 * The signed-in user for Server Components and route handlers, or null.
 * Deduplicated per request. Server Components can't set cookies, so token
 * refreshing is left to the proxy.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(authConfig.cookies.accessName)?.value;
  if (!token) return null;
  return getUserFromAccessToken(token);
});

/** Like getCurrentUser, but redirects to the login page when signed out. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(authConfig.loginPath);
  return user;
}
