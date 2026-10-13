// The one file to edit when you want to change how auth behaves.
// Safe to import from the proxy/middleware (no Node-only APIs here).

const DAY = 60 * 60 * 24;
const isProduction = process.env.NODE_ENV === "production";

export const authConfig = {
  cookies: {
    // Optional override via the COOKIE_NAME env var; defaults to "token".
    accessName: process.env.COOKIE_NAME || "token",
    refreshName: "refresh_token",
    // The refresh cookie is only sent to the auth routes. The proxy therefore
    // can't see it, which is why it redirects to /api/auth/refresh whenever an
    // access token is present but no longer valid.
    refreshPath: "/api/auth",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
  },

  tokens: {
    // Short-lived JWT proving who the user is.
    accessTtlSeconds: 15 * 60,
    // Opaque, rotated on every use, stored hashed in the database.
    refreshTtlSeconds: 30 * DAY,
    issuer: "nextauthforge",
    audience: "nextauthforge-app",
  },

  // Routes the proxy protects (a path matches itself and everything below it).
  protectedRoutes: ["/dashboard"],
  // Routes a signed-in user is bounced away from.
  authRoutes: ["/login", "/signup"],
  loginPath: "/login",
  afterLoginPath: "/dashboard",

  password: {
    minLength: 8,
    maxLength: 128,
  },

  // Step 4 will enforce this; for now it is only a flag.
  requireEmailVerification: false,

  // In-memory limits (see lib/rate-limit.ts for the multi-instance caveat).
  rateLimit: {
    // Per IP + email, reset after a successful login.
    login: { limit: 5, windowSeconds: 15 * 60 },
    // Per IP across all emails.
    loginIp: { limit: 30, windowSeconds: 15 * 60 },
    signup: { limit: 5, windowSeconds: 60 * 60 },
    refresh: { limit: 30, windowSeconds: 60 },
  },
};

export type AuthConfig = typeof authConfig;
