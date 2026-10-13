"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { api, describeError } from "../../../lib/api-client";
import { fieldErrors, forgotPasswordSchema } from "../../../lib/validators";
import { AuthShell } from "../../../components/auth/AuthShell";
import { FormAlert } from "../../../components/auth/FormAlert";
import { FormField } from "../../../components/auth/FormField";
import { MailIcon } from "../../../components/auth/icons";
import { SubmitButton } from "../../../components/auth/SubmitButton";
import { linkClass } from "../../../components/auth/ui";
import { useFocusFirstError } from "../../../components/auth/useFocusFirstError";

export default function ForgotPasswordPage() {
  const formRef = useRef<HTMLFormElement>(null);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useFocusFirstError(errors, formRef);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await api("/api/auth/forgot-password", { method: "POST", body: parsed.data });
      setSent(true);
    } catch (error) {
      setFormError(describeError(error));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    // The same message is shown whether or not the account exists.
    return (
      <AuthShell
        title="Check your email"
        subtitle="If an account exists for that address, we sent a link to reset the password. It is valid for a limited time."
        footer={
          <Link href="/login" className={linkClass}>
            Back to sign in
          </Link>
        }
      >
        <div className="flex justify-center text-[color:var(--af-accent)]">
          <MailIcon className="h-10 w-10" />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we will send you a link to reset it."
      footer={
        <Link href="/login" className={linkClass}>
          Back to sign in
        </Link>
      }
    >
      {formError && (
        <FormAlert tone="error" className="mb-5">
          {formError}
        </FormAlert>
      )}
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField
          id="forgot-email"
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          error={errors.email}
        />
        <SubmitButton loading={loading} loadingText="Sending...">
          Send reset link
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
