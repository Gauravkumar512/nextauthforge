// Single source of truth for the session cookie name.
// Defaults to "token"; set COOKIE_NAME in your env to override.
export const COOKIE_NAME = process.env.COOKIE_NAME || "token";
