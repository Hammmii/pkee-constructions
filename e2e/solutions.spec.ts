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
    const cards = page.locator('a[href^="/products/"][href*="/"][class*="group"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute("href");
      expect(href).toMatch(/^\/products\/[\w-]+\/[\w-]+$/);
    }
  });

  test("unknown space slug returns 404", async ({ page }) => {
    const response = await page.goto("/solutions/no-such-space-xyz");
    expect(response?.status()).toBe(404);
  });
});
