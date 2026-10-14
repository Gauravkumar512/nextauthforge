// The one file to edit when you want to change how auth behaves.
// Safe to import from the proxy/middleware (no Node-only APIs here).

const DAY = 60 * 60 * 24;
const isProduction = process.env.NODE_ENV === "production";

export const authConfig = {
  // Used as the brand in emails. Set by `init` (from --name); edit freely.
  appName: "My App", // nextauthforge:appName

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
    // A refresh token that was rotated less than this many seconds ago and is
    // presented again is treated as a benign race (two tabs/requests refreshing
    // at once): the request gets a 401, but the session is NOT revoked and the
    // cookies are NOT cleared, because the winning request already set new ones.
    // Reuse after the window revokes the whole token family (assumed theft).
    refreshReuseGraceSeconds: 10,
    // One-time links sent by email.
    verifyTokenTtlSeconds: 24 * 60 * 60,
    resetTokenTtlSeconds: 60 * 60,
    // Minimum time between verification emails for the same user.
    resendCooldownSeconds: 60,
    issuer: "nextauthforge",
    audience: "nextauthforge-app",
  },

  // Routes the proxy protects (a path matches itself and everything below it).
  protectedRoutes: ["/dashboard"],
  // Routes a signed-in user is bounced away from.
  authRoutes: ["/login", "/signup"],
  // Reachable by everyone, signed in or not (e.g. a reset link opened while
  // logged in); the proxy never redirects these.
  publicRoutes: ["/forgot-password", "/reset-password", "/verify-email"],
  loginPath: "/login",
  verifyEmailPath: "/verify-email",
  afterLoginPath: "/dashboard",

  password: {
    minLength: 8,
    maxLength: 128,
  },

  // When true: signup doesn't log the user in, and login refuses unverified
  // users with 403 EMAIL_NOT_VERIFIED. Set by `init` (--verify-email).
  requireEmailVerification: false, // nextauthforge:requireEmailVerification

  // In-memory limits (see lib/rate-limit.ts for the multi-instance caveat).
  rateLimit: {
    // Per IP + email, reset after a successful login.
    login: { limit: 5, windowSeconds: 15 * 60 },
    // Per IP across all emails.
    loginIp: { limit: 30, windowSeconds: 15 * 60 },
    signup: { limit: 5, windowSeconds: 60 * 60 },
    refresh: { limit: 30, windowSeconds: 60 },
    forgotPasswordIp: { limit: 5, windowSeconds: 15 * 60 },
    forgotPasswordEmail: { limit: 3, windowSeconds: 60 * 60 },
    resetPassword: { limit: 10, windowSeconds: 15 * 60 },
    verifyEmail: { limit: 20, windowSeconds: 15 * 60 },
    resendVerificationIp: { limit: 5, windowSeconds: 60 * 60 },
    resendVerificationEmail: { limit: 3, windowSeconds: 60 * 60 },
    // Per user.
    changePassword: { limit: 5, windowSeconds: 15 * 60 },
  },
};

export type AuthConfig = typeof authConfig;
