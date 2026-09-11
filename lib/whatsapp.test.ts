import { describe, expect, it } from "vitest";
import {
  buildLeadWhatsAppLink,
  buildLeadWhatsAppMessage,
  buildWhatsAppLink,
  digitsOnly,
} from "./whatsapp";

describe("digitsOnly", () => {
  it("strips formatting characters", () => {
    expect(digitsOnly("+1 (431) 788-3188")).toBe("14317883188");
  });

  it("passes through an already-clean number", () => {
    expect(digitsOnly("14317883188")).toBe("14317883188");
  });

  it("returns an empty string when there are no digits", () => {
    expect(digitsOnly("wa.me/")).toBe("");
  });
});

describe("buildWhatsAppLink", () => {
  it("builds a wa.me link with encoded text", () => {
    const link = buildWhatsAppLink({ phone: "+1 (431) 788-3188", text: "Hi there" });
    expect(link).toBe("https://wa.me/14317883188?text=Hi%20there");
  });

  it("encodes line breaks as %0A", () => {
    const link = buildWhatsAppLink({ phone: "14317883188", text: "a\nb" });
    expect(link).toBe("https://wa.me/14317883188?text=a%0Ab");
  });

  it("throws when the phone has no digits", () => {
    expect(() => buildWhatsAppLink({ phone: "(---)", text: "hi" })).toThrow();
  });
});

describe("buildLeadWhatsAppMessage", () => {
  it("includes greeting, form type, and reference", () => {
    const message = buildLeadWhatsAppMessage({
      reference: "PK-2026-0042",
      formType: "quote",
      firstName: "Sami",
      summaryLines: ["Name: Sami"],
    });
    expect(message).toBe(
      "Hi PKEE Constructions! I just submitted a quote request (ref PK-2026-0042). " +
        "Here are my details:\n\nName: Sami",
    );
  });

  it("omits the reference clause when none is given", () => {
    const message = buildLeadWhatsAppMessage({
      reference: null,
      formType: "contact",
      firstName: null,
      summaryLines: [],
    });
    expect(message).toBe(
      "Hi PKEE Constructions! I just submitted a contact request. Here are my details:",
    );
  });

  it("renders summary lines one per line", () => {
    const message = buildLeadWhatsAppMessage({
      reference: "SR-2026-0007",
      formType: "sample",
      firstName: "Ada",
      summaryLines: ["Product: Charcoal Oak", "Quantity: 2"],
    });
    const lines = message.split("\n");
    expect(lines.at(-2)).toBe("Product: Charcoal Oak");
    expect(lines.at(-1)).toBe("Quantity: 2");
  });
});

describe("buildLeadWhatsAppLink", () => {
  it("composes message and link together", () => {
    const link = buildLeadWhatsAppLink({
      phone: "+1 431-788-3188",
      reference: "CT-2026-0003",
      formType: "consultation",
      firstName: "Lin",
      summaryLines: ["When: Friday"],
    });
    expect(link.startsWith("https://wa.me/14317883188?text=")).toBe(true);
    const text = decodeURIComponent(link.split("?text=")[1] ?? "");
    expect(text).toContain("(ref CT-2026-0003)");
    expect(text).toContain("When: Friday");
  });
});
