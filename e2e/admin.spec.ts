import "dotenv/config";

import { expect, test } from "@playwright/test";

/**
 * Admin smoke suite: the custom Payload views and the CSV export endpoint
 * respond. These routes are auth-gated — unauthenticated requests may render
 * the admin login page (200) or redirect (3xx). We assert "serves something",
 * never page content.
 */

const OK_OR_REDIRECT = (status: number): boolean => status < 400;

for (const path of ["/admin", "/admin/pipeline", "/admin/activity"]) {
  test(`${path} responds (200 or auth redirect)`, async ({ page }) => {
    const response = await page.goto(path);
    expect(response).not.toBeNull();
    expect(OK_OR_REDIRECT(response?.status() ?? 500)).toBe(true);
  });
}

test("CSV export endpoint rejects anonymous callers", async ({ request }) => {
  const response = await request.get("/custom/api/export/quotes");
  // 401 (unauthenticated) or a redirect to the admin login — both are fine;
  // a 200 with CSV body or a 5xx would not be.
  expect([301, 302, 303, 307, 308, 401, 403]).toContain(response.status());
});

test("CSV export endpoint 404s on unknown collections", async ({ request }) => {
  const response = await request.get("/custom/api/export/not-a-collection");
  expect([404, 401, 403, ...[301, 302, 303, 307, 308]]).toContain(response.status());
});
