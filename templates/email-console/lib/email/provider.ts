import type { EmailEnv } from "../env";
import { assertProvider, type EmailMessage } from "./types";

// Development only: prints the email (including its link) to the server
// console. Links in reset/verify emails are secrets, so this adapter refuses
// to run in production and never logs there.
export async function sendWithProvider(message: EmailMessage, env: EmailEnv): Promise<void> {
  assertProvider("console", env.provider);

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "EMAIL_PROVIDER=console cannot send email in production. " +
        "Run: npx nextauthforge init --email smtp (or resend) and set the provider's env vars."
    );
  }

  console.log(
    [
      "",
      "---------- email (console provider, development only) ----------",
      `To:      ${message.to}`,
      `Subject: ${message.subject}`,
      "",
      message.text,
      "----------------------------------------------------------------",
      "",
    ].join("\n")
  );
}
