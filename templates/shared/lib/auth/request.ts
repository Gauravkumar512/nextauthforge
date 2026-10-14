import type { NextRequest } from "next/server";
import { authConfig } from "../auth-config";
import type { User } from "../db/types";
import { getUserFromAccessToken } from "./service";

/**
 * The signed-in user behind a route handler request, or null. Reads the
 * cookie first so signed-out requests never touch env or the database.
 * (Call it from inside your try block; the cookie read is cheap.)
 */
export async function getRequestUser(request: NextRequest): Promise<User | null> {
  const token = request.cookies.get(authConfig.cookies.accessName)?.value;
  if (!token) return null;
  return getUserFromAccessToken(token);
}
