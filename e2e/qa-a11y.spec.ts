import { writeFileSync } from "node:fs";

import { expect, test } from "@playwright/test";

/**
 * A11y quick pass (manual checks — @axe-core/playwright is not installed).
 * Covers: single h1, labelled inputs, accordion aria-expanded, alt text,
 * keyboard focus visibility, and computed contrast on the bone/ink/brass
 * palette. Writes qa/a11y-report.md for human review.
 */

interface Row {
  page: string;
  check: string;
  status: "pass" | "fail" | "note";
  detail: string;
}
const rows: Row[] = [];
const row = (r: Row) => {
  rows.push(r);
  if (r.status === "fail") expect.soft(false, `${r.page}: ${r.check} — ${r.detail}`).toBe(true);
};

/** Contrast ratios for every matching element (null when no solid surface). */
async function contrastAll(page: import("@playwright/test").Page, selector: string) {
  return page.evaluate(
    ([sel = ""]: string[]) => {
      // Relative luminance for rgb()/rgba()/oklab() colors (Tailwind v4
      // emits oklab). Oklab → linear sRGB per Björn Ottosson's reference.
      const lum = (css: string) => {
        const value = css.trim();
        if (value.startsWith("oklab")) {
          const m = value.match(/oklab\(\s*([\d.]+)\s+([-\d.]+)\s+([-\d.]+)/);
          if (!m) return 0;
          const L = Number(m[1]);
          const a = Number(m[2]);
          const b = Number(m[3]);
          const l_ = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
          const m_ = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
          const s_ = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
          const r = 4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
          const g = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
          const bl = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_;
          return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
        }
        const parts = value.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
        const [r = 0, g = 0, b = 0] = parts;
        const f = (x: number) => {
          const s = x / 255;
          return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      return Array.from(document.querySelectorAll(sel)).map((el) => {
        let surface: Element | null = el;
        let bg: string | null = null;
        while (surface) {
          const candidate = getComputedStyle(surface as HTMLElement).backgroundColor;
          if (
            candidate &&
            candidate !== "transparent" &&
            candidate !== "rgba(0, 0, 0, 0)" &&
            !candidate.endsWith("/ 0)")
          ) {
            bg = candidate;
            break;
          }
          surface = surface.parentElement;
        }
        if (!bg) return { text: el.textContent?.trim() ?? "", ratio: null };
        const l1 = lum(getComputedStyle(el).color) + 0.05;
        const l2 = lum(bg) + 0.05;
        return {
          text: el.textContent?.trim() ?? "",
          ratio: l1 > l2 ? l1 / l2 : l2 / l1,
        };
      });
    },
    [selector],
  );
}

test.afterAll(() => {
  const md = [
    `# A11y quick pass (manual checks — no axe-core in this repo)`,
    "",
    `Generated ${new Date().toISOString()} against http://localhost:3000.`,
    "",
    "| Page | Check | Status | Detail |",
    "|---|---|---|---|",
    ...rows.map(
      (r) => `| ${r.page} | ${r.check} | ${r.status} | ${r.detail.replaceAll("|", "\\|")} |`,
    ),
    "",
  ].join("\n");
  writeFileSync(new URL("../qa/a11y-report.md", import.meta.url), md);
});

test("home: document structure, alt text, focus visibility, contrast", async ({ page }) => {
  await page.goto("/");

  const h1s = await page.getByRole("heading", { level: 1 }).count();
  row({ page: "/", check: "exactly one h1", status: h1s === 1 ? "pass" : "fail", detail: `found ${h1s}` });

  const imgs = page.locator("main img");
  const total = await imgs.count();
  let missingAlt = 0;
  for (let i = 0; i < total; i++) {
    const alt = await imgs.nth(i).getAttribute("alt");
    if (alt === null || alt.trim() === "") missingAlt++;
  }
  row({
    page: "/",
    check: "alt text on images",
    status: missingAlt === 0 ? "pass" : "fail",
    detail: `${total} images in <main>, ${missingAlt} missing/empty alt`,
  });

  // Keyboard focus visibility on the first in-page link.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused.first()).toBeVisible();
  const outline = await focused.first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { outline: cs.outlineStyle, shadow: cs.boxShadow, width: cs.outlineWidth };
  });
  const visibleFocus = outline.outline !== "none" || outline.shadow !== "none";
  row({
    page: "/",
    check: "focus-visible styles on keyboard focus",
    status: visibleFocus ? "pass" : "fail",
    detail: JSON.stringify(outline),
  });

  // Contrast: body copy (long paragraphs) must be ≥ 4.5:1; short brass
  // eyebrow labels are recorded as notes vs the 3:1 large-text bar.
  const paragraphs = await contrastAll(page, "main p");
  const bodyCopy = paragraphs.filter((p) => (p.text ?? "").length > 60 && p.ratio !== null);
  const minBody = Math.min(...bodyCopy.map((p) => p.ratio ?? Infinity));
  row({
    page: "/",
    check: "body text contrast ≥ 4.5:1",
    status: bodyCopy.length > 0 && minBody >= 4.5 ? "pass" : "fail",
    detail: `${bodyCopy.length} body paragraphs sampled, min ${Number.isFinite(minBody) ? minBody.toFixed(2) : "n/a"}:1`,
  });
  const labels = paragraphs.filter((p) => (p.text ?? "").length <= 60 && p.ratio !== null);
  const minLabel = Math.min(...labels.map((p) => p.ratio ?? Infinity));
  row({
    page: "/",
    check: "eyebrow/label contrast vs 3:1 (note)",
    status: "note",
    detail: `min ${Number.isFinite(minLabel) ? minLabel.toFixed(2) : "n/a"}:1 over ${labels.length} short labels (brass on bone/ink)`,
  });
});

test("product detail: h1, radiogroup label, lightbox dialog", async ({ page }) => {
  await page.goto("/products/pvc-wall-panels/classic-marble-pvc-panel");

  // The h1 hydrates in — wait for it before counting (the page has known
  // hydration instability, see qa/audit-report.md).
  await expect(page.locator("h1")).toHaveCount(1, { timeout: 15_000 });
  const h1s = await page.locator("h1").allTextContents();
  row({
    page: "product detail",
    check: "exactly one h1 naming the product",
    status: h1s.length === 1 && /classic marble/i.test(h1s[0] ?? "") ? "pass" : "fail",
    detail: JSON.stringify(h1s),
  });

  const swatches = page.getByRole("radiogroup", { name: "Finishes" });
  const swatchCount = await swatches.count();
  row({
    page: "product detail",
    check: "finish swatches are a labelled radiogroup",
    status: swatchCount > 0 ? "pass" : "note",
    detail: swatchCount > 0 ? "radiogroup[aria-label=Finishes] present" : "no swatch group rendered",
  });

  await page.getByRole("button", { name: /open image viewer/i }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  const labelled = await dialog.getAttribute("aria-label");
  row({
    page: "product detail",
    check: "lightbox exposes dialog role",
    status: (await dialog.count()) === 1 ? "pass" : "fail",
    detail: labelled ? `aria-label="${labelled}"` : "no accessible name on dialog",
  });
  await page.keyboard.press("Escape");

  // Heading contrast (large text ≥ 3:1) — sample every h2, report the min.
  const h2s = await contrastAll(page, "main h2");
  const h2Ratios = h2s.filter((h) => h.ratio !== null).map((h) => h.ratio ?? Infinity);
  const minH2 = Math.min(...h2Ratios);
  row({
    page: "product detail",
    check: "heading contrast ≥ 3:1",
    status: h2Ratios.length > 0 && minH2 >= 3 ? "pass" : "fail",
    detail: `${h2Ratios.length} h2 sampled, min ${Number.isFinite(minH2) ? minH2.toFixed(2) : "n/a"}:1`,
  });
});

test("category FAQ accordion state is exposed", async ({ page }) => {
  await page.goto("/products/pvc-wall-panels");
  const summary = page.locator("details summary").first();
  if ((await page.locator("details summary").count()) === 0) {
    row({ page: "category", check: "FAQ accordion", status: "note", detail: "no details elements" });
    return;
  }
  const details = page.locator("details").first();
  await expect(details).not.toHaveAttribute("open", "");
  await summary.click();
  await expect(details).toHaveAttribute("open", "");
  // The app mirrors state onto aria-expanded only after interaction —
  // record whether it is present before first toggle (a11y nicety, not a fail).
  const initialExpanded = await summary.getAttribute("aria-expanded");
  row({
    page: "category",
    check: "accordion <details open> toggles",
    status: "pass",
    detail: "open attribute toggles on click",
  });
  row({
    page: "category",
    check: "aria-expanded present before first toggle",
    status: initialExpanded === null ? "note" : "pass",
    detail:
      initialExpanded === null
        ? "summary has no aria-expanded until first interaction (native <details> conveys state)"
        : `initial aria-expanded=${initialExpanded}`,
  });
});

test("quote: every visible input has an accessible label", async ({ page }) => {
  await page.goto("/quote");
  // Single in-page evaluation avoids stale locator counts while the wizard
  // hydrates. Considers wrapping <label>, htmlFor, aria-label/labelledby.
  const unlabelled = await page.evaluate(() => {
    const els = Array.from(
      document.querySelectorAll("main input, main select, main textarea"),
    ).filter((el) => {
      const cs = getComputedStyle(el);
      const visible = cs.display !== "none" && cs.visibility !== "hidden";
      const rect = el.getBoundingClientRect();
      // The honeypot is intentionally present-but-off-screen; skip it.
      const hp = el.closest("[aria-hidden='true']");
      return visible && rect.width > 0 && !hp;
    });
    return els
      .filter((el) => {
        const input = el as HTMLInputElement;
        const hasWrapped = Array.from(input.labels ?? []).length > 0;
        const hasFor =
          input.id && document.querySelector(`main label[for="${CSS.escape(input.id)}"]`);
        const aria = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");
        return !(hasWrapped || hasFor || aria);
      })
      .map((el) => (el as HTMLInputElement).name || el.tagName);
  });
  row({
    page: "/quote",
    check: "all visible inputs labelled",
    status: unlabelled.length === 0 ? "pass" : "fail",
    detail: unlabelled.length ? `unlabelled: ${unlabelled.join(", ")}` : "all visible inputs labelled",
  });

  const h1s = await page.getByRole("heading", { level: 1 }).count();
  row({
    page: "/quote",
    check: "exactly one h1",
    status: h1s === 1 ? "pass" : "fail",
    detail: `found ${h1s}`,
  });
});
