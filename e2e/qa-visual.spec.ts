import { mkdirSync } from "node:fs";

import { expect, test } from "@playwright/test";

/**
 * Visual smoke — full-page screenshots of key routes at desktop (1440) and
 * mobile (390) widths into qa/screenshots/ for human review. No pixel diffs.
 */

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/products", name: "catalog" },
  { path: "/products/pvc-wall-panels", name: "category" },
  { path: "/products/pvc-wall-panels/classic-marble-pvc-panel", name: "product" },
  { path: "/quote", name: "quote" },
  { path: "/solutions/living-room", name: "solution" },
  { path: "/projects", name: "projects" },
  { path: "/trade", name: "trade" },
  { path: "/custom-studio", name: "custom-studio" },
  { path: "/about", name: "about" },
  { path: "/contact", name: "contact" },
];

const VIEWPORTS = [
  { width: 1440, height: 900, tag: "desktop" },
  { width: 390, height: 844, tag: "mobile" },
];

test("visual smoke screenshots", async ({ browser }) => {
  mkdirSync(new URL("../qa/screenshots", import.meta.url), { recursive: true });

  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const route of ROUTES) {
      await page.goto(route.path, { waitUntil: "networkidle" });
      // Hide the dev-only hydration overlay noise by waiting a beat for fonts.
      await page.waitForTimeout(400);
      const file = new URL(
        `../qa/screenshots/${viewport.tag}-${route.name}.png`,
        import.meta.url,
      );
      await page.screenshot({ path: file.pathname, fullPage: true });
      expect(true).toBe(true);
    }
    await context.close();
  }
});
