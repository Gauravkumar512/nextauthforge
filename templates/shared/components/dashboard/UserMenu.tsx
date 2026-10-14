"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, LogOutIcon, SettingsIcon } from "../auth/icons";
import { cx } from "../auth/ui";
import { useLogout } from "./useLogout";

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "");
  return letters.toUpperCase();
}

/** Account button in the top bar: name/email, Settings and Sign out. Esc or an outside click closes it. */
export function UserMenu({ name, email }: { name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const logout = useLogout();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setPending(true);
    try {
      await logout();
    } finally {
      setPending(false);
    }
  }

  const itemClass =
    "flex w-full cursor-pointer items-center gap-2.5 rounded-[var(--af-radius)] px-3 py-2.5 text-left text-sm text-[color:var(--af-text)] hover:bg-[color:var(--af-surface-2)] disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="user-menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 cursor-pointer items-center gap-2.5 rounded-[var(--af-radius)] border border-[color:var(--af-border-strong)] pl-1.5 pr-3 text-sm text-[color:var(--af-text)] hover:bg-[color:var(--af-surface-2)]"
      >
        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--af-accent)] font-mono text-xs font-black text-[color:var(--af-accent-fg)]"
        >
          {initials(name)}
        </span>
        <span className="hidden max-w-[10rem] truncate font-medium sm:block">{name}</span>
        <span className="sr-only sm:hidden">Account menu for {name}</span>
        <ChevronDownIcon className={cx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div
          id="user-menu"
          className="absolute right-0 top-12 z-40 w-64 rounded-[var(--af-radius)] border border-[color:var(--af-border-strong)] bg-[color:var(--af-surface)] p-2 shadow-lg"
        >
          <div className="border-b border-[color:var(--af-border)] px-3 pb-3 pt-2">
            <p className="truncate text-sm font-bold">{name}</p>
            <p className="truncate text-xs text-[color:var(--af-muted)]">{email}</p>
          </div>
          <div className="pt-2">
            <Link href="/dashboard/settings" onClick={() => setOpen(false)} className={itemClass}>
              <SettingsIcon className="h-4 w-4" />
              Settings
            </Link>
            <button type="button" onClick={signOut} disabled={pending} className={itemClass}>
              <LogOutIcon className="h-4 w-4" />
              {pending ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
