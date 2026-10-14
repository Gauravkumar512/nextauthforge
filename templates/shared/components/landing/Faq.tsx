import { siteConfig } from "../../lib/site-config";
import { ChevronDownIcon } from "../auth/icons";
import { cx, headingFont, mutedText } from "../auth/ui";

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-20 border-t border-[color:var(--af-border)]">
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 id="faq-title" className={cx(headingFont, "text-3xl sm:text-4xl")}>
          Frequently asked questions
        </h2>
        <div className="mt-8 border-t border-[color:var(--af-border)]">
          {siteConfig.faq.map((item) => (
            <details key={item.question} className="group border-b border-[color:var(--af-border)]">
              <summary className="flex cursor-pointer items-center justify-between gap-4 py-5 text-left text-base font-bold">
                <span>{item.question}</span>
                <ChevronDownIcon className="af-chevron h-5 w-5 shrink-0 text-[color:var(--af-accent)] transition-transform" />
              </summary>
              <p className={cx(mutedText, "pb-5 text-sm leading-relaxed")}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
