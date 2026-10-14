// Prisma CLI configuration (migrate, generate, studio). Prisma 7 no longer
// reads .env files by itself, so load the same ones Next.js uses.
import { config } from "dotenv";
import { defineConfig } from "prisma/config";

config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // An empty fallback lets `prisma generate` run before DATABASE_URL is set.
    url: process.env.DATABASE_URL ?? "",
  },
});
