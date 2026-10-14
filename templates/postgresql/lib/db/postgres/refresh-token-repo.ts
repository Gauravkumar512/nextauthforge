import type { RefreshToken as RefreshTokenRow } from "../generated/prisma/client";
import type { RefreshTokenRecord, RefreshTokenRepo } from "../types";
import { getPrisma } from "./client";

function toRecord(row: RefreshTokenRow): RefreshTokenRecord {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    familyId: row.familyId,
    expiresAt: row.expiresAt,
    revokedAt: row.revokedAt,
    replacedByTokenId: row.replacedByTokenId,
    userAgent: row.userAgent,
    ip: row.ip,
    createdAt: row.createdAt,
  };
}

export const postgresRefreshTokenRepo: RefreshTokenRepo = {
  async create(input) {
    const prisma = getPrisma();
    // No TTL index in Postgres: drop this user's expired rows as we go.
    await prisma.refreshToken.deleteMany({
      where: { userId: input.userId, expiresAt: { lt: new Date() } },
    });
    return toRecord(await prisma.refreshToken.create({ data: input }));
  },

  async findByHash(tokenHash) {
    const row = await getPrisma().refreshToken.findUnique({ where: { tokenHash } });
    return row ? toRecord(row) : null;
  },

  async revokeIfActive(id, replacedByTokenId) {
    // One conditional update: only the call that flips revokedAt from null wins.
    const result = await getPrisma().refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date(), replacedByTokenId },
    });
    return result.count === 1;
  },

  async revokeAllForUser(userId) {
    await getPrisma().refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },

  async revokeFamily(familyId) {
    await getPrisma().refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  },
};
