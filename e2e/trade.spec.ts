import "dotenv/config";

import { expect, test } from "@playwright/test";

// Verify the application landed in Payload via the local API (same env as
// the dev server: .env provides DATABASE_URL + PGPASSWORD).
import { getPayload } from "payload";
import config from "../payload.config";

// 1×1 transparent PNG.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const timestamp = Date.now();
const APPLICANT = {
  firstName: "Trade",
  lastName: "E2E Tester",
  companyName: `E2E Trade Co ${timestamp}`,
  companyAddress: "100 Keewatin St",
  email: `e2e-trade-${timestamp}@example.com`,
  phone: "204-555-0177",
  city: "Winnipeg",
  province: "Manitoba",
  postalCode: "R3E 0A1",
};

let applicationId: number | null = null;

test.afterAll(async () => {
  const payload = await getPayload({ config });
  if (applicationId != null) {
    await payload.delete({ collection: "dealer-applications", id: applicationId });
  }
  await payload.destroy();
});

test("dealer application flow: 3 steps, upload, DA- confirmation, doc in Payload", async ({
  page,
}) => {
  await page.goto("/trade");
  await expect(page).toHaveTitle(/dealer/i);

  // Step 1 — business details
  await page.getByLabel(/^first name$/i).fill(APPLICANT.firstName);
  await page.getByLabel(/^last name$/i).fill(APPLICANT.lastName);
  await page.getByLabel(/^company name$/i).fill(APPLICANT.companyName);
  await page.getByLabel(/gst \/ business number/i).fill("123456789RT0001");
  await page.getByLabel(/business address/i).fill(APPLICANT.companyAddress);
  await page.getByLabel(/^email$/i).fill(APPLICANT.email);
  await page.getByLabel(/^phone$/i).fill(APPLICANT.phone);
  await page.getByLabel(/^city$/i).fill(APPLICANT.city);
  await page.getByLabel(/province \/ territory/i).fill(APPLICANT.province);
  await page.getByLabel(/postal code/i).fill(APPLICANT.postalCode);
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — business profile
  await page.getByLabel(/business type/i).selectOption("retailer");
  await page.getByLabel(/years in business/i).fill("8");
  await page.getByLabel(/annual turnover/i).selectOption("1m-5m");
  await page.getByLabel(/carry other brands/i).check();
  await page.getByLabel(/brands you carry/i).fill("Competitor A, Competitor B");
  await page.getByLabel(/anything else/i).fill("E2E automated dealer application.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — documents + review
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "e2e-showroom.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  await expect(page.getByText("e2e-showroom.png")).toBeVisible();
  await expect(page.getByText(APPLICANT.companyName)).toBeVisible();
  await page.getByRole("button", { name: "Submit application" }).click();

  // Confirmation page with a DA- reference.
  await expect(page).toHaveURL(/\/trade\/confirmation\?ref=DA-\d{4}-\d{4}/, { timeout: 30_000 });
  const referenceText = await page.locator("main p.border-brass").textContent();
  const reference = (referenceText ?? "").trim();
  expect(reference).toMatch(/^DA-\d{4}-\d{4}$/);
  await expect(page.getByRole("heading", { name: /Thank you, Trade\./ })).toBeVisible();

  // Application landed in Payload: correct status, fields, and attachment.
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "dealer-applications",
    where: { companyName: { equals: APPLICANT.companyName } },
    limit: 1,
    depth: 1,
  });
  expect(docs).toHaveLength(1);
  const application = docs[0];
  expect(application).toBeDefined();
  if (!application) return;
  applicationId = application.id;

  expect(application.status).toBe("new");
  expect(application.firstName).toBe(APPLICANT.firstName);
  expect(application.lastName).toBe(APPLICANT.lastName);
  expect(application.email).toBe(APPLICANT.email);
  expect(application.phone).toBe(APPLICANT.phone);
  expect(application.businessType).toBe("retailer");
  expect(application.yearsInBusiness).toBe(8);
  expect(application.annualTurnover).toBe("1m-5m");
  expect(application.otherBrands).toBe(true);
  expect(application.otherBrandNames).toBe("Competitor A, Competitor B");
  expect(Array.isArray(application.documents) && application.documents.length).toBe(1);
});
