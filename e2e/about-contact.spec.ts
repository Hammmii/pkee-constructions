import "dotenv/config";

import { expect, test } from "@playwright/test";

// Verify the message landed in Payload via the local API (same env as the
// dev server: .env provides DATABASE_URL + PGPASSWORD). Shared keyed client —
// never destroys Payload, only deletes the docs this spec created.
import { getPayloadClient } from "./payload-client";

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
  const payload = await getPayloadClient("e2e-about-contact");
  if (messageId != null) {
    await payload.delete({ collection: "contact-messages", id: messageId }).catch(() => {});
  }
  // Intentionally no payload.destroy() — it would poison the shared adapter.
});

test("about page renders 200 with story, people, timeline, values, and showroom sections", async ({
  page,
}) => {
  const response = await page.goto("/about");
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/about/i);

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Showroom callout carries the real address from the site constants.
  await expect(
    page.locator("section", { has: page.getByRole("heading", { name: /see it installed/i }) }),
  ).toContainText("360 Keewatin St, Winnipeg, MB");
  await expect(page.getByRole("heading", { name: /principals/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /from first delivery/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /values/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /see it installed/i })).toBeVisible();
});

test("contact form: fill + submit → ?sent=1, doc in Payload, cleanup", async ({ page }) => {
  await page.goto("/contact");
  await expect(page).toHaveTitle(/contact/i);
  await expect(page.locator("address").first()).toContainText("360 Keewatin St, Winnipeg, MB");

  // Fill the form and submit.
  await page.getByLabel(/^name$/i).fill(SENDER.name);
  await page.getByLabel(/^email$/i).fill(SENDER.email);
  await page.getByLabel(/^phone$/i).fill(SENDER.phone);
  await page.getByLabel(/^topic$/i).selectOption(SENDER.subject);
  await page.getByLabel(/^message$/i).fill(SENDER.message);
  await page.getByRole("button", { name: /send message/i }).click();

  // Redirected to the success state (first name rides along for the WhatsApp handoff).
  await expect(page).toHaveURL(/\/contact\?sent=1&name=/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();

  // WhatsApp handoff CTA deep-links into the business chat.
  const waContact = page.getByRole("link", { name: /send via whatsapp/i });
  await expect(waContact).toBeVisible();
  const contactHref = (await waContact.getAttribute("href")) ?? "";
  expect(contactHref).toContain("https://wa.me/14317883188");
  expect(decodeURIComponent(contactHref)).toContain(`Name: ${SENDER.name.split(" ")[0]}`);

  // Message landed in Payload with the right fields and status.
  const payload = await getPayloadClient("e2e-about-contact");
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
