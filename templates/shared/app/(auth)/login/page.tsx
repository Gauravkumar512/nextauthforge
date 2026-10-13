"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";
import { api, ApiError, describeError } from "../../../lib/api-client";
import { safeNext } from "../../../lib/safe-redirect";
import { fieldErrors, loginSchema } from "../../../lib/validators";
import { AuthShell } from "../../../components/auth/AuthShell";
import { FormAlert } from "../../../components/auth/FormAlert";
import { FormField } from "../../../components/auth/FormField";
import { PasswordInput } from "../../../components/auth/PasswordInput";
import { ResendButton } from "../../../components/auth/ResendButton";
import { SubmitButton } from "../../../components/auth/SubmitButton";
import { linkClass } from "../../../components/auth/ui";
import { useFocusFirstError } from "../../../components/auth/useFocusFirstError";
import { useSearchParam } from "../../../components/auth/useUrlParam";

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [unverified, setUnverified] = useState(false);
  const [loading, setLoading] = useState(false);

  useFocusFirstError(errors, formRef);

  // ?verified=1 comes from the email verification page, ?reset=1 from the reset page.
  const verifiedParam = useSearchParam("verified");
  const resetParam = useSearchParam("reset");
  const notice = verifiedParam === "1" ? "verified" : resetParam === "1" ? "reset" : null;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setUnverified(false);

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await api("/api/auth/login", { method: "POST", body: parsed.data });
      await refresh();
      toast.success("Welcome back!");
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(next);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.code === "EMAIL_NOT_VERIFIED") {
        setUnverified(true);
      } else if (error instanceof ApiError && error.fields) {
        setErrors(error.fields);
      } else {
        setFormError(describeError(error));
      }
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your account."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link href="/signup" className={linkClass}>
            Create one
          </Link>
        </>
      }
    >
      {notice === "verified" && (
        <FormAlert tone="success" title="Email verified" className="mb-5">
          Thanks! You can sign in now.
        </FormAlert>
      )}
      {notice === "reset" && (
        <FormAlert tone="success" title="Password updated" className="mb-5">
          Sign in with your new password.
        </FormAlert>
      )}
      {formError && (
        <FormAlert tone="error" className="mb-5">
          {formError}
        </FormAlert>
      )}
      {unverified && (
        <div className="mb-5">
          <FormAlert tone="info" title="Please verify your email first">
            We sent a link to <strong>{email.trim()}</strong>. Open it, then sign in. Didn&apos;t get it? Request a new one below.
          </FormAlert>
          <div className="mt-3">
            <ResendButton email={email.trim().toLowerCase()} />
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField
          id="login-email"
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
        <PasswordInput
          id="login-password"
          label="Password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Your password"
          error={errors.password}
          labelAction={
            <Link href="/forgot-password" className="text-xs text-[color:var(--af-accent)] underline hover:text-[color:var(--af-accent-hover)]">
              Forgot password?
            </Link>
          }
        />
        <SubmitButton loading={loading} loadingText="Signing in...">
          Sign in
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
