import { isValidObjectId } from "mongoose";
import { DuplicateEmailError, type User, type UserRepo, type UserWithPassword } from "../types";
import { UserModel, type UserDoc } from "./models";

type UserRow = UserDoc & { _id: unknown };

function toUser(doc: UserRow): User {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    emailVerifiedAt: doc.emailVerifiedAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const mongoUserRepo: UserRepo = {
  async findByEmail(email) {
    const doc = await UserModel.findOne({ email }).lean();
    return doc ? toUser(doc) : null;
  },

  async findByEmailWithPassword(email): Promise<UserWithPassword | null> {
    const doc = await UserModel.findOne({ email }).lean();
    return doc ? { ...toUser(doc), passwordHash: doc.passwordHash } : null;
  },

  async findById(id) {
    if (!isValidObjectId(id)) return null;
    const doc = await UserModel.findById(id).lean();
    return doc ? toUser(doc) : null;
  },

  async findByIdWithPassword(id): Promise<UserWithPassword | null> {
    if (!isValidObjectId(id)) return null;
    const doc = await UserModel.findById(id).lean();
    return doc ? { ...toUser(doc), passwordHash: doc.passwordHash } : null;
  },

  async markEmailVerified(id) {
    if (!isValidObjectId(id)) return;
    await UserModel.updateOne(
      { _id: id, emailVerifiedAt: null },
      { $set: { emailVerifiedAt: new Date() } }
    );
  },

  async updatePasswordHash(id, passwordHash) {
    if (!isValidObjectId(id)) return;
    await UserModel.updateOne({ _id: id }, { $set: { passwordHash } });
  },

  async updateName(id, name) {
    if (!isValidObjectId(id)) return null;
    const doc = await UserModel.findByIdAndUpdate(id, { $set: { name } }, { new: true }).lean();
    return doc ? toUser(doc) : null;
  },

  async create(input) {
    try {
      const doc = await UserModel.create(input);
      return toUser(doc.toObject());
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw new DuplicateEmailError();
      throw error;
    }
  },
};
