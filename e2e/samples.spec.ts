import "dotenv/config";

import { expect, test } from "@playwright/test";

// Verify the request landed in Payload via the local API (same env as the
// dev server: .env provides DATABASE_URL + PGPASSWORD).
//
// A unique cache key gives this spec its own Payload instance: the default
// instance is destroyed by earlier specs' afterAll hooks in the same worker
// process, which breaks every later local-API query (adapter tables cleared).
// We deliberately do NOT destroy here — destroying would poison the shared
// adapter for specs that run after this one.
import { getPayload } from "payload";
import config from "../payload.config";

const PAYLOAD_KEY = "e2e-samples";

// 1×1 transparent PNG — enough for the required product hero image when the
// dev DB has no published products and the spec has to seed one.
const PNG_1PX = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

const timestamp = Date.now();
const LEAD = {
  // First name must be letters only — the confirmation page validates it
  // against the same NAME_PATTERN as the trade flow.
  firstName: "Ettie",
  lastName: `Sample ${timestamp}`,
  email: `e2e-sample-${timestamp}@example.com`,
  phone: "204-555-0177",
};

/** Ids the spec created itself and must clean up. */
let seededMediaId: number | null = null;
let seededProductId: number | null = null;

test.afterAll(async () => {
  const payload = await getPayload({ config, key: PAYLOAD_KEY });
  if (seededProductId) {
    await payload.delete({ collection: "products", id: seededProductId }).catch(() => {});
  }
  if (seededMediaId) {
    await payload.delete({ collection: "media", id: seededMediaId }).catch(() => {});
  }
  // Intentionally no payload.destroy() — see the note above PAYLOAD_KEY.
});

test("full samples flow: 3 steps, confirmation, request in Payload", async ({ page }) => {
  // A published product must exist for the select. Seed one only when the
  // dev DB doesn't already have any.
  const payload = await getPayload({ config, key: PAYLOAD_KEY });
  const { docs: products } = await payload.find({
    collection: "products",
    where: { _status: { equals: "published" } },
    limit: 1,
    depth: 0,
  });
  let productName: string;
  if (products[0]) {
    productName = products[0].name;
  } else {
    const media = await payload.create({
      collection: "media",
      data: { alt: "E2E sample seed" },
      file: { data: PNG_1PX, name: "e2e-seed.png", mimetype: "image/png", size: PNG_1PX.length },
    });
    seededMediaId = media.id;
    const product = await payload.create({
      collection: "products",
      // `_status` is valid at runtime (scripts/seed.mjs uses it) but is not
      // part of the generated select types, hence the cast.
      data: {
        name: `E2E Sample Product ${timestamp}`,
        slug: `e2e-sample-product-${timestamp}`,
        heroImage: media.id,
        _status: "published",
      } as never,
    });
    seededProductId = product.id;
    productName = product.name;
  }

  await page.goto("/samples");
  await expect(page).toHaveTitle(/sample/i);

  // Step 1 — samples
  await page.getByLabel(/^product$/i).selectOption({ label: productName });
  await page.getByLabel(/^colour$/i).selectOption({ label: "Warm Oak" });
  await page.getByLabel(/^finish$/i).selectOption({ label: "Matte" });
  await page.getByLabel(/^quantity/i).fill("2");
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 2 — contact
  await page.getByLabel(/^first name/i).fill(LEAD.firstName);
  await page.getByLabel(/^last name/i).fill(LEAD.lastName);
  await page.getByLabel(/^email/i).fill(LEAD.email);
  await page.getByLabel(/^phone/i).fill(LEAD.phone);
  await page.getByRole("button", { name: "Continue" }).click();

  // Step 3 — delivery + submit
  await page.getByLabel(/street address/i).fill("360 Keewatin St");
  await page.getByLabel(/^city$/i).fill("Winnipeg");
  await page.getByLabel(/province/i).selectOption("MB");
  await page.getByLabel(/postal code/i).fill("R3E 0A1");
  await page.getByRole("button", { name: "Request samples" }).click();

  // Confirmation page with an SR- reference that survives refresh.
  await expect(page).toHaveURL(/\/samples\/confirmation\?ref=SR-\d{4}-\d{4}/, { timeout: 30_000 });
  const referenceText = await page.locator("main p.border-brass").textContent();
  const reference = (referenceText ?? "").trim();
  expect(reference).toMatch(/^SR-\d{4}-\d{4}$/);
  await expect(page.locator("main h1")).toHaveText(`Thank you, ${LEAD.firstName}.`);
  await page.reload();
  await expect(page.locator("main p.border-brass")).toHaveText(reference);

  // Request landed in Payload (the collection has no reference column, so we
  // look up by the unique contact email).
  const { docs } = await payload.find({
    collection: "sample-requests",
    where: { "contact.email": { equals: LEAD.email } },
    limit: 1,
    depth: 1,
  });
  expect(docs).toHaveLength(1);
  const request = docs[0];
  expect(request).toBeDefined();
  if (!request) return;

  expect(request.status).toBe("new");
  expect(request.color).toBe("Warm Oak");
  expect(request.finish).toBe("Matte");
  expect(request.quantity).toBe(2);
  const relatedProduct = typeof request.product === "object" ? request.product : null;
  expect(relatedProduct?.name).toBe(productName);

  await payload.delete({ collection: "sample-requests", id: request.id });
});
