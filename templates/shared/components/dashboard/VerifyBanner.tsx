"use client";

import { FormAlert } from "../auth/FormAlert";
import { ResendButton } from "../auth/ResendButton";

/** Shown on the dashboard while the email is unverified. */
export function VerifyBanner({ email }: { email: string }) {
  return (
    <FormAlert tone="info" title="Please verify your email" className="mb-8">
      <p>
        We sent a verification link to <strong>{email}</strong>. Open it to confirm the address is yours.
      </p>
      <div className="mt-3 max-w-xs">
        <ResendButton email={email} fullWidth={false} />
      </div>
    </FormAlert>
  );
}
