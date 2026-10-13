import type { TokenRepo, UserTokenRecord } from "../types";
import { UserTokenModel, type UserTokenDoc } from "./models";

type TokenRow = UserTokenDoc & { _id: unknown };

function toRecord(doc: TokenRow): UserTokenRecord {
  return {
    id: String(doc._id),
    userId: doc.userId,
    type: doc.type,
    tokenHash: doc.tokenHash,
    expiresAt: doc.expiresAt,
    usedAt: doc.usedAt ?? null,
    createdAt: doc.createdAt,
  };
}

export const mongoTokenRepo: TokenRepo = {
  async createReplacing(input) {
    await UserTokenModel.deleteMany({ userId: input.userId, type: input.type, usedAt: null });
    const doc = await UserTokenModel.create(input);
    return toRecord(doc.toObject());
  },

  async consume(type, tokenHash) {
    const now = new Date();
    // One conditional update: only the call that flips usedAt from null wins.
    const doc = await UserTokenModel.findOneAndUpdate(
      { tokenHash, type, usedAt: null, expiresAt: { $gt: now } },
      { $set: { usedAt: now } },
      { new: true }
    ).lean();
    return doc ? toRecord(doc) : null;
  },

  async latestCreatedAt(userId, type) {
    const doc = await UserTokenModel.findOne({ userId, type }).sort({ createdAt: -1 }).lean();
    return doc ? doc.createdAt : null;
  },

  async deleteUnused(userId, type) {
    await UserTokenModel.deleteMany({ userId, type, usedAt: null });
  },
};
