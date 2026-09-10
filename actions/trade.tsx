"use server";

import { redirect } from "next/navigation";
import { TradeConfirmationEmail, type TradeSummaryRow } from "@/emails/TradeConfirmation";
import { TradeNotificationEmail } from "@/emails/TradeNotification";
import { sendEmail } from "@/lib/emails";
import { getPayloadCached } from "@/lib/payload";
import {
  dealerReferenceFromCount,
  isAcceptedTradeAttachment,
  TRADE_ATTACHMENT_RULES,
} from "@/lib/trade";
import {
  BUSINESS_TYPE_LABELS,
  type TradeApplicationInput,
  TURNOVER_LABELS,
  tradeApplicationSchema,
} from "@/lib/validators/trade";

export type TradeActionState =
  | { status: "idle" }
  | { status: "success"; reference: string }
  | { status: "error"; errors: Record<string, string>; formError?: string };

const FORM_ERROR = "Something went wrong saving your application. Please try again.";

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function getCheckbox(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
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
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    companyName: getString(formData, "companyName"),
    companyAddress: getString(formData, "companyAddress"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    city: getString(formData, "city"),
    province: getString(formData, "province"),
    postalCode: getString(formData, "postalCode"),
    gstNumber: getString(formData, "gstNumber"),
    businessType: getString(formData, "businessType"),
    yearsInBusiness: getString(formData, "yearsInBusiness"),
    annualTurnover: getString(formData, "annualTurnover"),
    otherBrands: getCheckbox(formData, "otherBrands"),
    otherBrandNames: getString(formData, "otherBrandNames"),
    moreInfo: getString(formData, "moreInfo"),
    website: getString(formData, "website"), // honeypot — must stay empty
  };
}

function labelFor(labels: Record<string, string>, value: string | null | undefined): string | null {
  return value ? (labels[value] ?? value) : null;
}

function buildSummaryRows(data: TradeApplicationInput, attachmentCount: number): TradeSummaryRow[] {
  const rows: TradeSummaryRow[] = [];
  const push = (label: string, value: string | null | undefined) => {
    if (value) rows.push({ label, value });
  };

  push("Company", data.companyName);
  push(
    "Contact",
    [data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : null, data.phone]
      .filter(Boolean)
      .join(" · ") || null,
  );
  push("Business type", labelFor(BUSINESS_TYPE_LABELS, data.businessType));
  if (data.yearsInBusiness != null) {
    push("Years in business", String(data.yearsInBusiness));
  }
  push("Annual turnover", labelFor(TURNOVER_LABELS, data.annualTurnover));
  if (data.otherBrands) push("Brands carried", data.otherBrandNames);
  push("Location", [data.city, data.province, data.postalCode].filter(Boolean).join(", ") || null);
  if (attachmentCount > 0) {
    push("Attachments", `${attachmentCount} file${attachmentCount === 1 ? "" : "s"}`);
  }

  return rows;
}

/**
 * The dealer application pipeline. Order of operations: honeypot →
 * Turnstile → zod re-validation → attachments to media → reference sequence
 * → DealerApplications doc (status "new") → only then emails. Email failure
 * never blocks or rolls back the application.
 *
 * The collection has no persisted reference column, so the DA-YYYY-NNNN
 * sequence is derived from the year's document count and carried to the
 * confirmation page (and both emails) as a display token.
 */
export async function submitTradeApplication(
  _prevState: TradeActionState,
  formData: FormData,
): Promise<TradeActionState> {
  // 1. Honeypot — pretend success so bots get no signal, but store nothing.
  if (getString(formData, "website")) {
    redirect("/trade/confirmation");
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
  const parsed = tradeApplicationSchema.safeParse(parseFormData(formData));
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

  // 4. Sequence for DA-YYYY-NNNN from this year's application count.
  const { totalDocs } = await payload.find({
    collection: "dealer-applications",
    where: {
      and: [
        { createdAt: { greater_than: new Date(`${year}-01-01`).toISOString() } },
        { createdAt: { less_than: new Date(`${year + 1}-01-01`).toISOString() } },
      ],
    },
    limit: 0,
  });
  const reference = dealerReferenceFromCount(year, totalDocs);

  // 5. Attachments → media collection (validated again server-side).
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, TRADE_ATTACHMENT_RULES.maxFiles);
  const documentIds: number[] = [];
  for (const file of files) {
    if (!isAcceptedTradeAttachment(file)) continue;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const media = await payload.create({
        collection: "media",
        data: { alt: `Dealer application attachment — ${reference}` },
        file: {
          data: buffer,
          name: file.name || "attachment",
          mimetype: file.type || "application/octet-stream",
          size: file.size,
        },
      });
      documentIds.push(media.id);
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: upload failure must be logged, not thrown.
      console.error(`[trade] media upload failed for ${file.name}:`, error);
    }
  }

  // 6. Create the application — BEFORE any email attempt.
  const applicationData = {
    firstName: data.firstName,
    lastName: data.lastName,
    companyName: data.companyName,
    companyAddress: data.companyAddress,
    email: data.email,
    phone: data.phone,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    gstNumber: data.gstNumber,
    businessType: data.businessType,
    yearsInBusiness: data.yearsInBusiness,
    annualTurnover: data.annualTurnover,
    otherBrands: data.otherBrands,
    otherBrandNames: data.otherBrands ? data.otherBrandNames : undefined,
    moreInfo: data.moreInfo,
    documents: documentIds,
    status: "new" as const,
  };

  let application: { id: number } | null = null;
  try {
    application = await payload.create({
      collection: "dealer-applications",
      data: applicationData,
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: lead persistence failure must be loud.
    console.error("[trade] failed to create dealer application:", error);
    return { status: "error", errors: {}, formError: FORM_ERROR };
  }

  // 7. Emails — applicant confirmation + internal notification. Never throws.
  const rows = buildSummaryRows(data, documentIds.length);
  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";

  await sendEmail({
    to: data.email,
    subject: `We received your dealer application — ${reference}`,
    react: (
      <TradeConfirmationEmail
        reference={reference}
        name={`${data.firstName} ${data.lastName}`}
        rows={rows}
      />
    ),
  });

  const internalRecipient =
    process.env.LEADS_NOTIFICATION_EMAIL ?? process.env.PUBLIC_CONTACT_EMAIL;
  if (internalRecipient) {
    await sendEmail({
      to: internalRecipient,
      subject: `New dealer application ${reference} — ${data.companyName}`,
      react: (
        <TradeNotificationEmail
          reference={reference}
          name={`${data.firstName} ${data.lastName}`}
          company={data.companyName}
          email={data.email}
          phone={data.phone}
          rows={rows}
          adminUrl={`${baseUrl}/admin/collections/dealer-applications/${application.id}`}
        />
      ),
    });
  }

  const firstName = encodeURIComponent(data.firstName);
  redirect(`/trade/confirmation?ref=${reference}&name=${firstName}`);
}
