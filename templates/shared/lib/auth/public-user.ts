import type { User } from "../db/types";

/**
 * What the API is allowed to say about a user. Derived on purpose: the raw
 * emailVerifiedAt timestamp, updatedAt and anything credential-related stay
 * server-side.
 */
export interface PublicUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: Date;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerifiedAt !== null,
    createdAt: user.createdAt,
  };
}
