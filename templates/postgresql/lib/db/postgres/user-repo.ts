import { Prisma } from "../generated/prisma/client";
import type { User as UserRow } from "../generated/prisma/client";
import { DuplicateEmailError, type User, type UserRepo, type UserWithPassword } from "../types";
import { getPrisma } from "./client";

function toUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerifiedAt: row.emailVerifiedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const withPassword = (row: UserRow): UserWithPassword => ({
  ...toUser(row),
  passwordHash: row.passwordHash,
});

function isPrismaError(error: unknown, code: string): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
}

export const postgresUserRepo: UserRepo = {
  async findByEmail(email) {
    const row = await getPrisma().user.findUnique({ where: { email } });
    return row ? toUser(row) : null;
  },

  async findByEmailWithPassword(email) {
    const row = await getPrisma().user.findUnique({ where: { email } });
    return row ? withPassword(row) : null;
  },

  async findById(id) {
    const row = await getPrisma().user.findUnique({ where: { id } });
    return row ? toUser(row) : null;
  },

  async findByIdWithPassword(id) {
    const row = await getPrisma().user.findUnique({ where: { id } });
    return row ? withPassword(row) : null;
  },

  async markEmailVerified(id) {
    await getPrisma().user.updateMany({
      where: { id, emailVerifiedAt: null },
      data: { emailVerifiedAt: new Date() },
    });
  },

  async updatePasswordHash(id, passwordHash) {
    await getPrisma().user.updateMany({ where: { id }, data: { passwordHash } });
  },

  async updateName(id, name) {
    try {
      return toUser(await getPrisma().user.update({ where: { id }, data: { name } }));
    } catch (error) {
      if (isPrismaError(error, "P2025")) return null; // record not found
      throw error;
    }
  },

  async create(input) {
    try {
      return toUser(await getPrisma().user.create({ data: input }));
    } catch (error) {
      if (isPrismaError(error, "P2002")) throw new DuplicateEmailError(); // unique email
      throw error;
    }
  },
};
