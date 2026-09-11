"use server";

import { redirect } from "next/navigation";
import { getPayloadCached } from "@/lib/payload";
import {
  computeLeadScore,
  isAcceptedAttachment,
  QUOTE_ATTACHMENT_RULES,
  referenceFromCount,
} from "@/lib/quote";
import { quoteSchema } from "@/lib/validators/quote";
import type { Quote } from "@/payload-types";

export type QuoteActionState =
  | { status: "idle" }
  | { status: "success"; reference: string }
  | { status: "error"; errors: Record<string, string>; formError?: string };

const FORM_ERROR = "Something went wrong saving your request. Please try again.";

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

/** Raw FormData → schema input shape (dot-notation keys expanded). */
function parseFormData(formData: FormData) {
  return {
    customer: {
      name: getString(formData, "customer.name"),
      email: getString(formData, "customer.email"),
      phone: getString(formData, "customer.phone"),
      preferredContact: getString(formData, "customer.preferredContact"),
      city: getString(formData, "customer.city"),
      postalCode: getString(formData, "customer.postalCode"),
    },
    project: {
      projectType: getString(formData, "project.projectType"),
      buildType: getString(formData, "project.buildType"),
      roomType: getString(formData, "project.roomType"),
      timeline: getString(formData, "project.timeline"),
    },
    material: {
      categorySlug: getString(formData, "material.categorySlug"),
      productSlug: getString(formData, "material.productSlug"),
      finish: getString(formData, "material.finish"),
      color: getString(formData, "material.color"),
      quantity: getString(formData, "material.quantity"),
      unit: getString(formData, "material.unit"),
    },
    dimensions: {
      width: getString(formData, "dimensions.width"),
      height: getString(formData, "dimensions.height"),
      floorArea: getString(formData, "dimensions.floorArea"),
      wallCount: getString(formData, "dimensions.wallCount"),
      doorCount: getString(formData, "dimensions.doorCount"),
    },
    customization: {
      designRequirements: getString(formData, "customization.designRequirements"),
      lighting: getString(formData, "customization.lighting"),
      fabrication: getString(formData, "customization.fabrication"),
      installationRequired: getCheckbox(formData, "customization.installationRequired"),
      deliveryRequired: getCheckbox(formData, "customization.deliveryRequired"),
    },
    hp: getString(formData, "hp"),
  };
}

/**
 * The quote pipeline — the business core. Order of operations matters:
 * honeypot → Turnstile → zod re-validation → attachments to media →
 * reference → Quotes doc (status "new") → redirect. Leads are handed off
 * via the confirmation page's WhatsApp deep link, so there is no email
 * step and nothing after persistence can fail.
 */
export async function submitQuote(
  _prevState: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  // 1. Honeypot — pretend success so bots get no signal, but store nothing.
  if (getString(formData, "hp")) {
    redirect("/quote/confirmation");
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
  const parsed = quoteSchema.safeParse(parseFormData(formData));
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

  // 4. Sequence for PK-YYYY-NNNN (unique index on reference; retry on races).
  const { totalDocs } = await payload.find({
    collection: "quotes",
    where: { reference: { like: `PK-${year}-%` } },
    limit: 0,
  });
  let sequence = totalDocs;
  let reference = referenceFromCount(year, sequence);

  // 5. Resolve the product relationship from its slug.
  let productId: number | null = null;
  if (data.material.productSlug) {
    const found = await payload.find({
      collection: "products",
      where: { slug: { equals: data.material.productSlug } },
      limit: 1,
      depth: 1,
    });
    const product = found.docs[0];
    if (product) {
      productId = product.id;
    }
  }

  // 6. Attachments → media collection (validated again server-side).
  const files = formData
    .getAll("attachments")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)
    .slice(0, QUOTE_ATTACHMENT_RULES.maxFiles);
  const attachmentIds: number[] = [];
  for (const file of files) {
    if (!isAcceptedAttachment(file)) continue;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const media = await payload.create({
        collection: "media",
        data: { alt: `Quote attachment — ${reference}` },
        file: {
          data: buffer,
          name: file.name || "attachment",
          mimetype: file.type || "application/octet-stream",
          size: file.size,
        },
      });
      attachmentIds.push(media.id);
    } catch (error) {
      // biome-ignore lint/suspicious/noConsole: upload failure must be logged, not thrown.
      console.error(`[quote] media upload failed for ${file.name}:`, error);
    }
  }

  const leadScore = computeLeadScore({
    projectType: data.project.projectType ?? null,
    quantity: data.material.quantity ?? null,
    timeline: data.project.timeline ?? null,
    phone: data.customer.phone ?? null,
    dimensions: data.dimensions,
    attachmentCount: attachmentIds.length,
  });

  // 7. Create the lead — BEFORE any email attempt.
  const quoteData = {
    reference,
    customer: {
      name: data.customer.name,
      email: data.customer.email,
      phone: data.customer.phone,
      preferredContact: data.customer.preferredContact,
      city: data.customer.city,
      postalCode: data.customer.postalCode,
    },
    project: data.project,
    material: {
      product: productId ?? undefined,
      finish: data.material.finish,
      color: data.material.color,
      quantity: data.material.quantity,
      unit: data.material.unit,
    },
    dimensions: data.dimensions,
    customization: {
      designRequirements: data.customization.designRequirements,
      lighting: data.customization.lighting,
      fabrication: data.customization.fabrication,
      installationRequired: data.customization.installationRequired ?? false,
      deliveryRequired: data.customization.deliveryRequired ?? false,
    },
    attachments: attachmentIds,
    status: "new" as const,
    leadScore,
    source: "website",
    landingPage: getString(formData, "landingPage"),
  };

  let quote: Quote | null = null;
  for (let attempt = 0; attempt < 3 && !quote; attempt += 1) {
    try {
      quote = await payload.create({ collection: "quotes", data: quoteData });
    } catch (error) {
      // Unique-violation race → bump the sequence and try the next number.
      if (attempt < 2 && error instanceof Error && /unique|duplicate/i.test(error.message)) {
        sequence += 1;
        reference = referenceFromCount(year, sequence);
        quoteData.reference = reference;
      } else {
        // biome-ignore lint/suspicious/noConsole: lead persistence failure must be loud.
        console.error("[quote] failed to create quote:", error);
        return { status: "error", errors: {}, formError: FORM_ERROR };
      }
    }
  }

  if (!quote) {
    return { status: "error", errors: {}, formError: FORM_ERROR };
  }

  redirect(`/quote/confirmation?ref=${reference}`);
}
