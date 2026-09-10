"use server";

import { redirect } from "next/navigation";
import { ContactConfirmationEmail, type ContactSummaryRow } from "@/emails/ContactConfirmation";
import { ContactNotificationEmail } from "@/emails/ContactNotification";
import { contactSubjectLabel } from "@/lib/contact";
import { sendEmail } from "@/lib/emails";
import { getPayloadCached } from "@/lib/payload";
import { type ContactMessageInput, contactMessageSchema } from "@/lib/validators/contact";

export type ContactActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; errors: Record<string, string>; formError?: string };

const FORM_ERROR = "Something went wrong sending your message. Please try again.";

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

/**
 * Turnstile verification — env-gated. Unset secret = dev mode, skip
 * verification silently; set = tokens verified server-side via siteverify.
 */
async function verifyTurnstile(token: string | undefined): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const json = (await response.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

/** Raw FormData → schema input shape (everything arrives as a string). */
function parseFormData(formData: FormData) {
  return {
    name: getString(formData, "name"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    subject: getString(formData, "subject"),
    message: getString(formData, "message"),
    website: getString(formData, "website"), // honeypot — must stay empty
  };
}

function buildSummaryRows(data: ContactMessageInput): ContactSummaryRow[] {
  const rows: ContactSummaryRow[] = [];
  const push = (label: string, value: string | null | undefined) => {
    if (value) rows.push({ label, value });
  };
  push("Name", data.name);
  push("Email", data.email);
  push("Phone", data.phone);
  push("Topic", contactSubjectLabel(data.subject));
  return rows;
}

/**
 * The /contact pipeline. Order of operations: honeypot → Turnstile → zod
 * re-validation → ContactMessages doc (status "new") → only then emails.
 * Email failure never blocks or rolls back the message. Success redirects
 * to /contact?sent=1 — the page renders the confirmation state from the
 * query string, so nothing about the message is exposed publicly.
 */
export async function submitContactMessage(
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  // 1. Honeypot — pretend success so bots get no signal, but store nothing.
  if (getString(formData, "website")) {
    redirect("/contact?sent=1");
  }

  // 2. Turnstile (env-gated).
  if (!(await verifyTurnstile(getString(formData, "cf-turnstile-response")))) {
    return {
      status: "error",
      errors: {},
      formError: "Spam check failed. Please reload the page and try again.",
    };
  }

  // 3. Re-validate everything with the shared schema — never trust the client.
  const parsed = contactMessageSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!(path in errors)) errors[path] = issue.message;
    }
    return { status: "error", errors, formError: "Please review the highlighted fields." };
  }
  const data = parsed.data;

  // 4. Create the message — BEFORE any email attempt.
  const payload = await getPayloadCached();
  let message: { id: number } | null = null;
  try {
    message = await payload.create({
      collection: "contact-messages",
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: contactSubjectLabel(data.subject),
        message: data.message,
        status: "new" as const,
      },
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: lead persistence failure must be loud.
    console.error("[contact] failed to create contact message:", error);
    return { status: "error", errors: {}, formError: FORM_ERROR };
  }

  // 5. Emails — sender confirmation + internal notification. Never throws.
  const rows = buildSummaryRows(data);
  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";

  await sendEmail({
    to: data.email,
    subject: `We received your message — ${contactSubjectLabel(data.subject)}`,
    react: <ContactConfirmationEmail name={data.name} subject={data.subject} rows={rows} />,
  });

  const internalRecipient =
    process.env.LEADS_NOTIFICATION_EMAIL ?? process.env.PUBLIC_CONTACT_EMAIL;
  if (internalRecipient) {
    await sendEmail({
      to: internalRecipient,
      subject: `New contact message — ${contactSubjectLabel(data.subject)} from ${data.name}`,
      react: (
        <ContactNotificationEmail
          name={data.name}
          email={data.email}
          phone={data.phone}
          subject={data.subject}
          rows={rows}
          adminUrl={`${baseUrl}/admin/collections/contact-messages/${message.id}`}
        />
      ),
    });
  }

  redirect("/contact?sent=1");
}
