import type { ReactElement } from "react";
import { Resend } from "resend";

type SendEmailInput = {
  to: string | string[];
  subject: string;
  react: ReactElement;
};

/**
 * Resend send helper. Env-gated: without RESEND_API_KEY the email is logged
 * to the console and reported as sent — email delivery must never block a
 * lead (the Quotes record is created before this runs anyway).
 */
export async function sendEmail({ to, subject, react }: SendEmailInput): Promise<{ ok: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.PUBLIC_CONTACT_EMAIL ?? "info@pkeeconstructions.ca";
  const from = `PKEE Constructions <${fromAddress}>`;

  if (!apiKey) {
    // biome-ignore lint/suspicious/noConsole: dev-mode fallback — log instead of sending.
    console.info(`[emails] RESEND_API_KEY unset — not sending "${subject}" to ${String(to)}`);
    return { ok: true };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from, to, subject, react });

  if (error) {
    // biome-ignore lint/suspicious/noConsole: delivery failure must be visible in logs, never thrown.
    console.error(`[emails] Resend error for "${subject}":`, error);
    return { ok: false };
  }

  return { ok: true };
}
