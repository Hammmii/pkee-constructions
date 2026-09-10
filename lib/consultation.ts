import { site } from "@/lib/site";

/**
 * Pure helpers for the consultation booking pipeline.
 */

export const CONSULTATION_STEPS = 3;

export const CONSULTATION_TYPE_LABELS: Record<string, string> = {
  phone: "Phone Call",
  video: "Video Call",
  showroom: "Showroom Visit",
  "site-visit": "Site Visit",
};

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  residential: "Residential",
  commercial: "Commercial",
};

/**
 * Sequence for CT-YYYY-NNNN, derived from this year's document count
 * (mirrors the M6 quote/trade pattern).
 */
export function consultationReferenceFromCount(year: number, count: number): string {
  return `CT-${year}-${String(count + 1).padStart(4, "0")}`;
}

export function isConsultationReference(value: string): boolean {
  return /^CT-\d{4}-\d{4}$/.test(value);
}

/**
 * Bookable hours for the consultation date/time step.
 *
 * TODO-CLIENT: placeholder slots — Mon–Sat, hourly 9:00–16:00 (last booking
 * starts at 16:00 within the 9–5 day). Showroom display hours come from
 * `site.hours`; confirm real availability with the client before launch.
 */
export const CONSULTATION_BOOKING_DAYS = [1, 2, 3, 4, 5, 6] as const; // Mon–Sat

export const CONSULTATION_SLOT_LABELS: readonly { value: string; label: string }[] = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
] as const;

/** Display hours for the page, reused from the central site constants. */
export const CONSULTATION_HOURS_DISPLAY: readonly string[] = site.hours;
