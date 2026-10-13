"use client";

import { useCallback } from "react";
import { useOptionalAuth } from "../../hooks/useAuth";
import { api, hardNavigate, sessionHint } from "../../lib/api-client";

/** Signs out and goes to the landing page (works even if <AuthProvider> isn't mounted). */
export function useLogout() {
  const auth = useOptionalAuth();
  return useCallback(async () => {
    if (auth) {
      await auth.logout();
      return;
    }
    try {
      await api("/api/auth/logout", { method: "POST", onAuthFail: "throw" });
    } finally {
      sessionHint.clear();
      hardNavigate("/");
    }
  }, [auth]);
}
