import Link from "next/link";
import { siteConfig } from "../../lib/site-config";
import { buttonClass, cx, headingFont, mutedText } from "../auth/ui";

export function Hero() {
  const { hero } = siteConfig;
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="af-grid-bg pointer-events-none absolute inset-0 opacity-60" />
      <div
        aria-hidden="true"
        className="af-glow pointer-events-none absolute left-1/2 top-1/2 h-[640px] w-[640px] max-w-full -translate-x-1/2 -translate-y-1/2"
      />
      <div className="relative mx-auto max-w-4xl px-4 pb-20 pt-16 text-center sm:px-6 sm:pb-28 sm:pt-24">
        <p className="mx-auto inline-block rounded-full border border-[color:var(--af-border-strong)] px-3 py-1 font-mono text-xs font-bold uppercase tracking-widest text-[color:var(--af-accent)]">
          {hero.eyebrow}
        </p>
        <h1 className={cx(headingFont, "mt-6 text-4xl leading-tight sm:text-5xl lg:text-6xl")}>{hero.title}</h1>
        <p className={cx(mutedText, "mx-auto mt-6 max-w-2xl text-base leading-relaxed sm:text-lg")}>{hero.subtitle}</p>
        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href={hero.primaryCta.href} className={buttonClass("primary", "lg")}>
            {hero.primaryCta.label}
          </Link>
          <a href={hero.secondaryCta.href} className={buttonClass("secondary", "lg")}>
            {hero.secondaryCta.label}
          </a>
        </div>
      </div>
    </section>
  );
}
