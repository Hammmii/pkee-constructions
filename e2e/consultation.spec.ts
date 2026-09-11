import "dotenv/config";

import { expect, test } from "@playwright/test";

// Verify the booking landed in Payload via the local API (same env as the
// dev server: .env provides DATABASE_URL + PGPASSWORD).
//
// A unique cache key gives this spec its own Payload instance: the default
// instance is destroyed by earlier specs' afterAll hooks in the same worker
// process, which breaks every later local-API query (adapter tables cleared).
// Cleanup only deletes created docs — never payload.destroy().
import { getPayloadClient } from "./payload-client";

const PAYLOAD_KEY = "e2e-consultation";

const timestamp = Date.now();
const LEAD = {
  // First name must be letters only — the confirmation page validates it
  // against the same NAME_PATTERN as the trade flow.
  firstName: "Connie",
  lastName: `Consult ${timestamp}`,
  email: `e2e-consult-${timestamp}@example.com`,
  phone: "204-555-0166",
};

function tomorrowLocal(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

test.afterAll(async () => {
  // Intentionally empty — cleanup of the booking happens inline in the test,
  // and payload.destroy() would poison the shared adapter for later specs.
});

test("full consultation flow: ?type= prefill, 3 steps, confirmation, booking in Payload", async ({
  page,
}) => {
  await page.goto("/consultation?type=showroom");
  await expect(page).toHaveTitle(/consultation/i);
  await expect(page.getByText(/prefilled — showroom visit/i)).toBeVisible();

  // Step 1 — consultation type arrives prefilled from ?type=.
  await page.getByLabel(/^project type$/i).selectOption("commercial");
  await page.getByLabel(/product of interest/i).fill("PVC Wall Panels");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — schedule
  await page.getByLabel(/preferred date/i).fill(tomorrowLocal());
  await page.getByLabel(/preferred time/i).selectOption("10:00");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — contact + submit
  await page.getByLabel(/^first name/i).fill(LEAD.firstName);
  await page.getByLabel(/^last name/i).fill(LEAD.lastName);
  await page.getByLabel(/^email/i).fill(LEAD.email);
  await page.getByLabel(/^phone/i).fill(LEAD.phone);
  await page
    .getByLabel(/anything we should know/i)
    .fill("E2E automated booking — feature wall for a restaurant.");
  await page.getByRole("button", { name: "Book consultation" }).click();

  // Confirmation page with a CT- reference that survives refresh.
  await expect(page).toHaveURL(/\/consultation\/confirmation\?ref=CT-\d{4}-\d{4}/, {
    timeout: 30_000,
  });
  const referenceText = await page.locator("main p.border-brass").textContent();
  const reference = (referenceText ?? "").trim();
  expect(reference).toMatch(/^CT-\d{4}-\d{4}$/);

  // WhatsApp handoff CTA deep-links into the business chat with the reference.
  const waLink = page.getByRole("link", { name: /send via whatsapp/i });
  await expect(waLink).toBeVisible();
  const waHref = (await waLink.getAttribute("href")) ?? "";
  expect(waHref).toContain("https://wa.me/14317883188");
  expect(decodeURIComponent(waHref)).toContain(`ref ${reference}`);

  await expect(page.locator("main h1")).toHaveText(`Thank you, ${LEAD.firstName}.`);
  await page.reload();
  await expect(page.locator("main p.border-brass")).toHaveText(reference);

  // Booking landed in Payload (the collection has no reference column, so we
  // look up by the unique contact email).
  const payload = await getPayloadClient(PAYLOAD_KEY);
  const { docs } = await payload.find({
    collection: "consultations",
    where: { "contact.email": { equals: LEAD.email } },
    limit: 1,
    depth: 0,
  });
  expect(docs).toHaveLength(1);
  const booking = docs[0];
  expect(booking).toBeDefined();
  if (!booking) return;

  expect(booking.status).toBe("new");
  expect(booking.type).toBe("showroom");
  expect(booking.projectType).toBe("commercial");
  expect(booking.productInterest).toBe("PVC Wall Panels");
  expect(booking.time).toBe("10:00");

  await payload.delete({ collection: "consultations", id: booking.id });
});
