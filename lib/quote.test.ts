import { describe, expect, it } from "vitest";
import {
  computeLeadScore,
  isAcceptedAttachment,
  QUOTE_ATTACHMENT_RULES,
  referenceFromCount,
} from "./quote";

describe("computeLeadScore", () => {
  it("scores a minimal residential lead low", () => {
    expect(computeLeadScore({ projectType: "residential" })).toBe(0);
  });

  it("rewards commercial projects", () => {
    expect(computeLeadScore({ projectType: "commercial" })).toBe(20);
    expect(computeLeadScore({ projectType: "residential" })).toBe(0);
  });

  it("rewards quantity >= 500", () => {
    expect(computeLeadScore({ quantity: 500 })).toBe(20);
    expect(computeLeadScore({ quantity: 499 })).toBe(0);
  });

  it("rewards a stated timeline", () => {
    expect(computeLeadScore({ timeline: "asap" })).toBe(10);
    expect(computeLeadScore({ timeline: null })).toBe(0);
  });

  it("rewards any dimension", () => {
    expect(computeLeadScore({ dimensions: { width: 12 } })).toBe(15);
    expect(computeLeadScore({ dimensions: {} })).toBe(0);
    expect(computeLeadScore({ dimensions: null })).toBe(0);
  });

  it("rewards attachments and a phone number", () => {
    expect(computeLeadScore({ attachmentCount: 2 })).toBe(15);
    expect(computeLeadScore({ phone: "204-555-0123" })).toBe(10);
    expect(computeLeadScore({ phone: "   " })).toBe(0);
  });

  it("stacks signals and clamps at 100", () => {
    const score = computeLeadScore({
      projectType: "commercial", // 20
      quantity: 800, // 20
      timeline: "1-3-months", // 10
      dimensions: { floorArea: 400 }, // 15
      attachmentCount: 3, // 15
      phone: "204-555-0123", // 10
    });
    expect(score).toBe(90);
  });

  it("never exceeds the 100 ceiling or goes below 0", () => {
    // Every signal at once: 20+20+10+15+15+10 = 90 — the clamp is a guard, not reachable.
    const maxed = computeLeadScore({
      projectType: "commercial",
      quantity: 999_999,
      timeline: "asap",
      dimensions: { width: 1, height: 1, floorArea: 1, wallCount: 1, doorCount: 1 },
      attachmentCount: 5,
      phone: "204-555-0123",
    });
    expect(maxed).toBe(90);
    expect(maxed).toBeLessThanOrEqual(100);
    expect(computeLeadScore({})).toBe(0);
  });
});

describe("referenceFromCount", () => {
  it("formats PK-YYYY-NNNN with zero-padded sequences", () => {
    expect(referenceFromCount(2026, 0)).toBe("PK-2026-0001");
    expect(referenceFromCount(2026, 8)).toBe("PK-2026-0009");
    expect(referenceFromCount(2026, 41)).toBe("PK-2026-0042");
    expect(referenceFromCount(2027, 999)).toBe("PK-2027-1000");
  });
});

describe("isAcceptedAttachment", () => {
  const { maxBytesPerFile } = QUOTE_ATTACHMENT_RULES;

  it("accepts images and PDFs within the size limit", () => {
    expect(isAcceptedAttachment({ type: "image/png", size: 1024 })).toBe(true);
    expect(isAcceptedAttachment({ type: "application/pdf", size: maxBytesPerFile })).toBe(true);
  });

  it("rejects wrong types, empty files, and oversized files", () => {
    expect(isAcceptedAttachment({ type: "application/zip", size: 1024 })).toBe(false);
    expect(isAcceptedAttachment({ type: "image/png", size: 0 })).toBe(false);
    expect(isAcceptedAttachment({ type: "image/png", size: maxBytesPerFile + 1 })).toBe(false);
  });
});
