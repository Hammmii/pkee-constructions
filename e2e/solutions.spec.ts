import { expect, test } from "@playwright/test";

/**
 * Solutions (shop-by-space) money paths. Run against the dev server on :3000
 * (PLAYWRIGHT_TEST_BASE_URL overrides).
 */

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

test.use({ baseURL: BASE });

test.describe("/solutions/[slug]", () => {
  test("living-room renders with recommended materials linking to products", async ({ page }) => {
    const response = await page.goto("/solutions/living-room");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /recommended materials/i })).toBeVisible();

    // Recommended material cards link into /products/[category]/[product].
    // Scoped to <main> so header mega-menu category links don't match.
    const cards = page.locator('main a.group[href^="/products/"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute("href");
      expect(href).toMatch(/^\/products\/[\w-]+\/[\w-]+$/);
    }
  });

  test("unknown space slug renders the 404 page", async ({ page }) => {
    await page.goto("/solutions/no-such-space-xyz");
    // Next dev streams prerendered not-found responses with a 200 status
    // (x-nextjs-prerender), so assert the rendered 404 contract instead —
    // the designed app/not-found page. Same quirk affects the committed
    // catalog 404 tests; production returns a real 404 status.
    await expect(
      page.getByRole("heading", { name: /went missing from the blueprint/i }),
    ).toBeVisible();
  });
});
