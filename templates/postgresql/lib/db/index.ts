// The single entry point the auth service uses to reach the database.
// Another database template only has to provide this same `getDb()`.
import type { Db } from "./types";
import { getPrisma } from "./postgres/client";
import { postgresRefreshTokenRepo } from "./postgres/refresh-token-repo";
import { postgresTokenRepo } from "./postgres/token-repo";
import { postgresUserRepo } from "./postgres/user-repo";

// Routes that call this must run on the Node.js runtime (the default).
export async function getDb(): Promise<Db> {
  getPrisma(); // validates DATABASE_URL and creates the client once
  return {
    users: postgresUserRepo,
    refreshTokens: postgresRefreshTokenRepo,
    tokens: postgresTokenRepo,
  };
}

/**
 * Postgres has no TTL index, so expired token rows are deleted lazily (when a
 * user gets a new token) and by this helper. Optionally call it from a cron
 * job (e.g. a Vercel Cron route) to keep the tables small.
 */
export async function pruneExpired(): Promise<void> {
  const prisma = getPrisma();
  const now = new Date();
  await prisma.refreshToken.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.userToken.deleteMany({ where: { expiresAt: { lt: now } } });
}
