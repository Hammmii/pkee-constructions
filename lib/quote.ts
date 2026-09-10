/**
 * Pure helpers for the quote pipeline — kept free of Payload/Next imports so
 * they run in plain Node, unit tests, and `node -e` smoke checks.
 */

export const QUOTE_ATTACHMENT_RULES = {
  maxFiles: 5,
  maxBytesPerFile: 10 * 1024 * 1024, // 10 MB each
  /** Mirrors the `mimeTypes` of collections/Media.ts. */
  accept: "image/*,application/pdf",
} as const;

export const QUOTE_STEPS = 7;

export const UNIT_LABELS: Record<string, string> = {
  sqft: "sq ft",
  sqm: "sq m",
  pieces: "pieces",
};

export const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  "1-3-months": "1–3 months",
  "3-6-months": "3–6 months",
  "6-plus-months": "6+ months",
  researching: "Just researching",
};

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

export const BUILD_TYPE_LABELS: Record<string, string> = {
  "new-build": "New build",
  renovation: "Renovation",
};

export type LeadScoreInput = {
  projectType?: string | null;
  quantity?: number | null;
  timeline?: string | null;
  phone?: string | null;
  dimensions?: {
    width?: number | null;
    height?: number | null;
    floorArea?: number | null;
    wallCount?: number | null;
    doorCount?: number | null;
  } | null;
  attachmentCount?: number;
};

/**
 * Intake scoring — commercial + large quantity + timeline + dimensions +
 * attachments + reachable by phone = hot lead. Clamped to 0–100.
 */
export function computeLeadScore(lead: LeadScoreInput): number {
  let score = 0;

  if (lead.projectType === "commercial") score += 20;
  if (typeof lead.quantity === "number" && lead.quantity >= 500) score += 20;
  if (lead.timeline) score += 10;

  const dimensions = lead.dimensions;
  if (
    dimensions &&
    Object.values(dimensions).some((value) => typeof value === "number" && Number.isFinite(value))
  ) {
    score += 15;
  }

  if ((lead.attachmentCount ?? 0) > 0) score += 15;
  if (lead.phone && lead.phone.trim() !== "") score += 10;

  return Math.min(100, Math.max(0, score));
}

/** `count` = number of quotes already referencing this year → next sequence. */
export function referenceFromCount(year: number, count: number): string {
  return `PK-${year}-${String(count + 1).padStart(4, "0")}`;
}

/** Server-side mirror of the client-side attachment validation. */
export function isAcceptedAttachment(file: { type: string; size: number }): boolean {
  const isImage = file.type.startsWith("image/");
  const isPdf = file.type === "application/pdf";
  return (isImage || isPdf) && file.size > 0 && file.size <= QUOTE_ATTACHMENT_RULES.maxBytesPerFile;
}
