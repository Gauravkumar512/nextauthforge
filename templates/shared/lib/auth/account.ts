import { authConfig } from "../auth-config";
import { getDb } from "../db";
import type { User, UserTokenType } from "../db/types";
import { sendEmail } from "../email";
import { passwordChangedContent, resetPasswordContent, verifyEmailContent } from "../email/templates";
import { getAppUrl } from "../env";
import { hashPassword, verifyPassword } from "../hash";
import { logError } from "../http";
import { startSession, type ClientMeta } from "./service";
import { generateToken, hashToken, type SessionTokens } from "./tokens";

// Email verification, password reset/change and profile updates. Like
// service.ts it only talks to the database through lib/db/types.ts.
//
// Raw tokens exist only in memory and in the emailed link; the database gets
// the sha256 hash. Nothing in here logs a token, a link or a password.

async function issueEmailToken(user: User, type: UserTokenType, ttlSeconds: number): Promise<string> {
  const db = await getDb();
  const token = generateToken();
  // Also invalidates the user's older unused tokens of this type.
  await db.tokens.createReplacing({
    userId: user.id,
    type,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
  });
  return token;
}

/** Sends the verification email. Never throws: failures are logged without the link. */
export async function sendVerificationEmail(user: User): Promise<void> {
  try {
    const token = await issueEmailToken(user, "email_verify", authConfig.tokens.verifyTokenTtlSeconds);
    const link = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`;
    await sendEmail({ to: user.email, ...verifyEmailContent({ name: user.name, link }) });
  } catch (error) {
    logError("verification email", error);
  }
}

async function sendPasswordResetEmail(user: User): Promise<void> {
  try {
    const token = await issueEmailToken(user, "password_reset", authConfig.tokens.resetTokenTtlSeconds);
    const link = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
    await sendEmail({ to: user.email, ...resetPasswordContent({ name: user.name, link }) });
  } catch (error) {
    logError("password reset email", error);
  }
}

async function sendPasswordChangedEmail(user: User): Promise<void> {
  try {
    await sendEmail({
      to: user.email,
      ...passwordChangedContent({ name: user.name, when: new Date() }),
    });
  } catch (error) {
    logError("password changed email", error);
  }
}

/**
 * Forgot-password: does nothing observable for unknown emails. Meant to be
 * run after the response (lib/after.ts) so timing can't reveal whether the
 * account exists.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  try {
    const db = await getDb();
    const user = await db.users.findByEmail(email);
    if (user) await sendPasswordResetEmail(user);
  } catch (error) {
    logError("password reset request", error);
  }
}

/**
 * Resend-verification: sends only for an existing, unverified user who is
 * outside the cooldown. Every other case is silent, so the caller can always
 * return the same response.
 */
export async function resendVerification(email: string): Promise<void> {
  try {
    const db = await getDb();
    const user = await db.users.findByEmail(email);
    if (!user || user.emailVerifiedAt) return;

    const last = await db.tokens.latestCreatedAt(user.id, "email_verify");
    if (last && Date.now() - last.getTime() < authConfig.tokens.resendCooldownSeconds * 1000) return;

    await sendVerificationEmail(user);
  } catch (error) {
    logError("resend verification", error);
  }
}

/** Consumes a verification token (once) and marks the email verified. */
export async function verifyEmail(rawToken: string): Promise<boolean> {
  const db = await getDb();
  const record = await db.tokens.consume("email_verify", hashToken(rawToken));
  if (!record) return false;
  await db.users.markEmailVerified(record.userId);
  return true;
}

/**
 * Consumes a reset token (once), sets the new password and signs the user out
 * everywhere. Also marks the email verified: following the link proves the
 * user controls the inbox. Does not log the user in.
 */
export async function resetPassword(rawToken: string, newPassword: string): Promise<boolean> {
  const db = await getDb();
  const record = await db.tokens.consume("password_reset", hashToken(rawToken));
  if (!record) return false;

  const user = await db.users.findById(record.userId);
  if (!user) return false;

  await db.users.updatePasswordHash(user.id, await hashPassword(newPassword));
  await db.tokens.deleteUnused(user.id, "password_reset");
  await db.refreshTokens.revokeAllForUser(user.id);
  await db.users.markEmailVerified(user.id);

  await sendPasswordChangedEmail(user);
  return true;
}

export type ChangePasswordResult =
  | { ok: true; tokens: SessionTokens }
  | { ok: false; reason: "wrong_password" | "not_found" };

/**
 * Verifies the current password, sets the new one, revokes every session of
 * the user and starts a fresh one for the current device.
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
  meta: ClientMeta
): Promise<ChangePasswordResult> {
  const db = await getDb();
  const found = await db.users.findByIdWithPassword(userId);
  if (!found) return { ok: false, reason: "not_found" };

  if (!(await verifyPassword(currentPassword, found.passwordHash))) {
    return { ok: false, reason: "wrong_password" };
  }

  await db.users.updatePasswordHash(userId, await hashPassword(newPassword));
  await db.refreshTokens.revokeAllForUser(userId);

  const user: User = {
    id: found.id,
    name: found.name,
    email: found.email,
    emailVerifiedAt: found.emailVerifiedAt,
    createdAt: found.createdAt,
    updatedAt: found.updatedAt,
  };
  const tokens = await startSession(user, meta);
  await sendPasswordChangedEmail(user);
  return { ok: true, tokens };
}

export async function updateProfile(userId: string, name: string): Promise<User | null> {
  const db = await getDb();
  return db.users.updateName(userId, name);
}

/** Signs the user out of every device. */
export async function logoutAllDevices(userId: string): Promise<void> {
  const db = await getDb();
  await db.refreshTokens.revokeAllForUser(userId);
}
