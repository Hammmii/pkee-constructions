import "dotenv/config";

import { expect, test } from "@playwright/test";

// Submissions create real Payload docs — every created doc is deleted in
// afterAll. Shared keyed client — never destroys Payload.
//
// KNOWN PRODUCT BUG (app code off-limits): with JavaScript disabled, /quote
// renders an empty <main>. The page content streams inside a React Suspense
// boundary (`<template id="B:0">` in the SSR HTML) that is only revealed by
// client JS, so the no-JS progressive-enhancement contract is broken for the
// quote wizard (the contact form no-JS path still works). The no-JS quote
// test in the "no-JS progressive enhancement" block below fails until the
// app SSRs the wizard outside a client-only Suspense boundary.
import { getPayloadClient } from "./payload-client";

const timestamp = Date.now();

// Doc ids/refs captured during the run for afterAll cleanup.
const cleanup: { collection: string; id: number | string }[] = [];
const createdReferences: string[] = [];
const contactEmails: string[] = [];

test.afterAll(async () => {
  const payload = await getPayloadClient("e2e-qa-forms-matrix");
  for (const ref of createdReferences) {
    const { docs } = await payload.find({
      collection: "quotes",
      where: { reference: { equals: ref } },
      limit: 1,
    });
    for (const doc of docs) {
      await payload.delete({ collection: "quotes", id: doc.id });
    }
  }
  for (const email of contactEmails) {
    const { docs } = await payload.find({
      collection: "contact-messages",
      where: { email: { equals: email } },
      limit: 1,
    });
    for (const doc of docs) {
      await payload.delete({ collection: "contact-messages", id: doc.id });
    }
  }
  for (const { collection, id } of cleanup) {
    await payload.delete({ collection: collection as never, id: id as never });
  }
  // Intentionally no payload.destroy() — it would poison the shared adapter.
});

test.describe("honeypot matrix", () => {
  const FORMS = [
    { route: "/quote", selector: 'input[name="hp"]' },
    { route: "/contact", selector: 'input[name="website"]' },
    { route: "/trade", selector: 'input[name="website"]' },
    { route: "/custom-studio", selector: 'input[name="website"]' },
  ];

  for (const form of FORMS) {
    test(`honeypot present, hidden and unfocusable on ${form.route}`, async ({ page }) => {
      await page.goto(form.route);
      const trap = page.locator(`${form.selector}`);
      await expect(trap).toHaveCount(1);
      await expect(trap).toHaveAttribute("tabindex", "-1");
      await expect(trap).toHaveAttribute("autocomplete", "off");
      // Wrapped in an aria-hidden container so assistive tech skips it.
      await expect(trap.locator("xpath=ancestor::*[@aria-hidden='true'][1]")).toHaveCount(1);
      // Off-screen / visually hidden.
      const box = await trap.boundingBox();
      expect(box === null || box.width <= 1 || box.x < 0).toBe(true);
    });
  }
});

