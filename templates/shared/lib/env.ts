import { z } from "zod";

const authSchema = z.object({
  AUTH_SECRET: z
    .string({ message: "AUTH_SECRET is required" })
    .min(32, "AUTH_SECRET must be at least 32 characters"),
});

// Set by `init` for the database you chose.
const DATABASE_URL_SCHEMES = ["mongodb://", "mongodb+srv://"]; // nextauthforge:dbSchemes

const databaseSchema = z.object({
  DATABASE_URL: z
    .string({ message: "DATABASE_URL is required" })
    .min(1, "DATABASE_URL is required")
    .refine((url) => DATABASE_URL_SCHEMES.some((scheme) => url.startsWith(scheme)), {
      message: `DATABASE_URL must start with ${DATABASE_URL_SCHEMES.join(" or ")}`,
    }),
});

const appSchema = z.object({
  APP_URL: z.string().url("APP_URL must be a full URL, e.g. http://localhost:3000").default("http://localhost:3000"),
});

const emailSchema = z
  .object({
    EMAIL_PROVIDER: z.enum(["smtp", "resend", "console"], {
      message: "EMAIL_PROVIDER must be one of: smtp, resend, console",
    }),
    EMAIL_FROM: z.string().optional(),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.string().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_SECURE: z.string().optional(),
    RESEND_API_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const need = (key: keyof typeof env, label = String(key)) => {
      if (!env[key]) ctx.addIssue({ code: "custom", path: [key], message: `${label} is required` });
    };
    if (env.EMAIL_PROVIDER === "smtp") {
      need("EMAIL_FROM");
      need("SMTP_HOST");
      need("SMTP_PORT");
      need("SMTP_USER");
      need("SMTP_PASS");
      const port = Number(env.SMTP_PORT);
      if (env.SMTP_PORT && !(Number.isInteger(port) && port > 0 && port < 65536)) {
        ctx.addIssue({ code: "custom", path: ["SMTP_PORT"], message: "SMTP_PORT must be a valid port number" });
      }
    }
    if (env.EMAIL_PROVIDER === "resend") {
      need("EMAIL_FROM");
      need("RESEND_API_KEY");
    }
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
let appUrl: string | undefined;
let emailEnv: EmailEnv | undefined;

export function getAuthSecret(): string {
  authEnv ??= parse(authSchema, { AUTH_SECRET: process.env.AUTH_SECRET });
  return authEnv.AUTH_SECRET;
}

export function getDatabaseUrl(): string {
  databaseEnv ??= parse(databaseSchema, { DATABASE_URL: process.env.DATABASE_URL });
  return databaseEnv.DATABASE_URL;
}

/** Base URL for links in emails, without a trailing slash. */
export function getAppUrl(): string {
  appUrl ??= parse(appSchema, { APP_URL: process.env.APP_URL || undefined }).APP_URL.replace(/\/+$/, "");
  return appUrl;
}

export interface EmailEnv {
  provider: "smtp" | "resend" | "console";
  from: string;
  smtp?: { host: string; port: number; secure: boolean; user: string; pass: string };
  resendApiKey?: string;
}

export function getEmailEnv(): EmailEnv {
  if (emailEnv) return emailEnv;

  const env = parse(emailSchema, {
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || "console",
    EMAIL_FROM: process.env.EMAIL_FROM || undefined,
    SMTP_HOST: process.env.SMTP_HOST || undefined,
    SMTP_PORT: process.env.SMTP_PORT || undefined,
    SMTP_USER: process.env.SMTP_USER || undefined,
    SMTP_PASS: process.env.SMTP_PASS || undefined,
    SMTP_SECURE: process.env.SMTP_SECURE || undefined,
    RESEND_API_KEY: process.env.RESEND_API_KEY || undefined,
  });

  const port = Number(env.SMTP_PORT);
  emailEnv = {
    provider: env.EMAIL_PROVIDER,
    from: env.EMAIL_FROM ?? "noreply@localhost",
    smtp:
      env.EMAIL_PROVIDER === "smtp"
        ? {
            host: env.SMTP_HOST!,
            port,
            secure: env.SMTP_SECURE ? env.SMTP_SECURE === "true" : port === 465,
            user: env.SMTP_USER!,
            pass: env.SMTP_PASS!,
          }
        : undefined,
    resendApiKey: env.RESEND_API_KEY,
  };
  return emailEnv;
}
