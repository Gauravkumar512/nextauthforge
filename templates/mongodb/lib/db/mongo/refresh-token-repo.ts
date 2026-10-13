import { isValidObjectId } from "mongoose";
import type { RefreshTokenRecord, RefreshTokenRepo } from "../types";
import { RefreshTokenModel, type RefreshTokenDoc } from "./models";

type TokenRow = RefreshTokenDoc & { _id: unknown };

function toRecord(doc: TokenRow): RefreshTokenRecord {
  return {
    id: String(doc._id),
    userId: doc.userId,
    tokenHash: doc.tokenHash,
    familyId: doc.familyId,
    expiresAt: doc.expiresAt,
    revokedAt: doc.revokedAt ?? null,
    replacedByTokenId: doc.replacedByTokenId ?? null,
    userAgent: doc.userAgent ?? null,
    ip: doc.ip ?? null,
    createdAt: doc.createdAt,
  };
}

export const mongoRefreshTokenRepo: RefreshTokenRepo = {
  async create(input) {
    const doc = await RefreshTokenModel.create(input);
    return toRecord(doc.toObject());
  },

  async findByHash(tokenHash) {
    const doc = await RefreshTokenModel.findOne({ tokenHash }).lean();
    return doc ? toRecord(doc) : null;
  },

  async revokeIfActive(id, replacedByTokenId) {
    if (!isValidObjectId(id)) return false;
    const result = await RefreshTokenModel.updateOne(
      { _id: id, revokedAt: null },
      { $set: { revokedAt: new Date(), replacedByTokenId } }
    );
    return result.modifiedCount === 1;
  },

  async revokeAllForUser(userId) {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  },

  async revokeAllForUserExcept(userId, exceptFamilyId) {
    await RefreshTokenModel.updateMany(
      { userId, revokedAt: null, familyId: { $ne: exceptFamilyId } },
      { $set: { revokedAt: new Date() } }
    );
  },

  async revokeFamily(familyId) {
    await RefreshTokenModel.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    );
  },
};
