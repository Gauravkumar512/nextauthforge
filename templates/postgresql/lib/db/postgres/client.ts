import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { getDatabaseUrl } from "../../env";

// Cache on globalThis so hot reloads in dev don't open a new pool each time.
const globalForPrisma = globalThis as typeof globalThis & { _prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  globalForPrisma._prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: getDatabaseUrl() }),
  });
  return globalForPrisma._prisma;
}
