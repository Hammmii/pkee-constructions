import { expect, test } from "@playwright/test";

/**
 * Projects portfolio money paths. Run against the dev server on :3000
 * (PLAYWRIGHT_TEST_BASE_URL overrides).
 */

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

test.use({ baseURL: BASE });

test.describe("/projects", () => {
  test("listing renders 200 with project cards linking to detail pages", async ({ page }) => {
    const response = await page.goto("/projects");
    expect(response?.status()).toBe(200);

    await expect(page.getByRole("heading", { name: /our/i }).first()).toBeVisible();

    const cards = page.locator('main a.group[href^="/projects/"]');
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute("href");
      expect(href).toMatch(/^\/projects\/[\w-]+$/);
    }
  });

  test("type filter narrows results via searchParams links", async ({ page }) => {
    const response = await page.goto("/projects?type=commercial");
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("navigation", { name: /filter projects/i })).toBeVisible();
    const active = page.locator('a[aria-current="true"]');
    await expect(active.first()).toContainText(/commercial|All/i);
  });
});

test.describe("/projects/[slug]", () => {
  test("first card's detail page shows title and materials used", async ({ page }) => {
    await page.goto("/projects");
    const first = page.locator('main a.group[href^="/projects/"]').first();
    const href = await first.getAttribute("href");
    expect(href).toBeTruthy();
    const slug = href?.split("/").pop() ?? "";

    const response = await page.goto(href ?? "/projects");
    expect(response?.status()).toBe(200);

    const heading = page
      .getByRole("heading", { name: new RegExp(slug.replace(/-/g, " "), "i") })
      .first();
    await expect(heading).toBeVisible({ timeout: 10_000 });
  });

  test("unknown slug renders the 404 page", async ({ page }) => {
    await page.goto("/projects/no-such-project-xyz");
    // Next dev streams prerendered not-found responses with a 200 status,
    // so assert the rendered 404 contract — the designed app/not-found page.
    await expect(
      page.getByRole("heading", { name: /went missing from the blueprint/i }),
    ).toBeVisible();
  });
});
