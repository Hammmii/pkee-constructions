"use server";

import { redirect } from "next/navigation";
import type { DataFromCollectionSlug } from "payload";
import { getPayloadCached } from "@/lib/payload";
import { isAcceptedTradeAttachment, TRADE_ATTACHMENT_RULES } from "@/lib/trade";
import { tradeApplicationSchema } from "@/lib/validators/trade";

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

/**
 * The dealer application pipeline. Order of operations: honeypot →
 * Turnstile → zod re-validation → attachments to media →
 * DealerApplications doc (status "new"; the collection's beforeChange hook
 * generates the unique DA-YYYY-NNNN reference) → redirect. Leads are handed
 * off via the confirmation page's WhatsApp deep link — no email step.
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

  // 4. Attachments → media collection (validated again server-side).
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
        data: { alt: `Dealer application attachment — ${data.companyName}` },
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

  // 5. Create the application — BEFORE any email attempt. The beforeChange
  // hook generates the unique reference; retry once on a unique race so the
  // hook re-sequences.
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

  // Reference is required by the generated type but always supplied by the
  // collection's beforeChange hook — never passed from the client.
  let application: { id: number; reference: string } | null = null;
  for (let attempt = 0; attempt < 2 && !application; attempt += 1) {
    try {
      application = await payload.create({
        collection: "dealer-applications",
        data: applicationData as unknown as DataFromCollectionSlug<"dealer-applications">,
      });
    } catch (error) {
      // Unique-violation race on the hook-generated reference → retry once so
      // the hook re-sequences; anything else is a real failure.
      if (attempt === 0 && error instanceof Error && /unique|duplicate/i.test(error.message)) {
        continue;
      }
      // biome-ignore lint/suspicious/noConsole: lead persistence failure must be loud.
      console.error("[trade] failed to create dealer application:", error);
      return { status: "error", errors: {}, formError: FORM_ERROR };
    }
  }

  if (!application) {
    return { status: "error", errors: {}, formError: FORM_ERROR };
  }
  const reference = application.reference;

  redirect(`/trade/confirmation?ref=${reference}`);
}
