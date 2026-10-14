"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, sessionHint } from "../lib/api-client";
import type { AuthUser, MeResponse } from "../types/auth";

interface AuthContextValue {
  /** The signed-in user, or null (signed out, or still loading: check `loading`). */
  user: AuthUser | null;
  /** True until the first check of the session has finished. */
  loading: boolean;
  /** Re-reads the user from the server (e.g. after changing the name). */
  refresh: () => Promise<AuthUser | null>;
  /** Signs out on the server and sends the user to the landing page. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUser(): Promise<AuthUser | null> {
  // The session cookies are httpOnly, so the browser can't see them. A flag set
  // when this browser signs in (see lib/api-client.ts) tells us whether it is
  // worth asking the server; signed-out visitors make no request at all.
  if (!sessionHint.get()) return null;

  try {
    const data = await api<MeResponse>("/api/auth/me", { onAuthFail: "throw" });
    return data.user;
  } catch (error) {
    // A 401 means signed out. Other errors (network, server) keep the hint so
    // the next check can still renew the session.
    if (error instanceof ApiError && error.status === 401) sessionHint.clear();
    return null;
  }
}

// Mounted once in the root layout by `nextauthforge init`.
export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const next = await fetchUser();
    setUser(next);
    setLoading(false);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    void fetchUser().then((next) => {
      if (cancelled) return;
      setUser(next);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/api/auth/logout", { method: "POST", onAuthFail: "throw" });
    } finally {
      sessionHint.clear();
      setUser(null);
      router.replace("/");
      router.refresh();
    }
  }, [router]);

  const value = useMemo(() => ({ user, loading, refresh, logout }), [user, loading, refresh, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Like useAuth(), but returns null instead of throwing when <AuthProvider> isn't mounted. */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>. Run `nextauthforge init` again or add it to your root layout.");
  }
  return context;
}
