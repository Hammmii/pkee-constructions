"use server";

import { redirect } from "next/navigation";
import {
  ConsultationConfirmationEmail,
  type ConsultationSummaryRow,
} from "@/emails/ConsultationConfirmation";
import { ConsultationNotificationEmail } from "@/emails/ConsultationNotification";
import {
  CONSULTATION_TYPE_LABELS,
  consultationReferenceFromCount,
  PROJECT_TYPE_LABELS,
} from "@/lib/consultation";
import { sendEmail } from "@/lib/emails";
import { getPayloadCached } from "@/lib/payload";
import { consultationSchema } from "@/lib/validators/consultation";

export type ConsultationActionState =
  | { status: "idle" }
  | { status: "success"; reference: string }
  | { status: "error"; errors: Record<string, string>; formError?: string };

const FORM_ERROR = "Something went wrong booking your consultation. Please try again.";

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function parseFormData(formData: FormData) {
  return {
    type: getString(formData, "type"),
    projectType: getString(formData, "projectType"),
    productInterest: getString(formData, "productInterest"),
    date: getString(formData, "date"),
    time: getString(formData, "time"),
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    notes: getString(formData, "notes"),
    honeypot: getString(formData, "website"), // honeypot — must stay empty
  };
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

function formatTime(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  if (typeof hours !== "number" || Number.isNaN(hours)) return time;
  const period = hours >= 12 ? "PM" : "AM";
  const display = hours % 12 === 0 ? 12 : hours % 12;
  return `${display}:${String(minutes ?? 0).padStart(2, "0")} ${period}`;
}

/**
 * The consultation booking pipeline. Order of operations: honeypot →
 * Turnstile → zod re-validation → reference sequence → Consultations doc
 * (status "new") → only then emails. Email failure never blocks or rolls
 * back the booking.
 */
export async function submitConsultation(
  _prevState: ConsultationActionState,
  formData: FormData,
): Promise<ConsultationActionState> {
  // 1. Honeypot — pretend success so bots get no signal, but store nothing.
  if (getString(formData, "website")) {
    redirect("/consultation/confirmation");
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
  const parsed = consultationSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!(path in errors)) errors[path] = issue.message;
    }
    return { status: "error", errors, formError: "Please review the highlighted fields." };
  }
  const data = parsed.data;

  const payload = await getPayloadCached();
  const year = new Date().getFullYear();

  // 4. Sequence for CT-YYYY-NNNN from this year's booking count.
  const { totalDocs } = await payload.find({
    collection: "consultations",
    where: {
      and: [
        { createdAt: { greater_than: new Date(`${year}-01-01`).toISOString() } },
        { createdAt: { less_than: new Date(`${year + 1}-01-01`).toISOString() } },
      ],
    },
    limit: 0,
  });
  const reference = consultationReferenceFromCount(year, totalDocs);

  // 5. Create the booking — BEFORE any email attempt.
  let booking: { id: number } | null = null;
  try {
    booking = await payload.create({
      collection: "consultations",
      data: {
        type: data.type,
        date: new Date(`${data.date}T12:00:00`).toISOString(),
        time: data.time,
        projectType: data.projectType,
        productInterest: data.productInterest ?? undefined,
        contact: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
        },
        status: "new",
      },
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: lead persistence failure must be loud.
    console.error("[consultation] failed to create consultation:", error);
    return { status: "error", errors: {}, formError: FORM_ERROR };
  }

  // 6. Emails — customer confirmation + internal notification. Never throws.
  const dateLabel = new Date(`${data.date}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const rows: ConsultationSummaryRow[] = [
    { label: "Type", value: CONSULTATION_TYPE_LABELS[data.type] ?? data.type },
    { label: "When", value: `${dateLabel} · ${formatTime(data.time)}` },
    { label: "Project", value: PROJECT_TYPE_LABELS[data.projectType] ?? data.projectType },
  ];
  if (data.productInterest) rows.push({ label: "Interested in", value: data.productInterest });

  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  const name = `${data.firstName} ${data.lastName}`;

  await sendEmail({
    to: data.email,
    subject: `Your consultation request — ${reference}`,
    react: <ConsultationConfirmationEmail reference={reference} name={name} rows={rows} />,
  });

  const internalRecipient =
    process.env.LEADS_NOTIFICATION_EMAIL ?? process.env.PUBLIC_CONTACT_EMAIL;
  if (internalRecipient) {
    await sendEmail({
      to: internalRecipient,
      subject: `New consultation request ${reference} — ${name}`,
      react: (
        <ConsultationNotificationEmail
          reference={reference}
          name={name}
          email={data.email}
          phone={data.phone}
          rows={rows}
          notes={data.notes ?? null}
          adminUrl={`${baseUrl}/admin/collections/consultations/${booking.id}`}
        />
      ),
    });
  }

  const firstName = encodeURIComponent(data.firstName);
  redirect(`/consultation/confirmation?ref=${reference}&name=${firstName}`);
}
