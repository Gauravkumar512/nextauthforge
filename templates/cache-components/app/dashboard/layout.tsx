import type { Metadata } from "next";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { Af } from "../../components/auth/Af";
import { Spinner } from "../../components/auth/Spinner";
import { DashboardShell } from "../../components/dashboard/DashboardShell";
import { authConfig } from "../../lib/auth-config";
import { requireUser } from "../../lib/auth/server";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s · Dashboard" },
  robots: { index: false },
};

// This project has `cacheComponents` enabled, where reading the session cookie
// must happen under a <Suspense> boundary. The static shell below streams
// first; the signed-in content follows. Signed-out visitors are still
// redirected before any protected content is sent.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <Af>
      <Suspense fallback={<DashboardFallback />}>
        <AuthedShell>{children}</AuthedShell>
      </Suspense>
    </Af>
  );
}

async function AuthedShell({ children }: { children: ReactNode }) {
  const user = await requireUser({ verified: authConfig.requireEmailVerification });
  return (
    <DashboardShell name={user.name} email={user.email}>
      {children}
    </DashboardShell>
  );
}

function DashboardFallback() {
  return (
    <div role="status" className="flex min-h-screen items-center justify-center text-[color:var(--af-muted)]">
      <Spinner className="h-6 w-6" />
      <span className="sr-only">Loading your dashboard</span>
    </div>
  );
}
