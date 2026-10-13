import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";
import { fieldErrors } from "./validators";

export const GENERIC_ERROR = "Something went wrong";

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function serverError() {
  return jsonError(GENERIC_ERROR, 500);
}

export function validationError(error: z.ZodError) {
  return NextResponse.json(
    { error: "Please check the highlighted fields", fields: fieldErrors(error) },
    { status: 400 }
  );
}

/** Parsed JSON body, or null when it is missing or malformed. */
export async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * First entry of x-forwarded-for, falling back to x-real-ip.
 * These headers are only trustworthy behind a reverse proxy that sets them
 * (Vercel, Nginx, Cloudflare, ...). Without one a client can spoof its IP,
 * which weakens (but doesn't break) the per-IP rate limits.
 */
export function getClientIp(request: NextRequest): string {
  const candidate =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "";
  return /^[0-9a-fA-F:.]{2,45}$/.test(candidate) ? candidate : "unknown";
}

export function getClientMeta(request: NextRequest) {
  return {
    ip: getClientIp(request),
    userAgent: request.headers.get("user-agent")?.slice(0, 512) ?? null,
  };
}

/** Logs only the error name and message: never the full object, which can carry user data. */
export function logError(scope: string, error: unknown) {
  const detail = error instanceof Error ? `${error.name}: ${error.message}` : "unknown error";
  console.error(`[auth] ${scope} failed - ${detail}`);
}
