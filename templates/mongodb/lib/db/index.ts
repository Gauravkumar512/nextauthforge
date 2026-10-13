// The single entry point the auth service uses to reach the database.
// Another database template only has to provide this same `getDb()`.
import type { Db } from "./types";
import { connectMongo } from "./mongo/connection";
import { RefreshTokenModel, UserModel } from "./mongo/models";
import { mongoRefreshTokenRepo } from "./mongo/refresh-token-repo";
import { mongoUserRepo } from "./mongo/user-repo";

const globalForDb = globalThis as typeof globalThis & { _authDb?: Promise<Db> };

async function init(): Promise<Db> {
  await connectMongo();
  // Make sure the unique and TTL indexes exist before the first write.
  await Promise.all([UserModel.init(), RefreshTokenModel.init()]);
  return { users: mongoUserRepo, refreshTokens: mongoRefreshTokenRepo };
}

export function getDb(): Promise<Db> {
  globalForDb._authDb ??= init().catch((error) => {
    globalForDb._authDb = undefined; // retry on the next call
    throw error;
  });
  return globalForDb._authDb;
}
