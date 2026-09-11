import "dotenv/config";

import { expect, test } from "@playwright/test";

// Verify the request landed in Payload via the local API (same env as
// the dev server: .env provides DATABASE_URL + PGPASSWORD). Shared keyed
// client — never destroys Payload, only deletes the docs this spec created.
import { getPayloadClient } from "./payload-client";

// 1×1 transparent PNG.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const timestamp = Date.now();
const REQUESTER = {
  firstName: "Studio",
  lastName: "E2E Tester",
  email: `e2e-studio-${timestamp}@example.com`,
  phone: "204-555-0142",
};

let consultationId: number | null = null;

test.afterAll(async () => {
  const payload = await getPayloadClient("e2e-custom-studio");
  if (consultationId != null) {
    await payload.delete({ collection: "consultations", id: consultationId }).catch(() => {});
  }
  // Intentionally no payload.destroy() — it would poison the shared adapter.
});

test("capability showcase renders", async ({ page }) => {
  const response = await page.goto("/custom-studio");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/custom studio/i);
  await expect(page.getByRole("heading", { name: /feature walls/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /^book a designer$/i }).first()).toBeVisible();
});

test("upload flow: 5 steps, upload, confirmation, doc in Payload", async ({ page }) => {
  await page.goto("/custom-studio#upload");
  // The stepped UI mounts after hydration — the no-JS form has no "Continue".
  await expect(page.getByRole("button", { name: "Continue" })).toBeVisible();

  // Step 1 — material & finish
  await page.getByLabel(/base material/i).selectOption({ index: 1 });
  await page.getByLabel(/^finish$/i).fill("Walnut");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — reference upload
  await page.getByLabel(/choose files/i).setInputFiles({
    name: "e2e-design.png",
    mimeType: "image/png",
    buffer: PNG_1PX,
  });
  await expect(page.getByText("e2e-design.png")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — dimensions (optional)
  await page.getByLabel(/width/i).fill("96");
  await page.getByLabel(/height/i).fill("48");
  await page.getByLabel(/quantity \/ area/i).fill("1 feature wall");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 4 — design brief
  await page
    .getByLabel(/design description/i)
    .fill("E2E automated brief — fluted feature wall with warm backlighting.");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 5 — contact & review
  await page.getByLabel(/^first name$/i).fill(REQUESTER.firstName);
  await page.getByLabel(/^last name$/i).fill(REQUESTER.lastName);
  await page.getByLabel(/^email$/i).fill(REQUESTER.email);
  await page.getByLabel(/^phone$/i).fill(REQUESTER.phone);
  await page.getByRole("button", { name: "Submit request" }).click();

  // Confirmation page greets by first name — no reference token for this collection.
  await expect(page).toHaveURL(/\/custom-studio\/confirmation\?name=Studio/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /Thank you, Studio\./ })).toBeVisible();

  // WhatsApp handoff CTA deep-links into the business chat.
  const waLink = page.getByRole("link", { name: /send via whatsapp/i });
  await expect(waLink).toBeVisible();
  expect((await waLink.getAttribute("href")) ?? "").toContain("https://wa.me/14317883188");

  // Request landed in Payload as a Consultations record with the full brief.
  const payload = await getPayloadClient("e2e-custom-studio");
  const { docs } = await payload.find({
    collection: "consultations",
    where: { "contact.email": { equals: REQUESTER.email } },
    limit: 1,
  });
  expect(docs).toHaveLength(1);
  const consultation = docs[0];
  expect(consultation).toBeDefined();
  if (!consultation) return;
  consultationId = consultation.id;

  expect(consultation.status).toBe("new");
  expect(consultation.type).toBe("phone");
  expect(consultation.contact?.name).toBe(`${REQUESTER.firstName} ${REQUESTER.lastName}`);
  expect(consultation.productInterest).toContain("Custom Studio request");
  expect(consultation.productInterest).toContain("Finish: Walnut");
  expect(consultation.productInterest).toContain("Dimensions: 96 × 48");
  expect(consultation.productInterest).toContain("E2E automated brief");
  expect(consultation.productInterest).toContain("e2e-design.png");
});
