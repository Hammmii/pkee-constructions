import { describe, expect, it } from "vitest";
import {
  buildActivityQuery,
  csvEscape,
  isLeadCollectionSlug,
  isManagerRole,
  leadSubtitle,
  leadTitle,
  relativeTime,
  slaBucket,
  slaCounts,
} from "@/lib/admin";

describe("leadTitle", () => {
  it("derives a title per collection from existing fields", () => {
    expect(leadTitle("quotes", { reference: "PK-2026-0007" })).toBe("PK-2026-0007");
    expect(leadTitle("dealer-applications", { companyName: "Acme Interiors" })).toBe(
      "Acme Interiors",
    );
    expect(leadTitle("contact-messages", { name: "Sami", subject: "Warranty" })).toBe(
      "Sami — Warranty",
    );
    expect(leadTitle("consultations", { contact: { name: "Jo" }, type: "phone" })).toBe(
      "Jo (phone)",
    );
    expect(leadTitle("sample-requests", { color: "Brushed Brass" })).toBe("Sample — Brushed Brass");
  });

  it("falls back gracefully when fields are missing", () => {
    expect(leadTitle("quotes", {})).toBe("Quote");
    expect(leadTitle("contact-messages", { name: "Jo" })).toBe("Jo");
    expect(leadTitle("consultations", { contact: {} })).toBe("Consultation");
    expect(leadTitle("sample-requests", {})).toBe("Sample — color TBD");
  });
});

describe("leadSubtitle", () => {
  it("joins product name and source for quotes", () => {
    expect(
      leadSubtitle("quotes", {
        material: { product: { title: "Fluted Panel" } },
        source: "website",
        landingPage: "/quote",
      }),
    ).toBe("Fluted Panel · website");
  });

  it("falls back to landingPage when source is absent", () => {
    expect(leadSubtitle("quotes", { landingPage: "/products/x" })).toBe("/products/x");
  });

  it("uses productInterest for consultations and product for samples", () => {
    expect(leadSubtitle("consultations", { productInterest: "WPC decking" })).toBe("WPC decking");
    expect(leadSubtitle("sample-requests", { product: { title: "Marble Panel" } })).toBe(
      "Marble Panel",
    );
  });

  it("returns null when nothing is derivable", () => {
    expect(leadSubtitle("contact-messages", { name: "Jo" })).toBeNull();
    expect(leadSubtitle("quotes", {})).toBeNull();
  });
});

describe("relativeTime", () => {
  const now = new Date("2026-09-11T12:00:00.000Z");

  it("buckets ages into human units", () => {
    expect(relativeTime("2026-09-11T11:59:40.000Z", now)).toBe("just now");
    expect(relativeTime("2026-09-11T11:30:00.000Z", now)).toBe("30m ago");
    expect(relativeTime("2026-09-11T10:00:00.000Z", now)).toBe("2h ago");
    expect(relativeTime("2026-09-09T12:00:00.000Z", now)).toBe("2d ago");
    expect(relativeTime("2026-08-14T12:00:00.000Z", now)).toBe("4w ago");
  });

  it("never returns a negative unit for future timestamps", () => {
    expect(relativeTime("2026-09-11T13:00:00.000Z", now)).toBe("just now");
  });

  it("passes through unparseable input", () => {
    expect(relativeTime("not-a-date", now)).toBe("not-a-date");
  });
});

describe("csvEscape", () => {
  it("leaves plain values untouched", () => {
    expect(csvEscape("hello")).toBe("hello");
    expect(csvEscape(42)).toBe("42");
    expect(csvEscape(null)).toBe("");
    expect(csvEscape(undefined)).toBe("");
  });

  it("quotes values containing commas, quotes, or newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape("a,b\nc")).toBe('"a,b\nc"');
  });
});

describe("buildActivityQuery", () => {
  it("returns undefined with no filters", () => {
    expect(buildActivityQuery({})).toBeUndefined();
  });

  it("builds a single-condition where", () => {
    expect(buildActivityQuery({ status: "new" })).toEqual({ status: { equals: "new" } });
  });

  it("expands bare dates to inclusive day bounds", () => {
    const where = buildActivityQuery({ from: "2026-09-01", to: "2026-09-30" });
    expect(where).toEqual({
      and: [
        { createdAt: { greater_than_equal: "2026-09-01T00:00:00.000Z" } },
        { createdAt: { less_than_equal: "2026-09-30T23:59:59.999Z" } },
      ],
    });
  });

  it("passes full ISO timestamps through unchanged", () => {
    const where = buildActivityQuery({ from: "2026-09-01T08:30:00.000Z" });
    expect(where).toEqual({
      createdAt: { greater_than_equal: "2026-09-01T08:30:00.000Z" },
    });
  });

  it("drops unparseable dates instead of erroring", () => {
    expect(buildActivityQuery({ from: "garbage" })).toBeUndefined();
  });

  it("combines status and date range", () => {
    const where = buildActivityQuery({ status: "new", from: "2026-09-01" });
    expect(where).toEqual({
      and: [{ status: { equals: "new" } }, { createdAt: { greater_than_equal: "2026-09-01T00:00:00.000Z" } }],
    });
  });
});

describe("slaBucket / slaCounts", () => {
  it("buckets by 24h/72h thresholds", () => {
    expect(slaBucket(0)).toBe("ok");
    expect(slaBucket(23.9)).toBe("ok");
    expect(slaBucket(24)).toBe("amber");
    expect(slaBucket(71.9)).toBe("amber");
    expect(slaBucket(72)).toBe("red");
  });

  it("counts a list of ISO timestamps into buckets", () => {
    const now = new Date("2026-09-11T12:00:00.000Z");
    const counts = slaCounts(
      [
        "2026-09-11T10:00:00.000Z", // 2h → ok
        "2026-09-10T10:00:00.000Z", // 26h → amber
        "2026-09-08T10:00:00.000Z", // 98h → red
        "garbage", // skipped
      ],
      now,
    );
    expect(counts).toEqual({ ok: 1, amber: 1, red: 1 });
  });
});

describe("role / slug guards", () => {
  it("recognises manager roles only", () => {
    expect(isManagerRole(["super-admin"])).toBe(true);
    expect(isManagerRole(["sales-manager"])).toBe(true);
    expect(isManagerRole(["sales-rep"])).toBe(false);
    expect(isManagerRole([])).toBe(false);
  });

  it("validates lead collection slugs", () => {
    expect(isLeadCollectionSlug("quotes")).toBe(true);
    expect(isLeadCollectionSlug("products")).toBe(false);
  });
});
