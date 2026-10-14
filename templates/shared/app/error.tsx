"use client";

import Link from "next/link";
import { Af } from "../components/auth/Af";
import { BrandLogo } from "../components/auth/BrandLogo";
import { cx, headingFont, mutedText, primaryButton, secondaryButton } from "../components/auth/ui";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Af className="relative flex flex-col overflow-hidden">
      <div aria-hidden="true" className="af-grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <header className="relative z-10 px-4 py-5 sm:px-8">
        <BrandLogo />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="max-w-md text-center">
          <h1 className={cx(headingFont, "text-2xl")}>Something went wrong</h1>
          <p className={cx(mutedText, "mt-3 text-sm leading-relaxed")}>
            An unexpected error occurred. You can try again, or go back to the home page.
          </p>
          {error.digest ? (
            <p className={cx(mutedText, "mt-2 font-mono text-xs")}>Reference: {error.digest}</p>
          ) : null}
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button type="button" onClick={reset} className={primaryButton}>
              Try again
            </button>
            <Link href="/" className={secondaryButton}>
              Back to home
            </Link>
          </div>
        </div>
      </main>
    </Af>
  );
}
