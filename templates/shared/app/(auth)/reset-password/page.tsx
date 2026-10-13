"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import { api, ApiError, describeError } from "../../../lib/api-client";
import { fieldErrors, resetPasswordSchema } from "../../../lib/validators";
import { AuthShell } from "../../../components/auth/AuthShell";
import { FormAlert } from "../../../components/auth/FormAlert";
import { PasswordInput } from "../../../components/auth/PasswordInput";
import { PasswordStrength } from "../../../components/auth/PasswordStrength";
import { SubmitButton } from "../../../components/auth/SubmitButton";
import { linkClass, primaryButton } from "../../../components/auth/ui";
import { useFocusFirstError } from "../../../components/auth/useFocusFirstError";
import { createCapturedParam, useCapturedParam } from "../../../components/auth/useUrlParam";

// Reads ?token= once and removes it from the address bar, history and Referer headers.
const tokenParam = createCapturedParam("token", { strip: true });

export default function ResetPasswordPage() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  // undefined = not read yet, null = no token in the URL
  const token = useCapturedParam(tokenParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [tokenRejected, setTokenRejected] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusFirstError(errors, formRef);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = resetPasswordSchema.safeParse({ token, password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await api("/api/auth/reset-password", { method: "POST", body: parsed.data });
      router.replace("/login?reset=1");
    } catch (error) {
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      else if (error instanceof ApiError && error.status === 400) setTokenRejected(true);
      else setFormError(describeError(error));
      setLoading(false);
    }
  }

  if (token === undefined) return <AuthShell title="Reset your password" />;

  if (token === null || tokenRejected) {
    return (
      <AuthShell
        title="This link doesn't work"
        subtitle="Reset links expire after a short time and can only be used once."
        footer={
          <Link href="/login" className={linkClass}>
            Back to sign in
          </Link>
        }
      >
        <Link href="/forgot-password" className={`${primaryButton} w-full`}>
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle="Pick something you don't use anywhere else.">
      {formError && (
        <FormAlert tone="error" className="mb-5">
          {formError}
        </FormAlert>
      )}
      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
        <PasswordInput
          id="reset-password"
          label="New password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          hint="Use 8 or more characters."
          error={errors.password}
          below={<PasswordStrength id="reset-strength" password={password} />}
        />
        <PasswordInput
          id="reset-confirm"
          label="Confirm new password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat the password"
          error={errors.confirmPassword}
        />
        <SubmitButton loading={loading} loadingText="Saving...">
          Set new password
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
