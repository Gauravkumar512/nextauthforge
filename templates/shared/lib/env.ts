import { z } from "zod";

const authSchema = z.object({
  AUTH_SECRET: z
    .string({ message: "AUTH_SECRET is required" })
    .min(32, "AUTH_SECRET must be at least 32 characters"),
});

const databaseSchema = z.object({
  DATABASE_URL: z
    .string({ message: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL is required"),
});

function parse<T extends z.ZodType>(schema: T, values: Record<string, unknown>): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${problems}\nSee .env.example for the required values.`
    );
  }
  return result.data;
}

// Everything is validated lazily (on first use) so `next build` doesn't fail
// when env vars are only provided at runtime, and so the proxy only needs
// AUTH_SECRET, never DATABASE_URL.
let authEnv: z.infer<typeof authSchema> | undefined;
let databaseEnv: z.infer<typeof databaseSchema> | undefined;

export function getAuthSecret(): string {
  authEnv ??= parse(authSchema, { AUTH_SECRET: process.env.AUTH_SECRET });
  return authEnv.AUTH_SECRET;
}

export function getDatabaseUrl(): string {
  databaseEnv ??= parse(databaseSchema, { DATABASE_URL: process.env.DATABASE_URL });
  return databaseEnv.DATABASE_URL;
}
