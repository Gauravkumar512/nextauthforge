export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Only the adapter chosen at `init` time is generated. If EMAIL_PROVIDER is
 * changed in the environment to one that isn't included, fail with a clear fix.
 */
export function assertProvider(included: string, configured: string): void {
  if (included !== configured) {
    throw new Error(
      `EMAIL_PROVIDER is "${configured}" but this project only includes the "${included}" adapter. ` +
        `Run: npx nextauthforge init --email ${configured}`
    );
  }
}
