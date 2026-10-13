import { SignJWT, jwtVerify } from "jose";
import { authConfig } from "./auth-config";
import { getAuthSecret } from "./env";

// Edge-safe: only `jose`, no Node-only imports (the proxy uses this file).

const getKey = () => new TextEncoder().encode(getAuthSecret());

export async function signAccessToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuer(authConfig.tokens.issuer)
    .setAudience(authConfig.tokens.audience)
    .setIssuedAt()
    .setExpirationTime(`${authConfig.tokens.accessTtlSeconds}s`)
    .sign(getKey());
}

/** Returns the user id if the token is valid and unexpired, otherwise null. */
export async function verifyAccessToken(token: string): Promise<string | null> {
  const key = getKey();
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"],
      issuer: authConfig.tokens.issuer,
      audience: authConfig.tokens.audience,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
