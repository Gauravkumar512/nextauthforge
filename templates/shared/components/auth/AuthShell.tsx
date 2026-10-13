import Link from "next/link";
import type { ReactNode } from "react";
import { Af } from "./Af";
import { BrandLogo } from "./BrandLogo";
import { cardClass, cx, headingFont, mutedText } from "./ui";

/** Centered card layout shared by every auth page. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Af className="relative flex flex-col overflow-hidden">
      <div aria-hidden="true" className="af-grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="af-glow pointer-events-none absolute left-1/2 top-1/3 h-[560px] w-[560px] max-w-full -translate-x-1/2 -translate-y-1/2"
      />

      <header className="relative z-10 flex items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <BrandLogo />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-12 pt-4 sm:px-6">
        <div className="w-full max-w-md">
          <div className={cx(cardClass, "p-6 sm:p-8")}>
            <h1 className={cx(headingFont, "text-2xl")}>{title}</h1>
            {subtitle ? <p className={cx(mutedText, "mt-2 text-sm leading-relaxed")}>{subtitle}</p> : null}
            <div className={subtitle ? "mt-6" : "mt-5"}>{children}</div>
          </div>
          {footer ? <div className={cx(mutedText, "mt-5 text-center text-sm")}>{footer}</div> : null}
        </div>
      </main>

      <footer className={cx(mutedText, "relative z-10 px-4 pb-6 text-center text-xs")}>
        <Link href="/terms" className="underline">
          Terms
        </Link>
        <span aria-hidden="true"> · </span>
        <Link href="/privacy" className="underline">
          Privacy
        </Link>
      </footer>
    </Af>
  );
}
