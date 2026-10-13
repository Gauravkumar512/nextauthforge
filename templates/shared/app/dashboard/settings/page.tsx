import type { Metadata } from "next";
import type { ReactNode } from "react";
import { cardClass, cx, headingFont, mutedText } from "../../../components/auth/ui";
import { PasswordForm } from "../../../components/dashboard/PasswordForm";
import { ProfileForm } from "../../../components/dashboard/ProfileForm";
import { SignOutEverywhere } from "../../../components/dashboard/SignOutEverywhere";
import { authConfig } from "../../../lib/auth-config";
import { requireUser } from "../../../lib/auth/server";

export const metadata: Metadata = { title: "Settings" };

function Section({ id, title, description, children }: { id: string; title: string; description: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className={cx(cardClass, "p-6")}>
      <h2 id={id} className="text-lg font-bold">
        {title}
      </h2>
      <p className={cx(mutedText, "mt-1 text-sm")}>{description}</p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export default async function SettingsPage() {
  const user = await requireUser({ verified: authConfig.requireEmailVerification });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className={cx(headingFont, "text-3xl")}>Settings</h1>
        <p className={cx(mutedText, "mt-2 text-sm")}>Manage your profile and security.</p>
      </div>

      <Section id="profile-heading" title="Profile" description="Your name is shown in the dashboard.">
        <ProfileForm initialName={user.name} email={user.email} />
      </Section>

      <Section id="password-heading" title="Password" description="Changing it signs you out of your other devices.">
        <PasswordForm />
      </Section>

      <Section id="sessions-heading" title="Sessions" description="End every active session, on every device.">
        <SignOutEverywhere />
      </Section>
    </div>
  );
}
