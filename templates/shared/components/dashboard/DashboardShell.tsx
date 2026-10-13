"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { sessionHint } from "../../lib/api-client";
import { BrandLogo } from "../auth/BrandLogo";
import { CloseIcon, HomeIcon, MenuIcon, SettingsIcon } from "../auth/icons";
import { buttonClass, cx } from "../auth/ui";
import { UserMenu } from "./UserMenu";

const NAV = [
  { href: "/dashboard", label: "Overview", Icon: HomeIcon, exact: true },
  { href: "/dashboard/settings", label: "Settings", Icon: SettingsIcon, exact: false },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Dashboard">
      <ul className="space-y-1">
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-[var(--af-radius)] px-3 py-2.5 text-sm font-medium",
                  active
                    ? "bg-[color:var(--af-accent-soft)] text-[color:var(--af-accent)]"
                    : "text-[color:var(--af-muted)] hover:bg-[color:var(--af-surface-2)] hover:text-[color:var(--af-text)]"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Sidebar on desktop, drawer on mobile. The drawer is a modal dialog: the page
 * behind it is made inert, Tab stays inside, Esc closes it and focus returns
 * to the menu button.
 */
export function DashboardShell({
  name,
  email,
  children,
}: {
  name: string;
  email: string;
  children: ReactNode;
}) {
  // The drawer is open only while the route it was opened on is current, so it
  // closes by itself after a navigation.
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath !== null && openPath === pathname;
  const pageRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpenPath(null), []);

  // We are on a page that needs a session, so remember that this browser has one.
  useEffect(() => {
    sessionHint.set();
  }, []);

  useEffect(() => {
    const page = pageRef.current as (HTMLDivElement & { inert: boolean }) | null;
    if (!open || !page) return;

    page.inert = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenPath(null);
        return;
      }
      if (event.key !== "Tab" || !drawer) return;
      const items = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    const opener = openerRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      page.inert = false;
      document.body.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

  return (
    <>
      <div ref={pageRef} className="md:flex md:min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-[color:var(--af-border)] bg-[color:var(--af-surface)] md:block">
          <div className="sticky top-0 flex h-screen flex-col p-5">
            <BrandLogo className="px-1" />
            <div className="mt-8">
              <NavLinks />
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-[color:var(--af-border)] bg-[color:var(--af-nav-bg)] px-4 backdrop-blur sm:px-6">
            <div className="flex items-center gap-3">
              <button
                ref={openerRef}
                type="button"
                aria-label="Open menu"
                aria-expanded={open}
                aria-controls="dashboard-drawer"
                onClick={() => setOpenPath(pathname)}
                className={cx(buttonClass("secondary", "icon"), "md:hidden")}
              >
                <MenuIcon />
              </button>
              <BrandLogo className="md:hidden" />
            </div>
            <UserMenu name={name} email={email} />
          </header>

          <main id="main" className="flex-1 px-4 py-8 sm:px-8">
            {children}
          </main>
        </div>
      </div>

      {open && (
        <div className="md:hidden">
          <div aria-hidden="true" onClick={close} className="fixed inset-0 z-40 bg-[color:var(--af-overlay)]" />
          <div
            ref={drawerRef}
            id="dashboard-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-[color:var(--af-border)] bg-[color:var(--af-surface)] p-5"
          >
            <div className="flex items-center justify-between">
              <BrandLogo />
              <button type="button" aria-label="Close menu" onClick={close} className={buttonClass("secondary", "icon")}>
                <CloseIcon />
              </button>
            </div>
            <div className="mt-8">
              <NavLinks onNavigate={close} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
