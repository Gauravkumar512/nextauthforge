"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../hooks/useAuth";
import { authConfig } from "../../lib/auth-config";
import { Spinner } from "./Spinner";

/**
 * Gate for client-only pages. (The proxy and requireUser() already protect
 * server routes; use this for client components that need a signed-in user.)
 */
export function ProtectedRoute({
  children,
  verified = false,
  fallback,
}: {
  children: ReactNode;
  /** Also require a verified email (otherwise go to /verify-email). */
  verified?: boolean;
  fallback?: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const here = window.location.pathname + window.location.search;
      router.replace(`${authConfig.loginPath}?next=${encodeURIComponent(here)}`);
    } else if (verified && !user.emailVerified) {
      router.replace(authConfig.verifyEmailPath);
    }
  }, [loading, user, verified, router]);

  if (loading || !user || (verified && !user.emailVerified)) {
    return (
      fallback ?? (
        <div role="status" className="flex min-h-[40vh] items-center justify-center text-[color:var(--af-muted)]">
          <Spinner className="h-6 w-6" />
          <span className="sr-only">Loading</span>
        </div>
      )
    );
  }

  return <>{children}</>;
}
