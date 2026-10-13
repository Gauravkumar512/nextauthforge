"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { api, ApiError, describeError } from "../../lib/api-client";
import { changePasswordSchema, fieldErrors } from "../../lib/validators";
import { FormAlert } from "../auth/FormAlert";
import { PasswordInput } from "../auth/PasswordInput";
import { PasswordStrength } from "../auth/PasswordStrength";
import { SubmitButton } from "../auth/SubmitButton";
import { useFocusFirstError } from "../auth/useFocusFirstError";

export function PasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusFirstError(errors, formRef);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = changePasswordSchema.safeParse({ currentPassword, newPassword, confirmPassword });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await api("/api/auth/change-password", { method: "POST", body: parsed.data });
      toast.success("Password changed. Other devices were signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      else if (error instanceof ApiError && error.status === 400) setErrors({ currentPassword: error.message });
      else setFormError(describeError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <FormAlert tone="error">{formError}</FormAlert>}
      <PasswordInput
        id="settings-current"
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        required
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        error={errors.currentPassword}
      />
      <PasswordInput
        id="settings-new"
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        required
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        hint="Use 8 or more characters."
        error={errors.newPassword}
        below={<PasswordStrength id="settings-strength" password={newPassword} />}
      />
      <PasswordInput
        id="settings-confirm"
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
      />
      <div className="sm:max-w-[12rem]">
        <SubmitButton loading={loading} loadingText="Updating...">
          Update password
        </SubmitButton>
      </div>
    </form>
  );
}
