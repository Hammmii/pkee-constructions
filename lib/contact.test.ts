import { describe, expect, it } from "vitest";
import {
  CONTACT_SUBJECT_LABELS,
  CONTACT_SUBJECTS,
  contactSubjectLabel,
  directionsUrl,
  mailtoHref,
  mapEmbedUrl,
  phoneHref,
  showroomAddressLine,
} from "./contact";
import { site } from "./site";

describe("showroomAddressLine", () => {
  it("builds the single-line address from the site constants", () => {
    expect(showroomAddressLine()).toBe("360 Keewatin St, Winnipeg, MB");
    expect(showroomAddressLine()).toBe(
      `${site.address.street}, ${site.address.city}, ${site.address.province}`,
    );
  });
});

describe("mapEmbedUrl", () => {
  it("targets the showroom address with the embed output flag", () => {
    const url = mapEmbedUrl();
    expect(url).toMatch(/^https:\/\/www\.google\.com\/maps\?q=/);
    expect(url).toContain("output=embed");
    expect(decodeURIComponent(url)).toContain("360 Keewatin St, Winnipeg, MB");
  });
});

describe("directionsUrl", () => {
  it("uses the universal-crossing directions endpoint with the showroom destination", () => {
    const url = directionsUrl();
    expect(url.startsWith("https://www.google.com/maps/dir/?api=1&destination=")).toBe(true);
    expect(decodeURIComponent(url)).toContain("360 Keewatin St, Winnipeg, MB");
  });

  it("agrees with mapEmbedUrl on the destination", () => {
    const embed = new URL(mapEmbedUrl()).searchParams.get("q");
    const dest = new URL(directionsUrl()).searchParams.get("destination");
    expect(dest).toBe(embed);
  });
});

describe("phoneHref / mailtoHref", () => {
  it("exposes the tel: link from the site constants", () => {
    expect(phoneHref()).toBe(site.phone.href);
    expect(phoneHref()).toMatch(/^tel:\+1\d{10}$/);
  });

  it("builds a mailto link for the public contact address", () => {
    expect(mailtoHref()).toBe(`mailto:${site.email}`);
  });
});

describe("contactSubjectLabel", () => {
  it("covers every CONTACT_SUBJECTS value", () => {
    for (const subject of CONTACT_SUBJECTS) {
      expect(CONTACT_SUBJECT_LABELS[subject]).toBeTruthy();
      expect(contactSubjectLabel(subject)).toBe(CONTACT_SUBJECT_LABELS[subject]);
    }
  });

  it("falls back to the raw value for unknown subjects", () => {
    expect(contactSubjectLabel("mystery")).toBe("mystery");
  });

  it("defaults null/undefined to the general label", () => {
    expect(contactSubjectLabel(null)).toBe(CONTACT_SUBJECT_LABELS.general);
    expect(contactSubjectLabel(undefined)).toBe(CONTACT_SUBJECT_LABELS.general);
  });
});
