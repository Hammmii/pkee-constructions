/**
 * WhatsApp lead-handoff helpers. The client delivers leads via direct
 * WhatsApp chat on the business number (lib/site.ts `site.whatsapp`), so
 * every intake form's confirmation page offers a "Send via WhatsApp" CTA
 * that deep-links into a chat with the lead summary pre-filled.
 */

/** Strip everything that isn't a digit — accepts +1 (431) 788-3188 etc. */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Build a wa.me deep link. The phone must yield at least one digit after
 * stripping (throws otherwise); the text is URL-encoded via the standard
 * encoder, which handles line breaks (%0A) and reserved characters.
 */
export function buildWhatsAppLink({
  phone,
  text,
}: {
  phone: string;
  text: string;
}): string {
  const digits = digitsOnly(phone);
  if (digits.length === 0) {
    throw new Error("buildWhatsAppLink: phone must contain at least one digit");
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export type LeadWhatsAppMessageInput = {
  /** Lead reference (PK-/DA-/SR-/CT-…). Rendered as "ref X". */
  reference: string | null;
  /** Human-readable form name, e.g. "quote request". */
  formType: string;
  /** Customer first name — never more than first name (privacy). */
  firstName: string | null;
  /** Key "Label: value" lines, already filtered of empties. */
  summaryLines: string[];
};

/**
 * Compose the plain-text message opened in the customer's WhatsApp chat
 * with the business. Emoji-free, line breaks only, ready to send as-is.
 */
export function buildLeadWhatsAppMessage({
  reference,
  formType,
  firstName,
  summaryLines,
}: LeadWhatsAppMessageInput): string {
  const refPart = reference ? ` (ref ${reference})` : "";
  const lines = [
    `Hi PKEE Constructions! I just submitted a ${formType} request${refPart}. Here are my details:`,
    ...(summaryLines.length > 0 ? ["", ...summaryLines] : []),
  ];
  return lines.join("\n");
}

/** Convenience: lead message + link for the business WhatsApp number. */
export function buildLeadWhatsAppLink(
  input: LeadWhatsAppMessageInput & { phone: string },
): string {
  const { phone, ...message } = input;
  return buildWhatsAppLink({ phone, text: buildLeadWhatsAppMessage(message) });
}
