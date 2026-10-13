import Link from "next/link";
import { Af } from "../components/auth/Af";
import { BrandLogo } from "../components/auth/BrandLogo";
import { cx, headingFont, mutedText, primaryButton, secondaryButton } from "../components/auth/ui";

export default function NotFound() {
  return (
    <Af className="relative flex flex-col overflow-hidden">
      <div aria-hidden="true" className="af-grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <header className="relative z-10 px-4 py-5 sm:px-8">
        <BrandLogo />
      </header>
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 pb-16">
        <div className="max-w-md text-center">
          <p className={cx(headingFont, "text-6xl text-[color:var(--af-accent)]")}>404</p>
          <h1 className={cx(headingFont, "mt-4 text-2xl")}>Page not found</h1>
          <p className={cx(mutedText, "mt-3 text-sm leading-relaxed")}>
            The page you are looking for doesn&apos;t exist or has moved.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className={primaryButton}>
              Back to home
            </Link>
            <Link href="/login" className={secondaryButton}>
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </Af>
  );
}
