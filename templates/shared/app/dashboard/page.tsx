import type { Metadata } from "next";
import Link from "next/link";
import { CheckIcon } from "../../components/auth/icons";
import { FormAlert } from "../../components/auth/FormAlert";
import { cardClass, cx, headingFont, linkClass, mutedText } from "../../components/auth/ui";
import { VerifyBanner } from "../../components/dashboard/VerifyBanner";
import { authConfig } from "../../lib/auth-config";
import { requireUser } from "../../lib/auth/server";

export const metadata: Metadata = { title: "Overview" };

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date);

// EDIT: this page is a starting point. Replace the cards and the checklist with
// your own product's content.
export default async function DashboardPage() {
  const user = await requireUser({ verified: authConfig.requireEmailVerification });
  const verified = user.emailVerifiedAt !== null;
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;

  const checklist = [
    { label: "Create your account", done: true },
    { label: "Verify your email address", done: verified },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className={cx(headingFont, "text-3xl")}>Welcome, {firstName}</h1>
      <p className={cx(mutedText, "mt-2 text-sm")}>Here is a quick look at your account.</p>

      {!verified && (
        <div className="mt-8">
          <VerifyBanner email={user.email} />
        </div>
      )}

      <dl className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className={cx(cardClass, "p-5")}>
          <dt className={cx(mutedText, "text-xs font-bold uppercase tracking-widest")}>Email</dt>
          <dd className="mt-2 break-all text-sm font-bold">{user.email}</dd>
        </div>
        <div className={cx(cardClass, "p-5")}>
          <dt className={cx(mutedText, "text-xs font-bold uppercase tracking-widest")}>Email status</dt>
          <dd className={cx("mt-2 text-sm font-bold", verified ? "text-[color:var(--af-success)]" : "text-[color:var(--af-info)]")}>
            {verified ? "Verified" : "Not verified yet"}
          </dd>
        </div>
        <div className={cx(cardClass, "p-5")}>
          <dt className={cx(mutedText, "text-xs font-bold uppercase tracking-widest")}>Member since</dt>
          <dd className="mt-2 text-sm font-bold">{formatDate(user.createdAt)}</dd>
        </div>
      </dl>

      <section aria-labelledby="getting-started" className={cx(cardClass, "mt-8 p-6")}>
        <h2 id="getting-started" className="text-lg font-bold">
          Getting started
        </h2>
        <ul className="mt-4 space-y-3">
          {checklist.map((item) => (
            <li key={item.label} className="flex items-center gap-3 text-sm">
              <span
                aria-hidden="true"
                className={cx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                  item.done
                    ? "border-[color:var(--af-success)] bg-[color:var(--af-success-soft)] text-[color:var(--af-success)]"
                    : "border-[color:var(--af-border-strong)] text-transparent"
                )}
              >
                <CheckIcon className="h-3.5 w-3.5" />
              </span>
              <span className={item.done ? mutedText : "font-medium"}>
                {item.label}
                <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className={cx(mutedText, "mt-5 text-sm")}>
          Want to change your name or password? Open{" "}
          <Link href="/dashboard/settings" className={linkClass}>
            Settings
          </Link>
          .
        </p>
      </section>

      <FormAlert tone="info" title="Developer note" className="mt-8">
        This dashboard is a placeholder. Replace this page by editing <code className="font-mono">app/dashboard/page.tsx</code>. The
        sidebar and top bar live in <code className="font-mono">components/dashboard/DashboardShell.tsx</code>, and colours in{" "}
        <code className="font-mono">styles/authforge.css</code>.
      </FormAlert>
    </div>
  );
}
