/**
 * Pure helpers for the custom Payload admin (dashboard, activity feed, CSV
 * export). Free of Payload runtime / React imports so they stay trivially
 * unit-testable; the only Payload import is the `Where` type.
 */

import type { Where } from "payload";

/** Mirrors MANAGER_ROLES in collections/access.ts (not exported from there). */
export const MANAGER_ROLES = ["super-admin", "sales-manager"] as const;

export type LeadCollectionSlug =
  | "quotes"
  | "dealer-applications"
  | "contact-messages"
  | "consultations"
  | "sample-requests";

export const LEAD_COLLECTIONS: readonly { slug: LeadCollectionSlug; title: string }[] = [
  { slug: "quotes", title: "Quotes" },
  { slug: "dealer-applications", title: "Dealer applications" },
  { slug: "contact-messages", title: "Contact messages" },
  { slug: "consultations", title: "Consultations" },
  { slug: "sample-requests", title: "Sample requests" },
] as const;

export const isLeadCollectionSlug = (slug: string): slug is LeadCollectionSlug =>
  LEAD_COLLECTIONS.some((collection) => collection.slug === slug);

export const isManagerRole = (roles: readonly string[]): boolean =>
  MANAGER_ROLES.some((role) => roles.includes(role));

type Doc = Record<string, unknown>;

const str = (value: unknown): string => (typeof value === "string" ? value : "");

const productName = (value: unknown): string | null => {
  if (!value || typeof value !== "object") return null;
  const title = (value as Doc).title;
  return typeof title === "string" && title !== "" ? title : null;
};

/** Display title for a lead doc — shared by dashboard + activity feed. */
export function leadTitle(slug: LeadCollectionSlug, doc: Doc): string {
  switch (slug) {
    case "quotes":
      return str(doc.reference) || "Quote";
    case "dealer-applications":
      return str(doc.companyName) || "Application";
    case "contact-messages":
      return `${str(doc.name) || "Message"} — ${str(doc.subject)}`.replace(/\s—\s$/, "");
    case "consultations": {
      const contact = (doc.contact ?? {}) as Doc;
      return `${str(contact.name) || "Consultation"} (${str(doc.type)})`.replace(/\s\(\)$/, "");
    }
    case "sample-requests":
      return `Sample — ${str(doc.color) || "color TBD"}`;
  }
}

/**
 * Secondary context line derivable from existing fields only
 * (source page / product name). Returns null when nothing is derivable.
 * Pass docs at depth ≥ 1 for the product relationship to resolve.
 */
export function leadSubtitle(slug: LeadCollectionSlug, doc: Doc): string | null {
  switch (slug) {
    case "quotes": {
      const material = (doc.material ?? {}) as Doc;
      const product = productName(material.product);
      const parts = [product, str(doc.source) || str(doc.landingPage)].filter(
        (part): part is string => Boolean(part),
      );
      return parts.length > 0 ? parts.join(" · ") : null;
    }
    case "consultations":
      return str(doc.productInterest) || null;
    case "sample-requests":
      return productName(doc.product);
    default:
      return null;
  }
}

/** "2h ago"-style relative stamp. Falls back to the raw string when unparseable. */
export function relativeTime(iso: string | Date, now: Date = new Date()): string {
  const then = typeof iso === "string" ? Date.parse(iso) : iso.getTime();
  if (Number.isNaN(then)) return String(iso);
  const seconds = Math.max(0, Math.floor((now.getTime() - then) / 1000));
  if (seconds < 45) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  return then.toLocaleString?.() ?? String(iso);
}

/** RFC 4180 cell escaping. Handles line breaks, quotes, commas; null → "". */
export function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "object"
        ? JSON.stringify(value)
        : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

export type ActivityFilter = {
  from?: string;
  status?: string;
  to?: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Build the Payload `where` for activity-feed / export queries.
 * `from`/`to` accept bare dates (inclusive whole-day) or full ISO timestamps.
 * Returns undefined when no constraint applies.
 */
export function buildActivityQuery(filter: ActivityFilter): Where | undefined {
  const and: Where[] = [];
  if (filter.status) and.push({ status: { equals: filter.status } });
  if (filter.from) {
    const from = DATE_RE.test(filter.from) ? `${filter.from}T00:00:00.000Z` : filter.from;
    if (!Number.isNaN(Date.parse(from))) and.push({ createdAt: { greater_than_equal: from } });
  }
  if (filter.to) {
    const to = DATE_RE.test(filter.to) ? `${filter.to}T23:59:59.999Z` : filter.to;
    if (!Number.isNaN(Date.parse(to))) and.push({ createdAt: { less_than_equal: to } });
  }
  if (and.length === 0) return undefined;
  return and.length === 1 ? and[0] : { and };
}

export type SlaBucket = "ok" | "amber" | "red";

export const SLA_AMBER_HOURS = 24;
export const SLA_RED_HOURS = 72;

/** Staleness bucket for a "new" lead given its age in hours. */
export function slaBucket(ageHours: number): SlaBucket {
  if (ageHours >= SLA_RED_HOURS) return "red";
  if (ageHours >= SLA_AMBER_HOURS) return "amber";
  return "ok";
}

export type SlaCounts = { amber: number; ok: number; red: number };

/** Bucket docs (ISO `createdAt` strings) by staleness at `now`. */
export function slaCounts(dates: string[], now: Date = new Date()): SlaCounts {
  const counts: SlaCounts = { ok: 0, amber: 0, red: 0 };
  for (const iso of dates) {
    const then = Date.parse(iso);
    if (Number.isNaN(then)) continue;
    counts[slaBucket((now.getTime() - then) / 3_600_000)] += 1;
  }
  return counts;
}
