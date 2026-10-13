import { authConfig } from "../auth-config";
import { getAppUrl } from "../env";
import type { EmailMessage } from "./types";

type Content = Omit<EmailMessage, "to">;

/** Escapes text for use inside HTML (element content and quoted attributes). */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Header values must not contain line breaks.
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

function duration(seconds: number): string {
  if (seconds % 3600 === 0) {
    const hours = seconds / 3600;
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  const minutes = Math.round(seconds / 60);
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}

interface Layout {
  title: string;
  /** Paragraphs shown before the button (plain text; escaped here). */
  intro: string[];
  button?: { label: string; url: string };
  /** Paragraphs shown after the button (plain text; escaped here). */
  outro: string[];
}

// Table-based layout with inline CSS: the only thing mail clients render reliably.
function renderHtml(layout: Layout): string {
  const brand = escapeHtml(authConfig.appName);
  const paragraph = (text: string) =>
    `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${escapeHtml(text)}</p>`;
  const button = layout.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:6px;background:#111827;"><a href="${escapeHtml(layout.button.url)}" style="display:inline-block;padding:12px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(layout.button.label)}</a></td></tr></table>` +
      `<p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#6b7280;">If the button doesn't work, copy this link into your browser:<br><a href="${escapeHtml(layout.button.url)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(layout.button.url)}</a></p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(layout.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:8px;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<tr><td>
<p style="margin:0 0 24px;font-size:18px;font-weight:700;color:#111827;">${brand}</p>
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:#111827;">${escapeHtml(layout.title)}</h1>
${layout.intro.map(paragraph).join("\n")}
${button}
${layout.outro.map(paragraph).join("\n")}
</td></tr>
</table>
<p style="margin:16px 0 0;font-size:12px;color:#9ca3af;font-family:Helvetica,Arial,sans-serif;">Sent by ${brand}</p>
</td></tr>
</table>
</body>
</html>`;
}

function renderText(layout: Layout): string {
  return [
    authConfig.appName,
    "",
    layout.title,
    "",
    ...layout.intro.flatMap((p) => [p, ""]),
    ...(layout.button ? [`${layout.button.label}: ${layout.button.url}`, ""] : []),
    ...layout.outro.flatMap((p) => [p, ""]),
  ]
    .join("\n")
    .trimEnd();
}

function build(subject: string, layout: Layout): Content {
  return { subject: oneLine(subject), html: renderHtml(layout), text: renderText(layout) };
}

export function verifyEmailContent(input: { name: string; link: string }): Content {
  const ttl = duration(authConfig.tokens.verifyTokenTtlSeconds);
  return build(`Verify your email for ${authConfig.appName}`, {
    title: "Verify your email address",
    intro: [
      `Hi ${oneLine(input.name)},`,
      `Thanks for signing up for ${authConfig.appName}. Please confirm your email address to finish setting up your account.`,
    ],
    button: { label: "Verify email", url: input.link },
    outro: [
      `This link is valid for ${ttl} and can only be used once.`,
      "If you didn't create an account, you can safely ignore this email. No account will be activated.",
    ],
  });
}

export function resetPasswordContent(input: { name: string; link: string }): Content {
  const ttl = duration(authConfig.tokens.resetTokenTtlSeconds);
  return build(`Reset your ${authConfig.appName} password`, {
    title: "Reset your password",
    intro: [
      `Hi ${oneLine(input.name)},`,
      `We received a request to reset the password for your ${authConfig.appName} account. Use the button below to choose a new one.`,
    ],
    button: { label: "Reset password", url: input.link },
    outro: [
      `This link is valid for ${ttl} and can only be used once.`,
      "If you didn't request a password reset, you can safely ignore this email. Your password won't change.",
    ],
  });
}

export function passwordChangedContent(input: { name: string; when: Date }): Content {
  const forgotUrl = `${getAppUrl()}/forgot-password`;
  return build(`Your ${authConfig.appName} password was changed`, {
    title: "Your password was changed",
    intro: [
      `Hi ${oneLine(input.name)},`,
      `The password for your ${authConfig.appName} account was changed on ${input.when.toUTCString()}. You were signed out of your other devices.`,
    ],
    button: { label: "Reset password", url: forgotUrl },
    outro: [
      "If this was you, no further action is needed.",
      "If it wasn't you, reset your password right away using the button above, and contact the owner of this site.",
    ],
  });
}
