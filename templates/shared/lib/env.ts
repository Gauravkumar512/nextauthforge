import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z
    .string({ message: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z
    .string({ message: "AUTH_SECRET is required" })
    .min(32, "AUTH_SECRET must be at least 32 characters"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

// Validated lazily (on first use) so `next build` doesn't fail when
// env vars are only provided at runtime.
export function getEnv(): Env {
  if (cached) return cached;

  const result = envSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
  });

  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid environment variables:\n${problems}\nSee .env.example for the required values.`
    );
  }

  cached = result.data;
  return cached;
}
