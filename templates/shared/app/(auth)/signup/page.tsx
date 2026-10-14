"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../../hooks/useAuth";
import { api, ApiError, describeError } from "../../../lib/api-client";
import { safeNext } from "../../../lib/safe-redirect";
import { fieldErrors, signupSchema } from "../../../lib/validators";
import { AuthShell } from "../../../components/auth/AuthShell";
import { FormAlert } from "../../../components/auth/FormAlert";
import { FormField } from "../../../components/auth/FormField";
import { MailIcon } from "../../../components/auth/icons";
import { PasswordInput } from "../../../components/auth/PasswordInput";
import { PasswordStrength } from "../../../components/auth/PasswordStrength";
import { ResendButton } from "../../../components/auth/ResendButton";
import { SubmitButton } from "../../../components/auth/SubmitButton";
import { linkClass } from "../../../components/auth/ui";
import { useFocusFirstError } from "../../../components/auth/useFocusFirstError";

interface SignupResponse {
  success: boolean;
  requiresVerification?: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkInbox, setCheckInbox] = useState(false);

  useFocusFirstError(errors, formRef);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signupSchema.safeParse({ name, email, password, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      const data = await api<SignupResponse>("/api/auth/signup", { method: "POST", body: parsed.data });
      if (data.requiresVerification) {
        // No session yet: the user has to click the link in the email first.
        setCheckInbox(true);
        setLoading(false);
        return;
      }
      await refresh();
      toast.success("Account created!");
      const next = safeNext(new URLSearchParams(window.location.search).get("next"));
      router.replace(next);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      else setFormError(describeError(error));
      setLoading(false);
    }
  }

  if (checkInbox) {
    const address = email.trim().toLowerCase();
    return (
      <AuthShell
        title="Check your inbox"
        subtitle={
          <>
            We sent a verification link to <strong className="text-[color:var(--af-text)]">{address}</strong>. Open it to activate your account.
          </>
        }
        footer={
          <>
            Already verified?{" "}
            <Link href="/login" className={linkClass}>
              Sign in
            </Link>
          </>
        }
      >
        <div className="mb-5 flex justify-center text-[color:var(--af-accent)]">
          <MailIcon className="h-10 w-10" />
        </div>
        <ResendButton email={address} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="It only takes a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className={linkClass}>
            Sign in
          </Link>
        </>
      }
    >
      {formError && (
        <FormAlert tone="error" className="mb-5">
          {formError}
        </FormAlert>
      )}

      <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
        <FormField
          id="signup-name"
          label="Name"
          name="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ada Lovelace"
          error={errors.name}
        />
        <FormField
          id="signup-email"
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
          id="signup-password"
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          hint="Use 8 or more characters. A longer phrase is stronger."
          error={errors.password}
          below={<PasswordStrength id="signup-strength" password={password} />}
        />
        <PasswordInput
          id="signup-confirm"
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          error={errors.confirmPassword}
        />

        <p className="text-xs leading-relaxed text-[color:var(--af-muted)]">
          By creating an account you agree to the{" "}
          <Link href="/terms" className={linkClass}>
            Terms
          </Link>{" "}
          and the{" "}
          <Link href="/privacy" className={linkClass}>
            Privacy Policy
          </Link>
          .
        </p>

        <SubmitButton loading={loading} loadingText="Creating account...">
          Create account
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
