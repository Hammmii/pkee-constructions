import "dotenv/config";

import { expect, test } from "@playwright/test";

// Verify the message landed in Payload via the local API (same env as the
// dev server: .env provides DATABASE_URL + PGPASSWORD).
import { getPayload } from "payload";
import config from "../payload.config";

const timestamp = Date.now();
const SENDER = {
  name: "Contact E2E Tester",
  email: `e2e-contact-${timestamp}@example.com`,
  phone: "204-555-0188",
  subject: "general",
  message: "E2E automated contact message — please disregard.",
};

let messageId: number | null = null;

test.afterAll(async () => {
  const payload = await getPayload({ config });
  if (messageId != null) {
    await payload.delete({ collection: "contact-messages", id: messageId });
  }
  await payload.destroy();
});

test("about page renders 200 with story, people, timeline, values, and showroom sections", async ({
  page,
}) => {
  const response = await page.goto("/about");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/about/i);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Showroom callout carries the real address from the site constants.
  await expect(page.getByText(/360 Keewatin St, Winnipeg, MB/)).toBeVisible();
  await expect(page.getByRole("heading", { name: /principals/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /story so far/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /values/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /see it installed/i })).toBeVisible();
});

test("contact form: fill + submit → ?sent=1, doc in Payload, cleanup", async ({ page }) => {
  await page.goto("/contact");
  await expect(page).toHaveTitle(/contact/i);
  await expect(page.getByText(/360 Keewatin St, Winnipeg, MB/)).toBeVisible();

  // Fill the form and submit.
  await page.getByLabel(/^name$/i).fill(SENDER.name);
  await page.getByLabel(/^email$/i).fill(SENDER.email);
  await page.getByLabel(/^phone$/i).fill(SENDER.phone);
  await page.getByLabel(/^topic$/i).selectOption(SENDER.subject);
  await page.getByLabel(/^message$/i).fill(SENDER.message);
  await page.getByRole("button", { name: /send message/i }).click();

  // Redirected to the success state.
  await expect(page).toHaveURL(/\/contact\?sent=1$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();

  // Message landed in Payload with the right fields and status.
  const payload = await getPayload({ config });
  const { docs } = await payload.find({
    collection: "contact-messages",
    where: { email: { equals: SENDER.email } },
    limit: 1,
  });
  expect(docs).toHaveLength(1);
  const message = docs[0];
  expect(message).toBeDefined();
  if (!message) return;
  messageId = message.id;

  expect(message.status).toBe("new");
  expect(message.name).toBe(SENDER.name);
  expect(message.email).toBe(SENDER.email);
  expect(message.phone).toBe(SENDER.phone);
  expect(message.subject).toBe("General question");
  expect(message.message).toBe(SENDER.message);
});
