# PKEE Constructions — M11 QA Audit Report

Date: 2026-09-11 · Target: dev server (Next 16.3.4 + Payload 3.88, embedded Postgres) · Auditor scope: `qa/`, `e2e/qa-*.spec.ts` only (no app changes).

## Summary counts

| Metric | Value |
|---|---|
| Routes crawled (`qa/check-links.mts`) | 58 (sitemap 36 + 12 solutions + static pages incl. /admin) |
| Unique internal hrefs verified | 114 |
| Issues found | 111 (73 critical, 38 major) — dominated by one root cause: 57 pages link to `/solutions`, which 404s |
| Existing e2e suite (catalog, quote, solutions, trade, about-contact, custom-studio) | **not re-run in final state** — see Gates below |
| New QA specs | `e2e/qa-forms-matrix.spec.ts` (12 tests), `e2e/qa-a11y.spec.ts` (4 tests), `e2e/qa-visual.spec.ts` (22 screenshots) |
| Screenshots for human review | `qa/screenshots/` — 11 routes × desktop 1440 / mobile 390 |

## Top defects (product bugs — NOT fixed, out of scope)

| # | Sev | Defect | Route / repro |
|---|---|---|---|
| 1 | Critical | **`/solutions` 404s** — `app/solutions/` has only `[slug]`; no index page. The header nav "Solutions" link appears on every page and all 12 space pages cross-link to it. | `curl -i localhost:3000/solutions` → 404 "Page not found". 57 dead-link issues trace to this one root cause. |
| 2 | Critical | **Projects filter links are malformed** — `filterQuery()` in `app/projects/page.tsx:24` returns `params.toString()` without a leading `?`, producing hrefs like `/projectstype=residential` and `/projectsroom=living-room` (17 distinct dead links). | `/projects` → click any Type or Room filter chip → 404. |
| 3 | Major | **Hydration error on every page** — React logs "In HTML, `<main>` cannot be a child of `<html>`" + "Hydration failed because the server rendered text didn't match"; DOM ends up with two nested `<main>` elements; cascades into `NotFoundError: insertBefore/removeChild` on navigation. | Open any page with devtools console; observed on all 58 crawled routes. |
| 4 | Major | **Duplicate React key on home** — "two children with the same key … seed-proj-downtown-hotel-lobby-backlit-g2.webp" (FeaturedProjects reuses one media asset for two slides). | `/` → console. |
| 5 | Major | **Payload admin login page errors** — "mounting a new Router when a previous one has not first unmounted", plus insertBefore/removeChild failures. | `/admin` (redirects to login) → console. |
| 6 | Major | **Product-detail h1 is hydration-dependent** — immediately after load the `<h1>` can be absent while React rebuilds the tree from the hydration crash (#3); stable after hydration settles. | `/products/pvc-wall-panels/classic-marble-pvc-panel`, query `h1` before hydration completes. |
| 7 | Minor | **FAQ `<summary>` has no `aria-expanded` until first interaction** — state is conveyed natively via `<details open>`, but the mirrored `aria-expanded` attribute only appears after the first click (inconsistent for SR users). | `/products/pvc-wall-panels`, closed FAQ. |
| 8 | Minor | **sitemap.xml covers only `/products` routes** — `/`, `/quote`, `/solutions/*`, `/projects`, `/trade`, `/custom-studio`, `/about`, `/contact`, `/samples`, `/consultation` are all absent. | `curl localhost:3000/sitemap.xml`. |
| 9 | Note | **Cold-compile flakiness in dev** — first-ever request to a route occasionally returns 404 (`/samples`) or 500 (`/quote?category=…`) while Turbopack compiles; all return 200 once warm. Re-verify in production build before treating as real. | Cold dev server → first fetch. |
| 10 | Note | **Console "Failed to load resource: 404"** on some routes (tracked in `qa/link-audit.json`); likely favicon/prewarm noise — needs one manual look. | see JSON. |

## Gate results

| Gate | Result |
|---|---|
| `qa/check-links.mts` crawl | Ran 3×; final run (warm server): 58/58 routes render `<main>`; 1 route renders 404 content (`/solutions`); 73 dead-link + 38 console issues — all attributable to defects #1, #2, #3–#5, #10. Raw data: `qa/link-audit.json`, `qa/link-audit-report.md`. Exit code 1 = issues found (expected). |
| Forms matrix (`e2e/qa-forms-matrix.spec.ts`) | Against the healthy :3000 tree all 12 tests passed. After the session's :3000 server wedged, a second dev server came up on :3001 against a moving WIP tree (other agents' uncommitted changes); final run there: **9 passed, 4 failed**, triage: 3 were test-harness bugs now fixed (header "Request a Quote" nav link shadowing the product CTA via `.first()`; strict-mode violation from the duplicate-`<main>` DOM bug #3; 404-marker check not stripping `<script>` flight data); 1 appears to be a **real regression in the WIP tree** — with JS disabled the quote form's step-1 input is no longer visible (progressive-enhancement/no-JS form changed). Re-verify on a settled tree. Green coverage on :3000 earlier: honeypot ×4, validation errors, upload rejection (wrong type + oversize, quote & trade), no-JS quote + contact submissions with Payload cleanup, CTA→prefill (quote wizard seeds product + category selects; Book-a-designer → /consultation?type=showroom 200; Get-this-look links all resolve to real products). |
| A11y pass (`e2e/qa-a11y.spec.ts` → `qa/a11y-report.md`) | 4/4 pass. `@axe-core/playwright` is not installed → manual checks: single h1 (home, product, quote), alt text (35/35 on home), keyboard focus-visible styles, labelled radiogroup + dialog, all quote inputs labelled, FAQ `<details>` toggling, computed contrast (OKLab-aware) — body copy min 12.43:1, headings min 16.03:1. Notes recorded for #7. |
| Visual smoke (`e2e/qa-visual.spec.ts`) | 22 screenshots in `qa/screenshots/` (11 routes × 1440/390), for human review — no pixel diffs. |
| `npx vitest run` | **124/124 passed** (15→19 files; other agents added unit tests in parallel). |
| `npx tsc --noEmit` | Clean for all QA files. Pre-existing errors remain in `.next/types/validator.ts` (4), `components/ui/CursorPreview.tsx` (2), and `e2e/samples.spec.ts` (1, added by another agent) — identical baseline before my changes. |
| Full existing e2e suite re-run | **Not completed** — the original :3000 server wedged mid-session (0% CPU, unresponsive; not killed per instructions) and a second server came up on :3001 against a moving WIP tree. Suite was green earlier in the session on :3000; recommend one clean `npx playwright test` pass once the tree settles. |

## Harness notes

- `qa/check-links.mts` — crawls sitemap + static routes + all 12 solution slugs via Playwright; asserts `<main>`, collects console errors, verifies every internal `<a href>` by fetch. **Dev-server quirk handled:** Next dev embeds the not-found page in every response's `<script>` flight data, so 404 detection strips `<script>` blocks before matching the "went missing from the blueprint" marker (see `e2e/solutions.spec.ts` for the same quirk).
- Forms-matrix submissions create real Payload docs; everything created is deleted in `afterAll` (pattern from `e2e/trade.spec.ts`).
