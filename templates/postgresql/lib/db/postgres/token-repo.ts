import type { UserToken as UserTokenRow } from "../generated/prisma/client";
import type { TokenRepo, UserTokenRecord } from "../types";
import { getPrisma } from "./client";

function toRecord(row: UserTokenRow): UserTokenRecord {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    tokenHash: row.tokenHash,
    expiresAt: row.expiresAt,
    usedAt: row.usedAt,
    createdAt: row.createdAt,
  };
}

export const postgresTokenRepo: TokenRepo = {
  async createReplacing(input) {
    const prisma = getPrisma();
    const [, , row] = await prisma.$transaction([
      // No TTL index in Postgres: drop this user's expired tokens as we go.
      prisma.userToken.deleteMany({ where: { userId: input.userId, expiresAt: { lt: new Date() } } }),
      prisma.userToken.deleteMany({ where: { userId: input.userId, type: input.type, usedAt: null } }),
      prisma.userToken.create({ data: input }),
    ]);
    return toRecord(row);
  },

  async consume(type, tokenHash) {
    const prisma = getPrisma();
    const now = new Date();
    // One conditional update: only the call that flips usedAt from null wins.
    const result = await prisma.userToken.updateMany({
      where: { tokenHash, type, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (result.count !== 1) return null;
    const row = await prisma.userToken.findUnique({ where: { tokenHash } });
    return row ? toRecord(row) : null;
  },

  async latestCreatedAt(userId, type) {
    const row = await getPrisma().userToken.findFirst({
      where: { userId, type },
      orderBy: { createdAt: "desc" },
    });
    return row ? row.createdAt : null;
  },

  async deleteUnused(userId, type) {
    await getPrisma().userToken.deleteMany({ where: { userId, type, usedAt: null } });
  },
};
