/**
 * Pure helpers for the /contact pipeline — kept free of Payload/Next imports
 * so they run in plain Node, unit tests, and smoke checks. Address, hours,
 * phone, and email all come from lib/site.ts (single source of truth).
 */

import { site } from "./site";

export const CONTACT_SUBJECTS = [
  "general",
  "quote-follow-up",
  "showroom-visit",
  "trade",
  "other",
] as const;

export type ContactSubject = (typeof CONTACT_SUBJECTS)[number];

export const CONTACT_SUBJECT_LABELS: Record<ContactSubject, string> = {
  general: "General question",
  "quote-follow-up": "Following up on a quote",
  "showroom-visit": "Planning a showroom visit",
  trade: "Trade & dealer program",
  other: "Something else",
};

/** Single-line "360 Keewatin St, Winnipeg, MB" used by maps, JSON-LD, and UI. */
export function showroomAddressLine(): string {
  const { street, city, province } = site.address;
  return `${street}, ${city}, ${province}`;
}

/** Google Maps embed URL for the showroom (lazy-loaded iframe src). */
export function mapEmbedUrl(): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(showroomAddressLine())}&output=embed`;
}

/** Universal-crossing Google Maps directions link to the showroom. */
export function directionsUrl(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(showroomAddressLine())}`;
}

/** Phone href from the site constants, e.g. "tel:+12045550136". */
export function phoneHref(): string {
  return site.phone.href;
}

/** Mailto href for the public contact address. */
export function mailtoHref(): string {
  return `mailto:${site.email}`;
}

/** Display label for a subject value — falls back to the raw value. */
export function contactSubjectLabel(value: string | null | undefined): string {
  if (!value) return "General question";
  return (CONTACT_SUBJECT_LABELS as Record<string, string>)[value] ?? value;
}
