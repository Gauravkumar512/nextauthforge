/** The user as the browser sees it (what GET /api/auth/me returns). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  /** ISO date string. */
  createdAt: string;
}

export interface MeResponse {
  success: true;
  user: AuthUser;
}
