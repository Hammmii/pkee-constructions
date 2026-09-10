/**
 * Pure helpers for the sample-request pipeline — kept free of Payload/Next
 * imports so they run in plain Node, unit tests, and `node -e` smoke checks.
 */

export const SAMPLES_STEPS = 3;

export const SAMPLE_MAX_QUANTITY = 5;

export const SAMPLE_COLOR_OPTIONS = [
  { label: "Warm Oak", value: "Warm Oak" },
  { label: "Smoked Walnut", value: "Smoked Walnut" },
  { label: "Charred Cedar", value: "Charred Cedar" },
  { label: "Bone White", value: "Bone White" },
  { label: "Concrete Grey", value: "Concrete Grey" },
  { label: "Other / advise me", value: "Other" },
] as const;

export const SAMPLE_FINISH_OPTIONS = [
  { label: "Matte", value: "Matte" },
  { label: "Satin", value: "Satin" },
  { label: "Gloss", value: "Gloss" },
  { label: "Textured", value: "Textured" },
  { label: "Other / advise me", value: "Other" },
] as const;

/**
 * Sequence for SR-YYYY-NNNN, derived from this year's document count
 * (mirrors the M6 quote/trade pattern). Zero-padded, rolls yearly.
 */
export function sampleReferenceFromCount(year: number, count: number): string {
  return `SR-${year}-${String(count + 1).padStart(4, "0")}`;
}

export function isSampleReference(value: string): boolean {
  return /^SR-\d{4}-\d{4}$/.test(value);
}
