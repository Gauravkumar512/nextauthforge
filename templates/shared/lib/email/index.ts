import { getEmailEnv } from "../env";
import type { EmailMessage } from "./types";
import { sendWithProvider } from "./provider";

export type { EmailMessage } from "./types";

/**
 * Sends one email through the provider selected by EMAIL_PROVIDER
 * (smtp | resend | console). Throws on failure; callers log the error
 * (without the message body, which can contain secret links).
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  await sendWithProvider(message, getEmailEnv());
}
