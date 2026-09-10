/**
 * Pure helpers for the dealer application pipeline — kept free of
 * Payload/Next imports so they run in plain Node, unit tests, and smoke checks.
 */

export const TRADE_ATTACHMENT_RULES = {
  maxFiles: 5,
  maxBytesPerFile: 10 * 1024 * 1024, // 10 MB each
  accept: "image/png,image/jpeg,image/webp,image/avif,application/pdf",
} as const;

export const TRADE_STEPS = 3;

export const TRADE_REFERENCE_PREFIX = "DA";

/** `count` = number of applications already referencing this year → next sequence. */
export function dealerReferenceFromCount(year: number, count: number): string {
  return `${TRADE_REFERENCE_PREFIX}-${year}-${String(count + 1).padStart(4, "0")}`;
}

/** Server-side mirror of the client-side attachment validation. */
export function isAcceptedTradeAttachment(file: { type: string; size: number }): boolean {
  const allowed =
    file.type === "application/pdf" ||
    file.type === "image/png" ||
    file.type === "image/jpeg" ||
    file.type === "image/webp" ||
    file.type === "image/avif";
  return allowed && file.size > 0 && file.size <= TRADE_ATTACHMENT_RULES.maxBytesPerFile;
}
