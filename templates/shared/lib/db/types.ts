// The contract between the auth service and the database. Each database
// template (templates/mongodb, later Prisma/Postgres) implements these
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
  findByEmailWithPassword(email: string): Promise<UserWithPassword | null>;
  findById(id: string): Promise<User | null>;
  /** Throws DuplicateEmailError when the email is taken. */
  create(input: { name: string; email: string; passwordHash: string }): Promise<User>;
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
}

export interface Db {
  users: UserRepo;
  refreshTokens: RefreshTokenRepo;
}
