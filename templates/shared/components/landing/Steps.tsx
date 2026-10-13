import { siteConfig } from "../../lib/site-config";
import { cx, headingFont, mutedText } from "../auth/ui";

export function Steps() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="scroll-mt-20 border-t border-[color:var(--af-border)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 id="how-title" className={cx(headingFont, "text-3xl sm:text-4xl")}>
          How it works
        </h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {siteConfig.steps.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--af-accent)] font-mono text-base font-black text-[color:var(--af-accent-fg)]"
              >
                {index + 1}
              </span>
              <div>
                <h3 className="text-lg font-bold">{step.title}</h3>
                <p className={cx(mutedText, "mt-1 text-sm leading-relaxed")}>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
