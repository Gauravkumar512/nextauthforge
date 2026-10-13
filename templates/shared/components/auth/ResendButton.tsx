"use client";

import { useEffect, useState } from "react";
import { api, describeError } from "../../lib/api-client";
import { authConfig } from "../../lib/auth-config";
import { SubmitButton } from "./SubmitButton";
import { cx, mutedText } from "./ui";

/**
 * "Send a new verification email" with a client-side cooldown that mirrors the
 * server's (resendCooldownSeconds). The server answers the same way whether or
 * not an email was actually sent, so this never promises more than "if needed".
 */
export function ResendButton({
  email,
  variant = "secondary",
  fullWidth = true,
}: {
  email: string;
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(0);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(timer);
  }, [wait]);

  async function resend() {
    setLoading(true);
    setMessage(null);
    try {
      await api("/api/auth/resend-verification", { method: "POST", body: { email } });
      setMessage({ ok: true, text: "If your account still needs verifying, a new email is on its way." });
      setWait(authConfig.tokens.resendCooldownSeconds);
    } catch (error) {
      setMessage({ ok: false, text: describeError(error) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <SubmitButton
        type="button"
        variant={variant}
        fullWidth={fullWidth}
        loading={loading}
        loadingText="Sending..."
        disabled={wait > 0 || !email}
        onClick={resend}
      >
        {wait > 0 ? `Resend available in ${wait}s` : "Resend verification email"}
      </SubmitButton>
      <p
        role={message && !message.ok ? "alert" : "status"}
        className={cx("mt-2 min-h-5 text-sm", message?.ok === false ? "text-[color:var(--af-danger)]" : mutedText)}
      >
        {message?.text}
      </p>
    </div>
  );
}
