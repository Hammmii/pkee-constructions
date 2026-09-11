"use server";

import { redirect } from "next/navigation";
import { consultationReferenceFromCount } from "@/lib/consultation";
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

/**
 * The consultation booking pipeline. Order of operations: honeypot →
 * Turnstile → zod re-validation → reference sequence → Consultations doc
 * (status "new") → redirect. Leads are handed off via the confirmation
 * page's WhatsApp deep link — no email step.
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

  // 5. Create the booking — persistence is the whole pipeline.
  try {
    await payload.create({
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

  const firstName = encodeURIComponent(data.firstName);
  redirect(`/consultation/confirmation?ref=${reference}&name=${firstName}`);
}
