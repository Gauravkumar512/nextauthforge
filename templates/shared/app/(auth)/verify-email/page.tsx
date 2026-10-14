"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api-client";
import { AuthShell } from "../../../components/auth/AuthShell";
import { FormField } from "../../../components/auth/FormField";
import { CheckIcon, MailIcon } from "../../../components/auth/icons";
import { ResendButton } from "../../../components/auth/ResendButton";
import { Spinner } from "../../../components/auth/Spinner";
import { linkClass, primaryButton } from "../../../components/auth/ui";
import { createCapturedParam, useCapturedParam } from "../../../components/auth/useUrlParam";

// Read once; the token is removed from the address bar, history and Referer headers.
const tokenParam = createCapturedParam("token", { strip: true });
const emailParam = createCapturedParam("email");

type Result = "verified" | "failed" | null;

export default function VerifyEmailPage() {
  const token = useCapturedParam(tokenParam); // undefined until read, then the token or null
  const emailFromLink = useCapturedParam(emailParam);
  const [emailInput, setEmailInput] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);
  // The verification link is single-use: make sure the effect only calls the API once.
  const started = useRef(false);

  const email = emailInput ?? emailFromLink ?? "";
  const status = token === undefined ? "checking" : token === null ? "waiting" : (result ?? "checking");

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;

    api("/api/auth/verify-email", { method: "POST", body: { token } })
      .then(() => setResult("verified"))
      .catch(() => setResult("failed"));
  }, [token]);

  const resend = (
    <div className="space-y-5">
      <FormField
        id="verify-email-address"
        label="Your email"
        type="email"
        autoComplete="email"
        inputMode="email"
        value={email}
        onChange={(e) => setEmailInput(e.target.value)}
        placeholder="you@example.com"
      />
      <ResendButton email={email.trim().toLowerCase()} />
    </div>
  );

  if (status === "checking") {
    return (
      <AuthShell title="Verifying your email">
        <div role="status" className="flex items-center gap-3 text-[color:var(--af-muted)]">
          <Spinner className="h-5 w-5" />
          <span>One moment...</span>
        </div>
      </AuthShell>
    );
  }

  if (status === "verified") {
    return (
      <AuthShell title="Email verified" subtitle="Thanks! Your email address is confirmed.">
        <div className="mb-5 flex justify-center text-[color:var(--af-success)]">
          <CheckIcon className="h-10 w-10" />
        </div>
        <Link href="/login?verified=1" className={`${primaryButton} w-full`}>
          Continue to sign in
        </Link>
      </AuthShell>
    );
  }

  if (status === "failed") {
    return (
      <AuthShell
        title="This link doesn't work"
        subtitle="Verification links expire and can only be used once. Request a new one below."
        footer={
          <Link href="/login" className={linkClass}>
            Back to sign in
          </Link>
        }
      >
        {resend}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Check your email"
      subtitle="We sent you a link to verify your address. Didn't get it? Request another below."
      footer={
        <Link href="/login" className={linkClass}>
          Back to sign in
        </Link>
      }
    >
      <div className="mb-5 flex justify-center text-[color:var(--af-accent)]">
        <MailIcon className="h-10 w-10" />
      </div>
      {resend}
    </AuthShell>
  );
}
