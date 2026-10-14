// The contract between the auth service and the database. Each database
// template (templates/mongodb and templates/postgresql) implements these
// interfaces and exposes them through lib/db/index.ts.

/** A user as exposed to the rest of the app. Never includes the password hash. */
export interface User {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Only returned by `findByEmailWithPassword`, for the login check. */
export interface UserWithPassword extends User {
  passwordHash: string;
}

export class DuplicateEmailError extends Error {
  constructor() {
    super("Email already in use");
    this.name = "DuplicateEmailError";
  }
}

export interface UserRepo {
  /** `email` is already trimmed and lowercased. */
  findByEmail(email: string): Promise<User | null>;
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  findById(id: string): Promise<User | null>;
  findByIdWithPassword(id: string): Promise<UserWithPassword | null>;
  /** Throws DuplicateEmailError when the email is taken. */
  create(input: { name: string; email: string; passwordHash: string }): Promise<User>;
  /** Sets emailVerifiedAt to now unless it is already set. */
  markEmailVerified(id: string): Promise<void>;
  updatePasswordHash(id: string, passwordHash: string): Promise<void>;
  /** Returns the updated user, or null if it doesn't exist. */
  updateName(id: string, name: string): Promise<User | null>;
}

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByTokenId: string | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
}

export interface NewRefreshToken {
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  userAgent: string | null;
  ip: string | null;
}

export interface RefreshTokenRepo {
  create(input: NewRefreshToken): Promise<RefreshTokenRecord>;
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  /**
   * Revokes the token only if it is not revoked yet, in one atomic step.
   * Returns true when this call did the revoking.
   */
  revokeIfActive(id: string, replacedByTokenId: string | null): Promise<boolean>;
  revokeFamily(familyId: string): Promise<void>;
  /** Revokes every active refresh token of the user (all devices). */
  revokeAllForUser(userId: string): Promise<void>;
}

/** One-time tokens sent by email. */
export type UserTokenType = "email_verify" | "password_reset";

export interface UserTokenRecord {
  id: string;
  userId: string;
  type: UserTokenType;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

export interface TokenRepo {
  /**
   * Stores a new token and invalidates the user's older unused tokens of the
   * same type.
   */
  createReplacing(input: {
    userId: string;
    type: UserTokenType;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<UserTokenRecord>;
  /**
   * Atomically marks the token as used, but only if it exists, matches the
   * type, is unused and not expired. Returns the record when THIS call used
   * it, otherwise null. Two concurrent calls can never both succeed.
   */
  consume(type: UserTokenType, tokenHash: string): Promise<UserTokenRecord | null>;
  /** When the user's most recent token of this type was created. */
  latestCreatedAt(userId: string, type: UserTokenType): Promise<Date | null>;
  /** Deletes the user's unused tokens of this type. */
  deleteUnused(userId: string, type: UserTokenType): Promise<void>;
}

export interface Db {
  users: UserRepo;
  refreshTokens: RefreshTokenRepo;
  tokens: TokenRepo;
}
