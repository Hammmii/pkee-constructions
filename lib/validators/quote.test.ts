import { describe, expect, it } from "vitest";
import { quoteSchema } from "./quote";

const validPayload = {
  customer: {
    name: "Avery Stone",
    email: "avery@example.com",
    phone: "204-555-0123",
    preferredContact: "email",
    city: "Winnipeg",
    postalCode: "R3E 0A1",
  },
  project: {
    projectType: "commercial",
    buildType: "renovation",
    roomType: "Restaurant",
    timeline: "1-3-months",
  },
  material: {
    categorySlug: "pvc-wall-panels",
    productSlug: "pvc-wall-panels",
    finish: "Matte",
    color: "Ivory",
    quantity: "600",
    unit: "sqft",
  },
  dimensions: {
    width: "12",
    height: "9",
    floorArea: "400",
    wallCount: "3",
    doorCount: "1",
  },
  customization: {
    designRequirements: "Full feature wall behind the bar.",
    lighting: "Backlit",
    fabrication: "Curved corners",
    installationRequired: true,
    deliveryRequired: false,
  },
  hp: "",
};

describe("quoteSchema", () => {
  it("accepts a valid full payload and coerces numbers", () => {
    const result = quoteSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.material.quantity).toBe(600);
      expect(result.data.dimensions.width).toBe(12);
      expect(result.data.customization.installationRequired).toBe(true);
    }
  });

  it("rejects a payload missing the email", () => {
    const result = quoteSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, email: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("customer.email");
    }
  });

  it("rejects a payload missing the name", () => {
    const result = quoteSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, name: "" },
    });
    expect(result.success).toBe(false);
  });

  it("treats empty strings as absent for optional fields", () => {
    const result = quoteSchema.safeParse({
      ...validPayload,
      project: {
        projectType: "",
        buildType: "",
        roomType: "",
        timeline: "",
      },
      material: {
        categorySlug: "",
        productSlug: "",
        finish: "",
        color: "",
        quantity: "",
        unit: "",
      },
      dimensions: { width: "", height: "", floorArea: "", wallCount: "", doorCount: "" },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project.projectType).toBeUndefined();
      expect(result.data.material.quantity).toBeUndefined();
      expect(result.data.dimensions.width).toBeUndefined();
    }
  });

  it("rejects malformed emails and bad enum values", () => {
    const bad = quoteSchema.safeParse({
      ...validPayload,
      customer: { ...validPayload.customer, email: "not-an-email" },
      project: { ...validPayload.project, timeline: "yesterday" },
    });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      const paths = bad.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("customer.email");
      expect(paths).toContain("project.timeline");
    }
  });

  it("rejects non-numeric quantities", () => {
    const result = quoteSchema.safeParse({
      ...validPayload,
      material: { ...validPayload.material, quantity: "six hundred" },
    });
    expect(result.success).toBe(false);
  });
});
