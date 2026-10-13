"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { FormEvent } from "react";
import toast from "react-hot-toast";
import { useOptionalAuth } from "../../hooks/useAuth";
import { api, ApiError, describeError } from "../../lib/api-client";
import { fieldErrors, profileSchema } from "../../lib/validators";
import { FormAlert } from "../auth/FormAlert";
import { FormField } from "../auth/FormField";
import { SubmitButton } from "../auth/SubmitButton";
import { useFocusFirstError } from "../auth/useFocusFirstError";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const router = useRouter();
  const auth = useOptionalAuth();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(initialName);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useFocusFirstError(errors, formRef);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = profileSchema.safeParse({ name });
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }
    setErrors({});

    setLoading(true);
    try {
      await api("/api/auth/profile", { method: "PATCH", body: parsed.data });
      setName(parsed.data.name);
      toast.success("Profile updated");
      await auth?.refresh();
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.fields) setErrors(error.fields);
      else setFormError(describeError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <FormAlert tone="error">{formError}</FormAlert>}
      <FormField
        id="settings-name"
        label="Name"
        name="name"
        autoComplete="name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <FormField
        id="settings-email"
        label="Email"
        type="email"
        name="email"
        value={email}
        readOnly
        hint="Your email address can't be changed here."
      />
      <div className="sm:max-w-[12rem]">
        <SubmitButton loading={loading} loadingText="Saving..." disabled={name.trim() === initialName.trim()}>
          Save changes
        </SubmitButton>
      </div>
    </form>
  );
}
