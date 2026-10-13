"use client";

import { useState } from "react";
import { api, describeError, hardNavigate } from "../../lib/api-client";
import { FormAlert } from "../auth/FormAlert";
import { SubmitButton } from "../auth/SubmitButton";

/** "Sign out everywhere" with a confirm step, because it ends this session too. */
export function SignOutEverywhere() {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signOutEverywhere() {
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/logout-all", { method: "POST", onAuthFail: "throw" });
      hardNavigate("/login");
    } catch (err) {
      setError(describeError(err));
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <div className="sm:max-w-[14rem]">
        <SubmitButton type="button" variant="danger" onClick={() => setConfirming(true)}>
          Sign out everywhere
        </SubmitButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <FormAlert tone="info" title="Sign out of every device?">
        This ends all of your sessions, including this one. You will need to sign in again.
      </FormAlert>
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <div className="flex flex-col gap-3 sm:flex-row">
        <SubmitButton
          type="button"
          variant="danger"
          fullWidth={false}
          loading={loading}
          loadingText="Signing out..."
          onClick={signOutEverywhere}
        >
          Yes, sign out everywhere
        </SubmitButton>
        <SubmitButton type="button" variant="secondary" fullWidth={false} disabled={loading} onClick={() => setConfirming(false)}>
          Cancel
        </SubmitButton>
      </div>
    </div>
  );
}
