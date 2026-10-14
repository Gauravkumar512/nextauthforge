// Resend adapter (plain fetch, no SDK). Configure it with RESEND_API_KEY and
// EMAIL_FROM in .env.local. To use another provider, re-run `init` with --email
// and --force, or replace sendWithProvider() below.
import type { EmailEnv } from "../env";
import { assertProvider, type EmailMessage } from "./types";

// Plain fetch against the Resend REST API (no SDK).
export async function sendWithProvider(message: EmailMessage, env: EmailEnv): Promise<void> {
  assertProvider("resend", env.provider);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    // Status only: the response body can echo the recipient or request details.
    throw new Error(`Resend responded with HTTP ${response.status}`);
  }
}
