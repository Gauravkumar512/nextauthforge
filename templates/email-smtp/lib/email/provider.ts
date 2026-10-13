import nodemailer, { type Transporter } from "nodemailer";
import type { EmailEnv } from "../env";
import { assertProvider, type EmailMessage } from "./types";

const globalForMailer = globalThis as typeof globalThis & { _authMailer?: Transporter };

export async function sendWithProvider(message: EmailMessage, env: EmailEnv): Promise<void> {
  assertProvider("smtp", env.provider);
  const smtp = env.smtp!;

  globalForMailer._authMailer ??= nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await globalForMailer._authMailer.sendMail({
    from: env.from,
    to: message.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
