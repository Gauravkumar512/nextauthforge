import { SignJWT, jwtVerify, JWTPayload as JoseJWTPayload } from "jose";

const getSecret = () => new TextEncoder().encode(process.env.TOKEN_SECRET!);

export interface JWTPayload extends JoseJWTPayload {
  id: string;
  email: string;
}

export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(getSecret());
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}