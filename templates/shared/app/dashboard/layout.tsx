import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Af } from "../../components/auth/Af";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { authConfig } from "../../lib/auth-config";
import { requireUser } from "../../lib/auth/server";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
  robots: { index: false },
};

// Server component: signed-out visitors are redirected before anything renders,
// so there is no loading spinner and no flash of protected content.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireUser({ verified: authConfig.requireEmailVerification });

  return (
    <Af>
      <DashboardShell name={user.name} email={user.email}>
        {children}
      </DashboardShell>
    </Af>
  );
}
