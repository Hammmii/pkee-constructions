import { describe, expect, it } from "vitest";
import {
  dealerReferenceFromCount,
  isAcceptedTradeAttachment,
  TRADE_ATTACHMENT_RULES,
  TRADE_REFERENCE_PREFIX,
} from "./trade";

describe("dealerReferenceFromCount", () => {
  it("formats DA-YYYY-NNNN with zero-padded sequences", () => {
    expect(dealerReferenceFromCount(2026, 0)).toBe("DA-2026-0001");
    expect(dealerReferenceFromCount(2026, 8)).toBe("DA-2026-0009");
    expect(dealerReferenceFromCount(2026, 41)).toBe("DA-2026-0042");
    expect(dealerReferenceFromCount(2027, 999)).toBe("DA-2027-1000");
  });

  it("uses the DA prefix", () => {
    expect(TRADE_REFERENCE_PREFIX).toBe("DA");
    expect(dealerReferenceFromCount(2026, 0)).toMatch(/^DA-\d{4}-\d{4}$/);
  });
});

describe("isAcceptedTradeAttachment", () => {
  const { maxBytesPerFile } = TRADE_ATTACHMENT_RULES;

  it("accepts the four image types and PDFs within the size limit", () => {
    expect(isAcceptedTradeAttachment({ type: "image/png", size: 1024 })).toBe(true);
    expect(isAcceptedTradeAttachment({ type: "image/jpeg", size: 1024 })).toBe(true);
    expect(isAcceptedTradeAttachment({ type: "image/webp", size: 1024 })).toBe(true);
    expect(isAcceptedTradeAttachment({ type: "image/avif", size: 1024 })).toBe(true);
    expect(isAcceptedTradeAttachment({ type: "application/pdf", size: maxBytesPerFile })).toBe(
      true,
    );
  });

  it("rejects other image types, wrong types, empty and oversized files", () => {
    expect(isAcceptedTradeAttachment({ type: "image/gif", size: 1024 })).toBe(false);
    expect(isAcceptedTradeAttachment({ type: "application/zip", size: 1024 })).toBe(false);
    expect(isAcceptedTradeAttachment({ type: "text/plain", size: 1024 })).toBe(false);
    expect(isAcceptedTradeAttachment({ type: "image/png", size: 0 })).toBe(false);
    expect(isAcceptedTradeAttachment({ type: "image/png", size: maxBytesPerFile + 1 })).toBe(
      false,
    );
  });
});
