import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

/** Opaque 256-bit random token (refresh tokens, email links). */
export function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export const generateRefreshToken = generateToken;

/** Tokens are only ever stored as this hash. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time string comparison. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
