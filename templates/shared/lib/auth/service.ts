import { randomUUID } from "node:crypto";
import { authConfig } from "../auth-config";
import { getDb } from "../db";
import { DuplicateEmailError, type RefreshTokenRecord, type User, type UserWithPassword } from "../db/types";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../hash";
import { signAccessToken, verifyAccessToken } from "../jwt";
import { generateRefreshToken, hashToken, safeEqual, type SessionTokens } from "./tokens";

// All auth logic lives here and talks to the database only through the
// repository interfaces in lib/db/types.ts. Route handlers call this file.

export interface ClientMeta {
  ip: string | null;
  userAgent: string | null;
}

function toPublicUser(user: UserWithPassword): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function createRefreshToken(
  userId: string,
  familyId: string,
  meta: ClientMeta
): Promise<{ token: string; record: RefreshTokenRecord }> {
  const db = await getDb();
  const token = generateRefreshToken();
  const record = await db.refreshTokens.create({
    userId,
    tokenHash: hashToken(token),
    familyId,
    expiresAt: new Date(Date.now() + authConfig.tokens.refreshTtlSeconds * 1000),
    userAgent: meta.userAgent,
    ip: meta.ip,
  });
  return { token, record };
}

/** Starts a brand-new session (new token family). */
export async function startSession(user: User, meta: ClientMeta): Promise<SessionTokens> {
  const { token } = await createRefreshToken(user.id, randomUUID(), meta);
  return { accessToken: await signAccessToken(user.id), refreshToken: token };
}

export type AuthResult =
  | { ok: true; user: User; tokens: SessionTokens }
  | { ok: false; reason?: "unverified" };

export type RegisterResult =
  // `tokens` is null when requireEmailVerification is on: no session until verified.
  | { ok: true; user: User; tokens: SessionTokens | null }
  | { ok: false; reason: "email_taken" };

export async function registerUser(
  input: { name: string; email: string; password: string },
  meta: ClientMeta
): Promise<RegisterResult> {
  const db = await getDb();
  const passwordHash = await hashPassword(input.password);

  let user: User;
  try {
    user = await db.users.create({ name: input.name, email: input.email, passwordHash });
  } catch (error) {
    if (error instanceof DuplicateEmailError) return { ok: false, reason: "email_taken" };
    throw error;
  }

  const tokens = authConfig.requireEmailVerification ? null : await startSession(user, meta);
  return { ok: true, user, tokens };
}

export async function loginUser(
  input: { email: string; password: string },
  meta: ClientMeta
): Promise<AuthResult> {
  const db = await getDb();
  const found = await db.users.findByEmailWithPassword(input.email);

  if (!found) {
    // Same amount of work as a real check so timing doesn't reveal whether
    // the email exists.
    await burnPasswordCheck(input.password);
    return { ok: false };
  }

  if (!(await verifyPassword(input.password, found.passwordHash))) return { ok: false };

  // Only reached with the CORRECT password, so this doesn't reveal which
  // emails exist to someone guessing.
  if (authConfig.requireEmailVerification && !found.emailVerifiedAt) {
    return { ok: false, reason: "unverified" };
  }

  const user = toPublicUser(found);
  return { ok: true, user, tokens: await startSession(user, meta) };
}

export type RotateResult =
  | { ok: true; user: User; tokens: SessionTokens }
  // "raced": the token was rotated moments ago by a concurrent request (see
  // refreshReuseGraceSeconds). Nothing is revoked or cleared in that case.
  | { ok: false; reason: "invalid" | "expired" | "reused" | "raced" };

/**
 * Exchanges a refresh token for a new access + refresh pair (rotation).
 * Presenting a token that was already rotated or revoked revokes the whole
 * family: it means the token was stolen or replayed.
 *
 * Two requests racing with the same token (e.g. parallel prefetches after the
 * access token expired) are tolerated for refreshReuseGraceSeconds: the loser
 * gets "raced" and the session carries on with the winner's new tokens.
 */
export async function rotateSession(refreshToken: string, meta: ClientMeta): Promise<RotateResult> {
  const db = await getDb();
  const hash = hashToken(refreshToken);

  const record = await db.refreshTokens.findByHash(hash);
  if (!record || !safeEqual(record.tokenHash, hash)) return { ok: false, reason: "invalid" };

  if (record.revokedAt) {
    const rotatedRecently =
      record.replacedByTokenId !== null &&
      Date.now() - record.revokedAt.getTime() < authConfig.tokens.refreshReuseGraceSeconds * 1000;
    if (rotatedRecently) return { ok: false, reason: "raced" };

    await db.refreshTokens.revokeFamily(record.familyId);
    return { ok: false, reason: "reused" };
  }
  if (record.expiresAt.getTime() <= Date.now()) return { ok: false, reason: "expired" };

  const user = await db.users.findById(record.userId);
  if (!user) {
    await db.refreshTokens.revokeFamily(record.familyId);
    return { ok: false, reason: "invalid" };
  }

  const next = await createRefreshToken(user.id, record.familyId, meta);
  const claimed = await db.refreshTokens.revokeIfActive(record.id, next.record.id);
  if (!claimed) {
    // Someone else rotated this exact token between our read and now: that is
    // the same benign race, so don't revoke. Discard the token we just made.
    await db.refreshTokens.revokeIfActive(next.record.id, null);
    return { ok: false, reason: "raced" };
  }

  return {
    ok: true,
    user,
    tokens: { accessToken: await signAccessToken(user.id), refreshToken: next.token },
  };
}

/** Server-side logout: revokes the refresh token's whole family. */
export async function revokeSession(refreshToken: string): Promise<void> {
  const db = await getDb();
  const record = await db.refreshTokens.findByHash(hashToken(refreshToken));
  if (record) await db.refreshTokens.revokeFamily(record.familyId);
}

/** The owner of a still-valid refresh token, or null (used by logout-all). */
export async function getUserIdByRefreshToken(refreshToken: string): Promise<string | null> {
  const db = await getDb();
  const hash = hashToken(refreshToken);
  const record = await db.refreshTokens.findByHash(hash);
  if (!record || !safeEqual(record.tokenHash, hash)) return null;
  if (record.revokedAt || record.expiresAt.getTime() <= Date.now()) return null;
  return record.userId;
}

/** Verifies the JWT first (no DB access for bad tokens), then loads the user. */
export async function getUserFromAccessToken(accessToken: string): Promise<User | null> {
  const userId = await verifyAccessToken(accessToken);
  if (!userId) return null;
  const db = await getDb();
  return db.users.findById(userId);
}
