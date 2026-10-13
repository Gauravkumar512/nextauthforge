import type { ReactNode } from "react";
import { siteConfig } from "../../lib/site-config";
import { KeyIcon, LockIcon, MailIcon, RefreshIcon, SettingsIcon, ShieldIcon } from "../auth/icons";
import { cardClass, cx, headingFont, mutedText } from "../auth/ui";

const ICONS: Record<string, ReactNode> = {
  shield: <ShieldIcon className="h-6 w-6" />,
  mail: <MailIcon className="h-6 w-6" />,
  key: <KeyIcon className="h-6 w-6" />,
  refresh: <RefreshIcon className="h-6 w-6" />,
  lock: <LockIcon className="h-6 w-6" />,
  settings: <SettingsIcon className="h-6 w-6" />,
};

export function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="scroll-mt-20 border-t border-[color:var(--af-border)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 id="features-title" className={cx(headingFont, "text-3xl sm:text-4xl")}>
          What&apos;s included
        </h2>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {siteConfig.features.map((feature) => (
            <li key={feature.title} className={cx(cardClass, "p-6")}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--af-radius)] bg-[color:var(--af-accent-soft)] text-[color:var(--af-accent)]">
                {ICONS[feature.icon] ?? ICONS.shield}
              </span>
              <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
              <p className={cx(mutedText, "mt-2 text-sm leading-relaxed")}>{feature.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
