import bcrypt from "bcryptjs";

const COST = 12;

// A valid cost-12 hash of a throwaway string. Compared against when a login
// email doesn't exist so that case takes as long as a real password check.
const DUMMY_HASH = "$2b$12$QfUzzEIRX.0nd5oJxxvqz.ytTGeK4VLoCcpo.U6PVAjrG6OlW3Gvq";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function burnPasswordCheck(password: string): Promise<void> {
  await bcrypt.compare(password, DUMMY_HASH);
}
