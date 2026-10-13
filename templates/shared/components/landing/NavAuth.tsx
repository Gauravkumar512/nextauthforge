"use client";

import Link from "next/link";
import { useOptionalAuth } from "../../hooks/useAuth";
import { buttonClass, cx } from "../auth/ui";

/**
 * Sign in / Get started for visitors, Dashboard for signed-in users.
 * The space is reserved while the session is being checked, so nothing jumps.
 */
export function NavAuth({ stacked = false, onNavigate }: { stacked?: boolean; onNavigate?: () => void }) {
  const auth = useOptionalAuth();
  const checking = auth ? auth.loading : false;
  const user = auth?.user ?? null;

  const primary = cx(buttonClass("primary", "sm"), "whitespace-nowrap");
  const secondary = cx(buttonClass("secondary", "sm"), "whitespace-nowrap");

  return (
    <div
      className={cx(
        "flex items-center gap-2",
        stacked ? "w-full flex-col items-stretch" : "h-10 min-w-[11.5rem] justify-end"
      )}
    >
      {checking ? (
        <span aria-hidden="true" className="block h-10 w-full" />
      ) : user ? (
        <Link href="/dashboard" onClick={onNavigate} className={primary}>
          Dashboard
        </Link>
      ) : (
        <>
          <Link href="/login" onClick={onNavigate} className={secondary}>
            Sign in
          </Link>
          <Link href="/signup" onClick={onNavigate} className={primary}>
            Get started
          </Link>
        </>
      )}
    </div>
  );
}
