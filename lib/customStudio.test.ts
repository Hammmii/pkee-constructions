import { describe, expect, it } from "vitest";
import {
  buildCustomStudioMessage,
  CUSTOM_STUDIO_ATTACHMENT_RULES,
  CUSTOM_STUDIO_STEPS,
  isAcceptedCustomStudioAttachment,
} from "./customStudio";

describe("isAcceptedCustomStudioAttachment", () => {
  const { maxBytesPerFile } = CUSTOM_STUDIO_ATTACHMENT_RULES;

  it("accepts the four image types and PDFs within the size limit", () => {
    expect(isAcceptedCustomStudioAttachment({ type: "image/png", size: 1024 })).toBe(true);
    expect(isAcceptedCustomStudioAttachment({ type: "image/jpeg", size: 1024 })).toBe(true);
    expect(isAcceptedCustomStudioAttachment({ type: "image/webp", size: 1024 })).toBe(true);
    expect(isAcceptedCustomStudioAttachment({ type: "image/avif", size: 1024 })).toBe(true);
    expect(
      isAcceptedCustomStudioAttachment({ type: "application/pdf", size: maxBytesPerFile }),
    ).toBe(true);
  });

  it("rejects other types, empty and oversized files", () => {
    expect(isAcceptedCustomStudioAttachment({ type: "image/gif", size: 1024 })).toBe(false);
    expect(isAcceptedCustomStudioAttachment({ type: "application/zip", size: 1024 })).toBe(false);
    expect(isAcceptedCustomStudioAttachment({ type: "text/plain", size: 1024 })).toBe(false);
    expect(isAcceptedCustomStudioAttachment({ type: "image/png", size: 0 })).toBe(false);
    expect(isAcceptedCustomStudioAttachment({ type: "image/png", size: maxBytesPerFile + 1 })).toBe(
      false,
    );
  });
});

describe("buildCustomStudioMessage", () => {
  it("always includes the header, base material, and finish", () => {
    const message = buildCustomStudioMessage({
      baseMaterial: "PVC Wall Panels",
      finish: "Walnut",
      attachments: [],
    });
    expect(message).toContain("Custom Studio request");
    expect(message).toContain("Base material: PVC Wall Panels");
    expect(message).toContain("Finish: Walnut");
    expect(message).not.toContain("Dimensions:");
    expect(message).not.toContain("Design brief:");
  });

  it("includes dimensions, quantity, and the design brief when provided", () => {
    const message = buildCustomStudioMessage({
      baseMaterial: "WPC",
      finish: "Matte black",
      width: "96",
      height: "48",
      quantity: "2 walls",
      description: "Vertical fluted feature wall behind the reception desk.",
      attachments: [],
    });
    expect(message).toContain("Dimensions: 96 × 48");
    expect(message).toContain("Quantity / area: 2 walls");
    expect(message).toContain("Design brief:");
    expect(message).toContain("reception desk");
  });

  it("omits the height when only the width is known", () => {
    const message = buildCustomStudioMessage({
      baseMaterial: "Charcoal Panels",
      finish: "Natural",
      width: "120",
      attachments: [],
    });
    expect(message).toContain("Dimensions: 120");
    expect(message).not.toContain("×");
  });

  it("lists uploaded reference files with their media ids", () => {
    const message = buildCustomStudioMessage({
      baseMaterial: "SPC",
      finish: "Oak",
      attachments: [
        { name: "moodboard.png", mediaId: 12 },
        { name: "sketch.pdf", mediaId: null },
      ],
    });
    expect(message).toContain("Reference files (2):");
    expect(message).toContain("- moodboard.png (media #12)");
    expect(message).toContain("- sketch.pdf");
  });
});

describe("wizard contract", () => {
  it("exposes five steps and the shared attachment limits", () => {
    expect(CUSTOM_STUDIO_STEPS).toBe(5);
    expect(CUSTOM_STUDIO_ATTACHMENT_RULES.maxFiles).toBe(5);
    expect(CUSTOM_STUDIO_ATTACHMENT_RULES.maxBytesPerFile).toBe(10 * 1024 * 1024);
  });
});
