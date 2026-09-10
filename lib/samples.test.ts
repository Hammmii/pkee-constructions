import { describe, expect, it } from "vitest";
import { isSampleReference, SAMPLE_MAX_QUANTITY, sampleReferenceFromCount } from "./samples";
import { samplesSchema } from "./validators/samples";

describe("sampleReferenceFromCount", () => {
  it("formats SR-YYYY-NNNN from the yearly count", () => {
    expect(sampleReferenceFromCount(2026, 0)).toBe("SR-2026-0001");
    expect(sampleReferenceFromCount(2026, 8)).toBe("SR-2026-0009");
    expect(sampleReferenceFromCount(2026, 41)).toBe("SR-2026-0042");
    expect(sampleReferenceFromCount(2027, 999)).toBe("SR-2027-1000");
  });

  it("matches the public reference pattern", () => {
    expect(sampleReferenceFromCount(2026, 0)).toMatch(/^SR-\d{4}-\d{4}$/);
  });
});

describe("isSampleReference", () => {
  it("accepts well-formed references only", () => {
    expect(isSampleReference("SR-2026-0001")).toBe(true);
    expect(isSampleReference("SR-2026-00001")).toBe(false);
    expect(isSampleReference("PK-2026-0001")).toBe(false);
    expect(isSampleReference("SR-26-0001")).toBe(false);
    expect(isSampleReference("")).toBe(false);
  });
});

describe("samplesSchema", () => {
  const valid = {
    productId: "12",
    color: "Warm Oak",
    finish: "Matte",
    quantity: "2",
    firstName: "Sam",
    lastName: "Ibrahim",
    email: "sam@example.com",
    phone: "204-555-0100",
    address: "360 Keewatin St",
    city: "Winnipeg",
    province: "MB",
    postalCode: "R3E 2T4",
    honeypot: undefined,
  };

  it("accepts a complete valid request with string quantity", () => {
    const parsed = samplesSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.quantity).toBe(2);
    }
  });

  it("rejects missing product, bad email, bad postal code", () => {
    expect(samplesSchema.safeParse({ ...valid, productId: "" }).success).toBe(false);
    expect(samplesSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
    expect(samplesSchema.safeParse({ ...valid, postalCode: "R3E2T" }).success).toBe(false);
  });

  it(`enforces the ${SAMPLE_MAX_QUANTITY}-sample cap`, () => {
    expect(samplesSchema.safeParse({ ...valid, quantity: "5" }).success).toBe(true);
    expect(samplesSchema.safeParse({ ...valid, quantity: "6" }).success).toBe(false);
    expect(samplesSchema.safeParse({ ...valid, quantity: "0" }).success).toBe(false);
  });
});
