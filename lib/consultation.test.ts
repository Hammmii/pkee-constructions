import { describe, expect, it } from "vitest";
import {
  CONSULTATION_SLOT_LABELS,
  consultationReferenceFromCount,
  isConsultationReference,
} from "./consultation";
import { consultationSchema } from "./validators/consultation";

describe("consultationReferenceFromCount", () => {
  it("formats CT-YYYY-NNNN from the yearly count", () => {
    expect(consultationReferenceFromCount(2026, 0)).toBe("CT-2026-0001");
    expect(consultationReferenceFromCount(2026, 8)).toBe("CT-2026-0009");
    expect(consultationReferenceFromCount(2026, 41)).toBe("CT-2026-0042");
    expect(consultationReferenceFromCount(2027, 999)).toBe("CT-2027-1000");
  });

  it("matches the public reference pattern", () => {
    expect(consultationReferenceFromCount(2026, 0)).toMatch(/^CT-\d{4}-\d{4}$/);
  });
});

describe("isConsultationReference", () => {
  it("accepts well-formed references only", () => {
    expect(isConsultationReference("CT-2026-0001")).toBe(true);
    expect(isConsultationReference("CT-2026-00001")).toBe(false);
    expect(isConsultationReference("SR-2026-0001")).toBe(false);
    expect(isConsultationReference("CT-26-0001")).toBe(false);
    expect(isConsultationReference("")).toBe(false);
  });
});

describe("consultationSchema", () => {
  const valid = {
    type: "showroom",
    projectType: "residential",
    productInterest: "PVC Wall Panels",
    date: "2099-01-05",
    time: "10:00",
    firstName: "Sam",
    lastName: "Ibrahim",
    email: "sam@example.com",
    phone: "204-555-0100",
    notes: "Kitchen backsplash",
    honeypot: undefined,
  };

  it("accepts a complete valid booking", () => {
    expect(consultationSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts every consultation type", () => {
    for (const type of ["phone", "video", "showroom", "site-visit"] as const) {
      expect(consultationSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it("rejects unknown types and malformed times", () => {
    expect(consultationSchema.safeParse({ ...valid, type: "carrier-pigeon" }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...valid, time: "10am" }).success).toBe(false);
    expect(consultationSchema.safeParse({ ...valid, time: "" }).success).toBe(false);
  });

  it("rejects dates in the past", () => {
    expect(consultationSchema.safeParse({ ...valid, date: "2020-01-01" }).success).toBe(false);
  });

  it("exposes hourly booking slots", () => {
    expect(CONSULTATION_SLOT_LABELS.length).toBe(8);
    expect(CONSULTATION_SLOT_LABELS[0]?.value).toBe("09:00");
    expect(CONSULTATION_SLOT_LABELS.at(-1)?.value).toBe("16:00");
  });
});
