import "dotenv/config";

import { expect, test } from "@playwright/test";

// Verify the lead landed in Payload via the local API (same env as the dev
// server: .env provides DATABASE_URL + PGPASSWORD).
import { getPayload } from "payload";
import config from "../payload.config";

// 1×1 transparent PNG.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const timestamp = Date.now();
const LEAD = {
  name: `E2E Test Lead ${timestamp}`,
  email: `e2e-lead-${timestamp}@example.com`,
  phone: "204-555-0199",
};

test.afterAll(async () => {
  const payload = await getPayload({ config });
  await payload.destroy();
});

test("full quote flow: 7 steps, attachment, confirmation, lead in Payload", async ({ page }) => {
  await page.goto("/quote");
  await expect(page).toHaveTitle(/quote/i);

  // Step 1 — customer
  await page.getByLabel(/full name/i).fill(LEAD.name);
  await page.getByLabel(/^email/i).fill(LEAD.email);
  await page.getByLabel(/^phone$/i).fill(LEAD.phone);
  await page.getByLabel(/city/i).fill("Winnipeg");
  await page.getByLabel(/postal code/i).fill("R3E 0A1");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — project
  await page.getByLabel(/project type/i).selectOption("commercial");
  await page.getByLabel(/new build or renovation/i).selectOption("renovation");
  await page.getByLabel(/room \/ space/i).fill("Restaurant");
  await page.getByLabel(/timeline/i).selectOption("1-3-months");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — material (product select may be empty on an unseeded dev DB; it's optional)
  await page.getByLabel(/approximate quantity/i).fill("600");
  await page.getByLabel(/^sq ft$/i).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4 — dimensions
  await page.getByLabel(/wall width/i).fill("12");
  await page.getByLabel(/wall height/i).fill("9");
  await page.getByLabel(/floor area/i).fill("400");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 5 — customization
  await page
    .getByLabel(/design requirements/i)
    .fill("E2E automated submission — full feature wall.");
  await page.getByLabel(/installation required/i).check();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 6 — attachments
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "e2e-room-photo.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  await page.getByRole("button", { name: "Review request" }).click();

  // Step 7 — review + submit
  await expect(page.getByText(LEAD.name)).toBeVisible();
  await page.getByRole("button", { name: "Submit request" }).click();

  // Confirmation page with a PK- reference that survives refresh.
  await expect(page).toHaveURL(/\/quote\/confirmation\?ref=PK-\d{4}-\d{4}/, { timeout: 30_000 });
  const referenceText = await page.locator("main p.border-brass").textContent();
  const reference = (referenceText ?? "").trim();
  expect(reference).toMatch(/^PK-\d{4}-\d{4}$/);
  await page.reload();
  await expect(page.locator("main p.border-brass")).toHaveText(reference);

  // Lead landed in Payload: correct status, source, score, attachment.
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "quotes",
    where: { reference: { equals: reference } },
    limit: 1,
    depth: 1,
  });
  expect(docs).toHaveLength(1);
  const quote = docs[0];
  expect(quote).toBeDefined();
  if (!quote) return;

  expect(quote.status).toBe("new");
  expect(quote.source).toBe("website");
  expect(quote.customer.name).toBe(LEAD.name);
  expect(quote.customer.email).toBe(LEAD.email);
  expect(quote.project?.projectType).toBe("commercial");
  expect(quote.material?.quantity).toBe(600);
  expect(typeof quote.leadScore).toBe("number");
  // commercial 20 + qty 20 + timeline 10 + dimensions 15 + attachment 15 + phone 10
  expect(quote.leadScore).toBe(90);
  expect(Array.isArray(quote.attachments) && quote.attachments.length).toBe(1);

  await payload.delete({ collection: "quotes", id: quote.id });
});
