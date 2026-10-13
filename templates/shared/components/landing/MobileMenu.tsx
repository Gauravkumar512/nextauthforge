"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon, MenuIcon } from "../auth/icons";
import { buttonClass } from "../auth/ui";
import type { Link as NavLink } from "../../lib/site-config";
import { NavAuth } from "./NavAuth";

/** Small-screen menu: a button that toggles a panel. Esc closes it. */
export function MobileMenu({ links }: { links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className={buttonClass("secondary", "icon")}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>

      {open && (
        <div
          id="mobile-menu"
          className="absolute inset-x-0 top-16 border-b border-[color:var(--af-border)] bg-[color:var(--af-bg)] px-4 pb-5 pt-3 shadow-lg"
        >
          <nav aria-label="Mobile">
            <ul className="space-y-1">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-[var(--af-radius)] px-3 py-3 text-base font-medium text-[color:var(--af-text)] hover:bg-[color:var(--af-surface-2)]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-4">
            <NavAuth stacked onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
