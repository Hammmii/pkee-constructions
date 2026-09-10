"use server";

import { redirect } from "next/navigation";
import { SamplesConfirmationEmail, type SamplesSummaryRow } from "@/emails/SamplesConfirmation";
import { SamplesNotificationEmail } from "@/emails/SamplesNotification";
import { sendEmail } from "@/lib/emails";
import { getPayloadCached } from "@/lib/payload";
import { sampleReferenceFromCount } from "@/lib/samples";
import { samplesSchema } from "@/lib/validators/samples";

export type SamplesActionState =
  | { status: "idle" }
  | { status: "success"; reference: string }
  | { status: "error"; errors: Record<string, string>; formError?: string };

const FORM_ERROR = "Something went wrong saving your request. Please try again.";

function getString(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function parseFormData(formData: FormData) {
  return {
    productId: getString(formData, "productId"),
    color: getString(formData, "color"),
    finish: getString(formData, "finish"),
    quantity: getString(formData, "quantity"),
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    phone: getString(formData, "phone"),
    address: getString(formData, "address"),
    city: getString(formData, "city"),
    province: getString(formData, "province"),
    postalCode: getString(formData, "postalCode"),
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
 * The sample-request pipeline. Order of operations: honeypot → Turnstile →
 * zod re-validation → reference sequence → SampleRequests doc (status "new")
 * → only then emails. Email failure never blocks or rolls back the request.
 *
 * The SR-YYYY-NNNN sequence is derived from the year's document count and
 * carried to the confirmation page (and both emails) as a display token.
 */
export async function submitSampleRequest(
  _prevState: SamplesActionState,
  formData: FormData,
): Promise<SamplesActionState> {
  // 1. Honeypot — pretend success so bots get no signal, but store nothing.
  if (getString(formData, "website")) {
    redirect("/samples/confirmation");
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
  const parsed = samplesSchema.safeParse(parseFormData(formData));
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

  // 4. Sequence for SR-YYYY-NNNN from this year's request count.
  const { totalDocs } = await payload.find({
    collection: "sample-requests",
    where: {
      and: [
        { createdAt: { greater_than: new Date(`${year}-01-01`).toISOString() } },
        { createdAt: { less_than: new Date(`${year + 1}-01-01`).toISOString() } },
      ],
    },
    limit: 0,
  });
  const reference = sampleReferenceFromCount(year, totalDocs);

  // 5. Resolve the product relationship from its id.
  const productId = Number(data.productId);
  if (!Number.isInteger(productId) || productId <= 0) {
    return {
      status: "error",
      errors: { productId: "Select a product" },
      formError: "Please review the highlighted fields.",
    };
  }
  const { docs: products } = await payload.find({
    collection: "products",
    where: { and: [{ id: { equals: productId } }, { _status: { equals: "published" } }] },
    limit: 1,
    depth: 0,
  });
  const product = products[0];
  if (!product) {
    return {
      status: "error",
      errors: { productId: "Select a product" },
      formError: "Please review the highlighted fields.",
    };
  }

  const fullAddress = [data.address, data.city, data.province, data.postalCode]
    .filter(Boolean)
    .join(", ");

  // 6. Create the request — BEFORE any email attempt.
  let request: { id: number } | null = null;
  try {
    request = await payload.create({
      collection: "sample-requests",
      data: {
        product: product.id,
        color: data.color,
        finish: data.finish,
        quantity: data.quantity,
        contact: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          phone: data.phone,
          address: fullAddress,
        },
        status: "new",
      },
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: lead persistence failure must be loud.
    console.error("[samples] failed to create sample request:", error);
    return { status: "error", errors: {}, formError: FORM_ERROR };
  }

  // 7. Emails — customer confirmation + internal notification. Never throws.
  const rows: SamplesSummaryRow[] = [
    { label: "Product", value: product.name },
    { label: "Colour", value: data.color },
    { label: "Finish", value: data.finish },
    { label: "Quantity", value: String(data.quantity) },
  ];
  const baseUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL ?? "http://localhost:3000";
  const name = `${data.firstName} ${data.lastName}`;

  await sendEmail({
    to: data.email,
    subject: `We received your sample request — ${reference}`,
    react: <SamplesConfirmationEmail reference={reference} name={name} rows={rows} />,
  });

  const internalRecipient =
    process.env.LEADS_NOTIFICATION_EMAIL ?? process.env.PUBLIC_CONTACT_EMAIL;
  if (internalRecipient) {
    await sendEmail({
      to: internalRecipient,
      subject: `New sample request ${reference} — ${product.name}`,
      react: (
        <SamplesNotificationEmail
          reference={reference}
          name={name}
          email={data.email}
          phone={data.phone}
          rows={rows}
          adminUrl={`${baseUrl}/admin/collections/sample-requests/${request.id}`}
        />
      ),
    });
  }

  const firstName = encodeURIComponent(data.firstName);
  redirect(`/samples/confirmation?ref=${reference}&name=${firstName}`);
}