test.describe("validation error states", () => {
  test("quote wizard blocks step 1 and surfaces field errors", async ({ page }) => {
    await page.goto("/quote");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/please tell us your name/i)).toBeVisible();
    await expect(page.getByText(/valid email/i)).toBeVisible();
    // Still on step 1 — no progression on invalid data.
    await expect(page).toHaveURL(/\/quote$/);
    // Fill the name only — email error persists, next-step content absent.
    await page.getByLabel(/full name/i).fill("Error State Tester");
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test("contact form surfaces validation errors on submit", async ({ page }) => {
    await page.goto("/contact");
    await page.getByRole("button", { name: /send message/i }).click();
    // Summary alert + per-field alerts (client RHF messages) + invalid states.
    await expect(page.getByRole("alert").first()).toContainText(/review the highlighted fields/i);
    await expect(page.getByText("Required", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Select a topic", { exact: true })).toBeVisible();
    await expect(page.getByLabel(/^name$/i)).toHaveAttribute("aria-invalid", "true");
    // stays on /contact — no redirect to ?sent=1
    await expect(page).toHaveURL(/\/contact$/);
  });
});

test.describe("file-upload rejection", () => {
  test("quote: wrong type and oversize files are rejected inline", async ({ page }) => {
    await page.goto("/quote");
    // Gate on hydration before filling: the step headings render only
    // post-mount, and filling controlled fields beforehand gets wiped by
    // React's initial render (full name came back empty + invalid).
    await expect(page.getByRole("heading", { name: /first, how do we reach you/i })).toBeVisible();

    // Walk to step 6 (attachments) with minimal valid data.
    await page.getByLabel(/full name/i).fill(`Upload Tester ${timestamp}`);
    await page.getByLabel(/^email/i).fill(`qa-upload-${timestamp}@example.com`);
    await page.getByRole("button", { name: "Continue" }).click();
    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Continue" }).click();
    }
    // The file input itself is sr-only (visually hidden inside the dropzone
    // label), so assert on the visible dropzone text instead of the input.
    await expect(page.getByText("Choose files")).toBeVisible();

    // Wrong type.
    await page.getByLabel(/choose files/i).setInputFiles({
      name: "notes.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("not an image"),
    });
    await expect(page.getByText(/isn't an image or PDF/i)).toBeVisible();
    // File was not staged: the staged-list filename is absent.
    await expect(page.getByText("notes.txt", { exact: true })).toHaveCount(0);

    // Oversize (11 MB PNG — over the 10 MB cap).
    await page.getByLabel(/choose files/i).setInputFiles({
      name: "huge.png",
      mimeType: "image/png",
      buffer: Buffer.alloc(11 * 1024 * 1024, 1),
    });
    await expect(page.getByText(/is over 10 MB/i)).toBeVisible();
  });

  test("trade: wrong-type business document is rejected", async ({ page }) => {
    await page.goto("/trade");
    await page.getByLabel(/^first name$/i).fill("Upload");
    await page.getByLabel(/^last name$/i).fill("Tester");
    await page.getByLabel(/^company name$/i).fill(`Upload Test Co ${timestamp}`);
    await page.getByLabel(/gst \/ business number/i).fill("123456789RT0001");
    await page.getByLabel(/business address/i).fill("100 Keewatin St");
    await page.getByLabel(/^email$/i).fill(`qa-upload-${timestamp}@example.com`);
    await page.getByLabel(/^phone$/i).fill("204-555-0100");
    await page.getByLabel(/^city$/i).fill("Winnipeg");
    await page.getByLabel(/province \/ territory/i).fill("Manitoba");
    await page.getByLabel(/postal code/i).fill("R3E 0A1");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByLabel(/business type/i).selectOption("retailer");
    await page.getByLabel(/years in business/i).fill("5");
    await page.getByLabel(/annual turnover/i).selectOption("1m-5m");
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 is visible before we exercise its upload input.
    await expect(page.getByText(/review your application/i)).toBeVisible();
    await page.getByLabel(/choose files/i).setInputFiles({
      name: "evil.exe",
      mimeType: "application/x-msdownload",
      buffer: Buffer.from("MZ"),
    });
    await expect(
      page.getByRole("alert").filter({ hasText: /isn't an image or PDF/i }),
    ).toBeVisible();
  });
});

test.describe("CTA → prefill wiring", () => {
  test("product page Request-a-quote CTA prefills the wizard material step", async ({ page }) => {
    await page.goto("/products/pvc-wall-panels/classic-marble-pvc-panel");
    // Scope to <main> — the header nav also carries a "Request a Quote" link.
    await page.locator("main").getByRole("link", { name: "Request a quote" }).first().click();
    await page.waitForURL(/\/quote\?product=classic-marble-pvc-panel/);

    // KNOWN FLAKE (suspected product bug, app code off-limits): /quote
    // renders its wizard inside a client-only Suspense boundary (same root
    // cause as the no-JS failure documented at the top of this file).
    // Navigating from the product CTA with ?product= re-renders that
    // boundary and can reset the wizard mid-walk, leaving the material-step
    // select hidden. The walk below is hydration-gated and passes in
    // isolation; it flakes only when the Suspense reset wins the race.
    await expect(page.getByRole("heading", { name: /first, how do we reach you/i })).toBeVisible();
    await page.getByLabel(/full name/i).fill(`Prefill Tester ${timestamp}`);
    await page.getByLabel(/^email/i).fill(`qa-prefill-${timestamp}@example.com`);
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    const productSelect = page.getByLabel(/^product$/i);
    await expect(productSelect).toBeVisible({ timeout: 15_000 });
    await expect(productSelect).toHaveValue("classic-marble-pvc-panel");
    // Category select is seeded too.
    await expect(page.getByLabel(/product category/i)).toHaveValue("pvc-wall-panels");
  });

  test("custom-studio Book-a-designer CTA lands on the consultation page", async ({ page }) => {
    await page.goto("/custom-studio");
    await page
      .getByRole("link", { name: /^book a designer$/i })
      .first()
      .click();
    await page.waitForURL(/\/consultation\?type=showroom/);
    // The hydration bug (audit #3) renders two <main> elements — assert on
    // the content one.
    await expect(page.locator("main", { has: page.getByRole("heading") }).first()).toBeVisible();
    await expect(page).toHaveTitle(/consultation/i);
  });

  test("solutions Get-this-look links resolve to real product pages", async ({ page }) => {
    await page.goto("/solutions/living-room");
    const cards = page.locator('main a.group[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute("href");
      expect(href).toMatch(/^\/products\/[\w-]+\/[\w-]+$/);
      // Every target renders (200, real product — not the 404 contract).
      const target = await page.request.get(href ?? "");
      expect(target.status(), `${href} must resolve`).toBe(200);
      // Strip <script> flight data — Next dev embeds the not-found page in
      // every response (same quirk as qa/check-links.mts).
      const body = (await target.text()).replace(/<script[\s\S]*?<\/script>/g, "");
      expect(body.includes("went missing from the blueprint")).toBe(false);
    }
  });
});

test.describe("no-JS progressive enhancement", () => {
  test("quote form submits and confirms with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/quote");

    // All seven steps render as fieldsets in the no-JS form.
    await page.getByLabel(/full name/i).fill(`NoJS Quote ${timestamp}`);
    await page.getByLabel(/^email/i).fill(`qa-nojs-quote-${timestamp}@example.com`);
    await page.getByRole("button", { name: /submit request|review request/i }).click();

    await page.waitForURL(/\/quote\/confirmation\?ref=PK-\d{4}-\d{4}/, { timeout: 30_000 });
    const ref = /PK-\d{4}-\d{4}/.exec(page.url())?.[0];
    expect(ref).toBeTruthy();
    if (ref) createdReferences.push(ref);
    await context.close();
  });

  test("contact form submits with JavaScript disabled", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/contact");

    const email = `qa-nojs-contact-${timestamp}@example.com`;
    await page.getByLabel(/^name$/i).fill(`NoJS Contact ${timestamp}`);
    await page.getByLabel(/^email$/i).fill(email);
    await page.getByLabel(/^topic$/i).selectOption({ index: 1 });
    await page.getByLabel(/^message$/i).fill("No-JS progressive enhancement smoke test.");
    await page.getByRole("button", { name: /send message/i }).click();

    await page.waitForURL(/\/contact\?sent=1$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: /thank you/i })).toBeVisible();
    contactEmails.push(email);
    await context.close();
  });
});
