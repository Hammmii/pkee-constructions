import { expect, test } from "@playwright/test";

/**
 * M5 catalog money paths. Run against the dev server on :3000
 * (PLAYWRIGHT_TEST_BASE_URL overrides).
 */

const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

test.use({ baseURL: BASE });

test.describe("/products catalog", () => {
  test("loads with product cards and result count", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveTitle(/Material Library/);
    await expect(page.getByRole("heading", { name: /Every material/ })).toBeVisible();
    // At least one product card links into a category detail route.
    const card = page.locator('a[href^="/products/"][href*="/"][class*="group"]').first();
    await expect(card).toBeVisible();
    const href = await card.getAttribute("href");
    expect(href).toMatch(/^\/products\/[\w-]+\/[\w-]+$/);
  });

  test("filter click updates the URL and the results", async ({ page }) => {
    await page.goto("/products");
    const categoryButton = page.getByRole("radio", { name: "PVC Wall Panels" }).first();
    await categoryButton.click();
    await expect(page).toHaveURL(/category=pvc-wall-panels/);

    // Every visible card now belongs to the PVC category.
    const cards = page.locator("main li a.group");
    await expect(cards.first()).toBeVisible();
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const href = await cards.nth(i).getAttribute("href");
      expect(href).toContain("/products/pvc-wall-panels/");
    }

    // Clear-all returns to the unfiltered catalog.
    await page.getByRole("button", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/products$/);
  });

  test("search param filters results server-side", async ({ page }) => {
    await page.goto("/products?q=marble");
    await expect(page).toHaveURL(/q=marble/);
    const cards = page.locator("main li a.group");
    await expect(cards.first()).toBeVisible();
    const body = await page.textContent("main");
    expect(body).toMatch(/marble/i);
  });

  test("empty filter set shows the empty state with recovery CTAs", async ({ page }) => {
    await page.goto("/products?q=zzzz-no-such-material");
    await expect(page.getByText("No materials match those filters.")).toBeVisible();
    await expect(page.getByRole("link", { name: /Request it/i })).toHaveAttribute(
      "href",
      /\/quote/,
    );
  });

  test("out-of-range page clamps back to page 1", async ({ page }) => {
    await page.goto("/products?page=99");
    // The clamp is a streamed redirect: the client router (or meta refresh)
    // navigates to page 1 shortly after the shell arrives.
    await page.waitForURL((url) => !url.searchParams.has("page"), { timeout: 15000 });
    expect(page.url()).not.toContain("page=99");
    const cards = page.locator("main li a.group");
    await expect(cards.first()).toBeVisible();
  });

  test("catalog emits ItemList JSON-LD", async ({ page }) => {
    await page.goto("/products");
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    // One script tag carries the full payload: [ItemList, LocalBusiness].
    const graphs = jsonLd.flatMap((raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    });
    const itemList = graphs.find((d) => d["@type"] === "ItemList");
    expect(itemList).toBeTruthy();
    expect(itemList.itemListElement.length).toBeGreaterThan(0);
    expect(
      graphs.some((d) => Array.isArray(d["@type"]) && d["@type"].includes("LocalBusiness")),
    ).toBe(true);
  });
});

test.describe("/products/[category]", () => {
  test("renders hero, benefits, products and FAQ", async ({ page }) => {
    await page.goto("/products/pvc-wall-panels");
    await expect(page).toHaveTitle(/PVC Wall Panels/);
    await expect(
      page.getByRole("heading", { name: "PVC Wall Panels", exact: true }).first(),
    ).toBeVisible();
    await expect(page.getByText("Why this category")).toBeVisible();
    await expect(page.getByText("Applications")).toBeVisible();
    // Products-in-category grid
    const cards = page.locator("main li a.group");
    await expect(cards.first()).toBeVisible();
    // FAQ accordion (native details) toggles
    const firstFaq = page.locator("details summary").first();
    if ((await page.locator("details summary").count()) > 0) {
      await firstFaq.click();
      await expect(firstFaq).toHaveAttribute("aria-expanded", "true");
    }
    // BreadcrumbList JSON-LD present
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(jsonLd.some((raw) => raw.includes("BreadcrumbList"))).toBe(true);
  });

  test("unknown category slug 404s", async ({ page }) => {
    const response = await page.goto("/products/no-such-category");
    expect(response?.status()).toBe(404);
  });
});

test.describe("/products/[category]/[slug] detail", () => {
  test("renders breadcrumb, specs, swatches, related, quote CTAs and Product JSON-LD", async ({
    page,
  }) => {
    await page.goto("/products/pvc-wall-panels/classic-marble-pvc-panel");
    await expect(page).toHaveTitle(/Classic Marble PVC Panel/);

    // Breadcrumb nav
    await expect(page.getByRole("link", { name: "PVC Wall Panels" }).first()).toBeVisible();

    // Real-text specs
    await expect(page.getByText("Material", { exact: true })).toBeVisible();
    await expect(page.getByText("Sizes", { exact: true })).toBeVisible();

    // Finish swatches with brass active ring
    const swatchGroup = page.getByRole("radiogroup", { name: "Finishes" });
    if ((await swatchGroup.count()) > 0) {
      await swatchGroup.getByRole("radio").first().click();
    }

    // Quote CTAs wired with product prefill
    const quoteCta = page.getByRole("link", { name: "Request a quote" }).first();
    await expect(quoteCta).toHaveAttribute("href", /\/quote\?product=classic-marble-pvc-panel/);
    const sampleCta = page.getByRole("link", { name: "Request a sample" }).first();
    await expect(sampleCta).toHaveAttribute("href", "/samples");

    // You may also like
    await expect(page.getByText(/also like/i)).toBeVisible();

    // Product JSON-LD with brand, no offers (quotes-only model)
    const jsonLd = await page.locator('script[type="application/ld+json"]').allTextContents();
    const graphs = jsonLd.flatMap((raw) => {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [parsed];
    });
    const productLd = graphs.find((d) => d["@type"] === "Product");
    expect(productLd).toBeTruthy();
    expect(productLd.brand.name).toBe("PKEE Constructions");
    expect(productLd.offers).toBeUndefined();
    expect(graphs.some((d) => d["@type"] === "BreadcrumbList")).toBe(true);
  });

  test("gallery opens keyboard-operable lightbox", async ({ page }) => {
    await page.goto("/products/pvc-wall-panels/classic-marble-pvc-panel");
    await page
      .getByRole("button", { name: /Open image viewer/ })
      .first()
      .click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close image viewer" })).toBeFocused();
    // Esc closes
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  });

  test("product in wrong category 404s", async ({ page }) => {
    const response = await page.goto("/products/led-profiles/classic-marble-pvc-panel");
    expect(response?.status()).toBe(404);
  });
});

test.describe("sitemap + robots", () => {
  test("sitemap lists categories and products", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain("/products/pvc-wall-panels");
    expect(body).toContain("/products/pvc-wall-panels/classic-marble-pvc-panel");
  });

  test("robots disallows admin and points at the sitemap", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
    const body = await response?.text();
    expect(body).toContain("Disallow: /admin");
    expect(body).toContain("Sitemap:");
  });
});
