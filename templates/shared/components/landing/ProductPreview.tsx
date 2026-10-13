import { authConfig } from "../../lib/auth-config";
import { cardClass, cx, headingFont, mutedText } from "../auth/ui";

// A decorative preview built from plain HTML/CSS (no images): the sign-in card
// and the dashboard status cards you get. It is hidden from assistive tech and
// is not interactive.
export function ProductPreview() {
  return (
    <section aria-labelledby="preview-title" className="border-t border-[color:var(--af-border)]">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <h2 id="preview-title" className={cx(headingFont, "text-3xl sm:text-4xl")}>
          See it in action
        </h2>
        <p className={cx(mutedText, "mt-3 max-w-2xl text-sm leading-relaxed sm:text-base")}>
          A preview of the sign-in screen and the dashboard you get out of the box.
        </p>

        <div aria-hidden="true" className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Sign-in card */}
          <div className={cx(cardClass, "p-6 sm:p-8")}>
            <p className={cx(headingFont, "text-xl")}>Welcome back</p>
            <p className={cx(mutedText, "mt-1 text-sm")}>Sign in to your account.</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-[color:var(--af-muted)]">Email</p>
                <div className="mt-2 rounded-[var(--af-radius)] border border-[color:var(--af-border-strong)] bg-[color:var(--af-surface-2)] px-3.5 py-3 text-sm text-[color:var(--af-placeholder)]">
                  you@example.com
                </div>
              </div>
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-[color:var(--af-muted)]">Password</p>
                <div className="mt-2 rounded-[var(--af-radius)] border border-[color:var(--af-border-strong)] bg-[color:var(--af-surface-2)] px-3.5 py-3 text-sm text-[color:var(--af-placeholder)]">
                  ••••••••••
                </div>
              </div>
              <div className="rounded-[var(--af-radius)] bg-[color:var(--af-accent)] px-4 py-3 text-center text-sm font-bold text-[color:var(--af-accent-fg)]">
                Sign in
              </div>
            </div>
          </div>

          {/* Dashboard mock */}
          <div className={cx(cardClass, "p-6 sm:p-8")}>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[color:var(--af-border-strong)]" />
              <span className="h-3 w-3 rounded-full bg-[color:var(--af-border-strong)]" />
              <span className="h-3 w-3 rounded-full bg-[color:var(--af-border-strong)]" />
              <span className={cx(mutedText, "ml-2 font-mono text-xs")}>{authConfig.appName} / dashboard</span>
            </div>
            <p className={cx(headingFont, "mt-6 text-xl")}>Welcome back</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[var(--af-radius)] border border-[color:var(--af-border)] bg-[color:var(--af-surface-2)] p-4">
                <p className={cx(mutedText, "text-xs")}>Email</p>
                <p className="mt-1 text-sm font-bold text-[color:var(--af-success)]">Verified</p>
              </div>
              <div className="rounded-[var(--af-radius)] border border-[color:var(--af-border)] bg-[color:var(--af-surface-2)] p-4">
                <p className={cx(mutedText, "text-xs")}>Member since</p>
                <p className="mt-1 text-sm font-bold">Today</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-3 w-3/4 rounded-full bg-[color:var(--af-border)]" />
              <div className="h-3 w-1/2 rounded-full bg-[color:var(--af-border)]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
