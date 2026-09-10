/**
 * Pure helpers for the Custom Studio request pipeline — kept free of
 * Payload/Next imports so they run in plain Node, unit tests, and smoke checks.
 * Mirrors the trade attachment contract (lib/trade.ts).
 */

export const CUSTOM_STUDIO_ATTACHMENT_RULES = {
  maxFiles: 5,
  maxBytesPerFile: 10 * 1024 * 1024, // 10 MB each
  accept: "image/png,image/jpeg,image/webp,image/avif,application/pdf",
} as const;

export const CUSTOM_STUDIO_STEPS = 5;

/**
 * Fallback base-material options for the wizard when the Products collection
 * yields no usable `material` values. The live list is built from published
 * Products first (see app/custom-studio/page.tsx).
 */
export const FALLBACK_BASE_MATERIALS = [
  "PVC Wall Panels",
  "WPC",
  "SPC",
  "Charcoal Panels",
  "Faux Stone",
  "Decor Sheets",
] as const;

/** Server-side mirror of the client-side attachment validation. */
export function isAcceptedCustomStudioAttachment(file: { type: string; size: number }): boolean {
  const allowed =
    file.type === "application/pdf" ||
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp" ||
    file.type === "image/avif";
  return allowed && file.size > 0 && file.size <= CUSTOM_STUDIO_ATTACHMENT_RULES.maxBytesPerFile;
}

export type CustomStudioMessageInput = {
  baseMaterial: string;
  finish: string;
  width?: string;
  height?: string;
  quantity?: string;
  description?: string;
  attachments: Array<{ name: string; mediaId: number | null }>;
};

/**
 * The Consultations collection has no dedicated custom-request fields, so the
 * full brief is composed into one human-readable body and stored in its
 * `productInterest` text field. Staff read this in the admin list view.
 */
export function buildCustomStudioMessage(input: CustomStudioMessageInput): string {
  const lines = [
    "Custom Studio request — uploaded design",
    `Base material: ${input.baseMaterial}`,
    `Finish: ${input.finish}`,
  ];
  if (input.width || input.height) {
    lines.push(`Dimensions: ${[input.width, input.height].filter(Boolean).join(" × ")}`);
  }
  if (input.quantity) lines.push(`Quantity / area: ${input.quantity}`);
  if (input.description) {
    lines.push("", "Design brief:", input.description);
  }
  if (input.attachments.length > 0) {
    lines.push(
      "",
      `Reference files (${input.attachments.length}):`,
      ...input.attachments.map((file) =>
        file.mediaId != null ? `- ${file.name} (media #${file.mediaId})` : `- ${file.name}`,
      ),
    );
  }
  return lines.join("\n");
}
