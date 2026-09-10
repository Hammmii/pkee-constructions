/**
 * Link & route audit crawler (M11 QA gate).
 *
 * Crawls every public route (sitemap + static pages + 12 solution spaces),
 * asserts: page renders a <main>, zero console errors, no dead internal
 * hrefs. Dev-server quirk: prerendered not-found streams HTTP 200
 * (x-nextjs-prerender), so dead links are detected by fetching the target
 * and looking for the designed 404 marker ("went missing from the blueprint").
 *
 * Usage: node qa/check-links.mts  (dev server must be on :3000)
 * Output: qa/link-audit.json + qa/link-audit-report.md
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.AUDIT_BASE_URL ?? "http://localhost:3000";
const NOT_FOUND_MARKER = "went missing from the blueprint";

const STATIC_ROUTES = [
  "/",
  "/products",
  "/quote",
  "/projects",
  "/solutions",
  "/trade",
  "/custom-studio",
  "/about",
  "/contact",
  "/samples",
  "/admin", // redirects to /admin/login
];

const SOLUTION_SLUGS = [
  "bathroom",
  "bedroom",
  "feature-wall",
  "fireplace",
  "hotel",
  "kitchen",
  "living-room",
  "office",
  "outdoor",
  "prayer-room",
  "restaurant",
  "retail",
];

interface RouteResult {
  route: string;
  status: number | null;
  ok: boolean;
  hasMain: boolean;
  isNotFound: boolean;
  consoleErrors: string[];
  issues: string[];
}

interface Issue {
  severity: "critical" | "major" | "minor";
  route: string;
  kind: string;
  detail: string;
}

const routes: RouteResult[] = [];
const linkIssues: Issue[] = [];
const checkedHrefs = new Map<string, { ok: boolean; detail: string }>();

async function sitemapRoutes(): Promise<string[]> {
  const res = await fetch(`${BASE}/sitemap.xml`);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
    (m[1] ?? "").replace(BASE, ""),
  );
}

async function hrefResolves(path: string): Promise<{ ok: boolean; detail: string }> {
  const pathname = path.split("#")[0] ?? "";
  if (checkedHrefs.has(pathname)) return checkedHrefs.get(pathname)!;
  let result: { ok: boolean; detail: string };
  try {
    const res = await fetch(`${BASE}${pathname}`, { redirect: "follow" });
    // Next dev embeds the not-found page in every response's <script> flight
    // data, so strip scripts before looking for the 404 marker.
    const body = (await res.text()).replace(/<script[\s\S]*?<\/script>/g, "");
    if (res.status === 404 || body.includes(NOT_FOUND_MARKER)) {
      result = { ok: false, detail: `dead link (${res.status}, 404 page content)` };
    } else if (res.status >= 400) {
      result = { ok: false, detail: `HTTP ${res.status}` };
    } else {
      result = { ok: true, detail: `HTTP ${res.status}` };
    }
  } catch (err) {
    result = { ok: false, detail: `fetch failed: ${String(err)}` };
  }
  checkedHrefs.set(pathname, result);
  return result;
}

async function main() {
  const sm = await sitemapRoutes();
  const allRoutes = [
    ...new Set([...STATIC_ROUTES, ...sm, ...SOLUTION_SLUGS.map((s) => `/solutions/${s}`)]),
  ].sort();

  const browser = await chromium.launch();
  const page = await browser.newPage();

  for (const route of allRoutes) {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (err) => consoleErrors.push(`pageerror: ${err.message}`));

    const result: RouteResult = {
      route,
      status: null,
      ok: false,
      hasMain: false,
      isNotFound: false,
      consoleErrors,
      issues: [],
    };
    try {
      const response = await page.goto(`${BASE}${route}`, {
        waitUntil: "networkidle",
        timeout: 45_000,
      });
      result.status = response?.status() ?? null;
      await page.waitForTimeout(250);
      result.hasMain = (await page.locator("main").count()) > 0;
      result.isNotFound =
        (await page.getByRole("heading", { name: NOT_FOUND_MARKER }).count()) > 0;
      if (result.isNotFound) result.issues.push("renders 404 content");
      if (!result.hasMain) result.issues.push("no <main> element");
      for (const err of consoleErrors) {
        result.issues.push(`console error: ${err.slice(0, 300)}`);
        linkIssues.push({ severity: "major", route, kind: "console", detail: err.slice(0, 300) });
      }
      result.ok = result.hasMain && !result.isNotFound;

      // Collect and verify every internal <a href>.
      const hrefs = await page
        .locator("a[href^='/']")
        .evaluateAll((els) => els.map((el) => el.getAttribute("href") ?? ""));
      for (const href of new Set(hrefs)) {
        const check = await hrefResolves(href);
        if (!check.ok) {
          result.issues.push(`dead link: ${href} — ${check.detail}`);
          linkIssues.push({
            severity: href.startsWith("/admin") ? "minor" : "critical",
            route,
            kind: "dead-link",
            detail: `${href} — ${check.detail}`,
          });
          result.ok = false;
        }
      }
    } catch (err) {
      result.issues.push(`navigation failed: ${String(err).slice(0, 300)}`);
      linkIssues.push({
        severity: "critical",
        route,
        kind: "navigation",
        detail: String(err).slice(0, 300),
      });
    }
    routes.push(result);
    console.log(`${result.ok ? "PASS" : "FAIL"} ${route} (${result.status})`);
  }

  await browser.close();

  const pass = routes.filter((r) => r.ok).length;
  const json = { base: BASE, generatedAt: new Date().toISOString(), routes, linkIssues };
  mkdirSync(new URL(".", import.meta.url), { recursive: true });
  writeFileSync(new URL("./link-audit.json", import.meta.url), JSON.stringify(json, null, 2));

  const md = [
    `# Link crawl results (generated ${new Date().toISOString()})`,
    "",
    `Base: ${BASE} — ${routes.length} routes crawled, ${checkedHrefs.size} unique internal hrefs verified.`,
    "",
    "| Route | HTTP | Main | Verdict |",
    "|---|---|---|---|",
    ...routes.map(
      (r) =>
        `| ${r.route} | ${r.status ?? "—"} | ${r.hasMain ? "✓" : "✗"} | ${r.ok ? "PASS" : "FAIL"} |`,
    ),
    "",
    linkIssues.length
      ? `## Dead links & console errors (${linkIssues.length})`
      : "## Dead links & console errors: none",
    "",
    ...(linkIssues.length
      ? [
          "| Severity | Route | Kind | Detail |",
          "|---|---|---|---|",
          ...linkIssues.map(
            (i) => `| ${i.severity} | ${i.route} | ${i.kind} | ${i.detail.replaceAll("|", "\\|")} |`,
          ),
        ]
      : []),
    "",
  ].join("\n");
  writeFileSync(new URL("./link-audit-report.md", import.meta.url), md);

  console.log(`\n${pass}/${routes.length} routes passed; ${linkIssues.length} issues.`);
  if (linkIssues.length) process.exitCode = 1;
}

await main();
