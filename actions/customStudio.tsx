"use server";

import { redirect } from "next/navigation";
import { CustomStudioConfirmationEmail } from "@/emails/CustomStudioConfirmation";
import { CustomStudioNotificationEmail } from "@/emails/CustomStudioNotification";
import {
  buildCustomStudioMessage,
  CUSTOM_STUDIO_ATTACHMENT_RULES,
  isAcceptedCustomStudioAttachment,
} from "@/lib/customStudio";
import { sendEmail } from "@/lib/emails";
import { getPayloadCached } from "@/lib/payload";
import {
  type CustomStudioRequestInput,
  customStudioRequestSchema,
} from "@/lib/validators/customStudio";

export type CustomStudioActionState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; errors: Record<string, string>; formError?: string };

const FORM_ERROR = "Something went wrong saving your request. Please try again.";

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
    baseMaterial: getString(formData, "baseMaterial"),
    finish: getString(formData, "finish"),
    width: getString(formData, "width"),
    height: getString(formData, "height"),
    quantity: getString(formData, "quantity"),
    description: getString(formData, "description"),
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    attachments: formData
      .getAll("attachments")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0),
    website: getString(formData, "website"), // honeypot — must stay empty
    turnstileToken: getString(formData, "cf-turnstile-response"),
  };
}

function formatDimension(value: number | undefined): string | undefined {
  return value != null ? String(value) : undefined;
}

/**
 * The Custom Studio request pipeline. Order of operations: honeypot →
 * Turnstile → zod re-validation → reference uploads to media → Consultations
 * doc (type "phone" — staff call back; the collection has no custom-request
 * fields, so the full brief is composed into `productInterest`) → only then
 * emails. Email failure never blocks or rolls back the request.
 */
export async function submitCustomStudioRequest(
  _prevState: CustomStudioActionState,
  formData: FormData,
): Promise<CustomStudioActionState> {
  // 1. Honeypot — pretend success so bots get no signal, but store nothing.
  if (getString(formData, "website")) {
    redirect("/custom-studio/confirmation");
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
  const parsed = customStudioRequestSchema.safeParse(parseFormData(formData));
  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      if (!(path in errors)) errors[path] = issue.message;
    }
    return { status: "error", errors, formError: "Please review the highlighted fields." };
  }
  const data: CustomStudioRequestInput = parsed.data;

  const payload = await getPayloadCached();

  // 4. Reference uploads → media collection (validated again server-side).
  const files = data.attachments.slice(0, CUSTOM_STUDIO_ATTACHMENT_RULES.maxFiles);
  const uploaded: Array<{ name: string; mediaId: number | null }> = [];
  for (const file of files) {
    if (!isAcceptedCustomStudioAttachment(file)) continue;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const media = await payload.create({
        collection: "media",
        data: { alt: `Custom Studio reference — ${data.firstName} ${data.lastName}` },
        file: {
          data: buffer,
          name: file.name || "attachment",
          mimetype: file.type || "application/octet-stream",
          size: file.size,
        },
      });
      uploaded.push({ name: file.name || "attachment", mediaId: media.id });
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: upload failure must be logged, not thrown.
      console.error(`[custom-studio] media upload failed for ${file.name}:`, error);
    }
  }

  // 5. Create the Consultations record — BEFORE any email attempt. The
  //    collection's closest fit for a custom request: type "phone" (the team
  //    calls back), date/time required fields satisfied, full brief in
  //    productInterest.
  const message = buildCustomStudioMessage({
    baseMaterial: data.baseMaterial,
    finish: data.finish,
    width: formatDimension(data.width),
    height: formatDimension(data.height),
    quantity: data.quantity,
    description: data.description,
    attachments: uploaded,
  });

  let consultation: { id: number } | null = null;
  try {
    consultation = await payload.create({
      collection: "consultations",
      data: {
        type: "phone",
        source: "website-custom-studio",
        date: new Date().toISOString(),
        time: "Callback — Custom Studio",
        productInterest: message,
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
    console.error("[custom-studio] failed to create consultations record:", error);
    return { status: "error", errors: {}, formError: FORM_ERROR };
  }

  // 6. Emails — uploader confirmation + internal notification. Never throws.
  const rows = [
    { label: "Base material", value: data.baseMaterial },
    { label: "Finish", value: data.finish },
    ...(data.width != null || data.height != null
      ? [
          {
            label: "Dimensions",
            value: [formatDimension(data.width), formatDimension(data.height)]
              .filter(Boolean)
              .join(" × "),
          },
        ]
      : []),
    ...(data.quantity ? [{ label: "Quantity / area", value: data.quantity }] : []),
    { label: "Reference files", value: String(uploaded.length) },
  ];

  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";

  await sendEmail({
    to: data.email,
    subject: "We received your Custom Studio request",
    react: (
      <CustomStudioConfirmationEmail name={`${data.firstName} ${data.lastName}`} rows={rows} />
    ),
  });

  const internalRecipient =
    process.env.LEADS_NOTIFICATION_EMAIL ?? process.env.PUBLIC_CONTACT_EMAIL;
  if (internalRecipient) {
    await sendEmail({
      to: internalRecipient,
      subject: `New Custom Studio request — ${data.baseMaterial} for ${data.firstName} ${data.lastName}`,
      react: (
        <CustomStudioNotificationEmail
          name={`${data.firstName} ${data.lastName}`}
          email={data.email}
          phone={data.phone}
          brief={message}
          attachmentCount={uploaded.length}
          adminUrl={`${baseUrl}/admin/collections/consultations/${consultation.id}`}
        />
      ),
    });
  }

  const firstName = encodeURIComponent(data.firstName);
  redirect(`/custom-studio/confirmation?name=${firstName}`);
}
