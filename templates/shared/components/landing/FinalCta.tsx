import Link from "next/link";
import { siteConfig } from "../../lib/site-config";
import { buttonClass, cx, headingFont, mutedText } from "../auth/ui";

export function FinalCta() {
  const { cta } = siteConfig;
  return (
    <section aria-labelledby="cta-title" className="border-t border-[color:var(--af-border)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="relative overflow-hidden rounded-[var(--af-radius)] border border-[color:var(--af-border-strong)] bg-[color:var(--af-surface)] px-6 py-12 text-center sm:px-12">
          <div aria-hidden="true" className="af-glow pointer-events-none absolute inset-0" />
          <div className="relative">
            <h2 id="cta-title" className={cx(headingFont, "text-3xl sm:text-4xl")}>
              {cta.title}
            </h2>
            <p className={cx(mutedText, "mx-auto mt-3 max-w-xl text-base")}>{cta.subtitle}</p>
            <div className="mt-8 flex justify-center">
              <Link href={cta.button.href} className={buttonClass("primary", "lg")}>
                {cta.button.label}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
