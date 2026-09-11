# M11 Performance Gate — Lighthouse Audit + INP Static Risk Pass

- **Audited commit:** `cc1cfe2` (fix(M11): solutions index page, projects filter links, no-JS wizard fallback, craft-process key dedupe)
- **Date:** 2026-09-11
- **Method:** detached worktree at HEAD → `npm ci` → `npm run build` → `npx next start -p 3100` → Lighthouse 13.4.1 (mobile = default form factor + 4× CPU/1.6 Mbps throttling; desktop = `--preset=desktop`), `--only-categories=performance,accessibility,best-practices,seo`, `--chrome-flags="--headless=new --no-sandbox"`. Raw JSON: `qa/lighthouse/*.mobile.json` / `*.desktop.json`.
- **Note:** another agent was concurrently fixing a hydration bug on a dirty tree; all numbers below are from clean HEAD `cc1cfe2` in the worktree.
- **Caveat (local-only):** this build serves Payload seed media from `/api/media/file/*`, which 400/500s locally because seed binary files aren't present in this environment. That means **image bytes in the lab runs are under-counted** (broken images) and `errors-in-console` fails on most routes are environment artifacts, not code bugs. All image-failure URLs are `/_next/image?url=%2Fapi%2Fmedia%2Ffile%2F...` → re-verify on a host with real media before shipping conclusions.

## Score table (0–100)

| Route | Perf M | Perf D | A11y M/D | BP M/D | SEO M/D | LCP M (lab) | CLS M | TBT M |
|---|---|---|---|---|---|---|---|---|
| `/` (home) | 90 | 96 | 93/93 | 96/96 | **83**/83 | 3.7s | ~0 | 0.01s |
| `/products` | 90 | 99 | 95/95 | 96/96 | 100/100 | 3.7s | 0 | 0.01s |
| `/products/pvc-wall-panels` | 87 | 99 | 96/96 | 96/96 | 92/92 | 4.0s | 0 | 0.01s |
| `/products/pvc-wall-panels/classic-marble-pvc-panel` | 87 | 97 | 93/96 | 96/96 | 92/92 | 4.1s | 0 | 0.01s |
| `/quote` | 87 | 100 | 96/96 | 100/96 | 100/100 | 4.0s | 0 | 0.01s |
| `/solutions` | 90 | 99 | 96/96 | 96/96 | 100/100 | 3.6s | 0 | 0.01s |
| `/projects` | 86 | 99 | 94/94 | 96/96 | 100/100 | 4.1s | 0 | 0.02s |
| `/contact` | 91 | 100 | 97/97 | 100/96 | 100/100 | 3.5s | 0 | 0.01s |

(M = mobile lab, D = desktop lab. TBT is the lab proxy for INP — all ≤ 20 ms, excellent.)

### Routes scoring < 90, and why

1. **Home SEO 83 (both form factors):** `document-title` and `meta-description` audits fail. Root cause: `app/(site)/page.tsx:72-75` — `generateMetadata` returns `home?.seo?.metaTitle ?? undefined`, and the local/seed CMS `home` document has no SEO fields, so no `<title>`/description is emitted. Fix is content (populate home SEO in Payload), with an optional code fallback title.
2. **Mobile perf 86–91 across all routes:** two dominant, shared causes:
   - **`redirects` opportunity ≈ 600 ms on every mobile run** — every response carries `Critical-CH: Sec-Prefers-Color-Scheme`, which forces a client-hints reload that Lighthouse counts as a redirect (~0.6 s under mobile throttling, ~170 ms desktop). This is Next 16 client-hints behavior; worth confirming whether it also fires on Vercel with `Accept-CH`.
   - **Lab LCP 3.5–4.1 s** is almost entirely throttled load of the LCP *text* element (TTFB is 11–270 ms, element render delay 120–240 ms; the gap is the Critical-CH double navigation + font render blocking under 4× CPU throttle). Desktop LCP is 0.5–1.3 s everywhere. CLS is 0 (0.024 on desktop `/quote` only — minor, likely the Turnstile iframe).
   - Remaining perf delta: `unused-javascript` 300–590 ms (see below).

## Page weight (transferred, local lab where seed images 400)

| Route | Mobile | Desktop |
|---|---|---|
| home | 418 KB | 496 KB |
| products | 441 KB | 540 KB |
| category | 439 KB | 522 KB |
| product detail | 448 KB | 557 KB |
| quote | 462 KB | 514 KB |
| solutions | 422 KB | 512 KB |
| projects | 445 KB | 546 KB |
| contact | 895 KB | 951 KB |

`/contact` is ~2× everything else — investigate (likely the map embed / Turnstile / a heavy image). Largest single scripts on home: 71 KB + 45 KB + 44 KB chunks. Total requests ≈ 50 per page.

## Top opportunities per route (mobile, deduped — they are the same 3 everywhere)

1. **Eliminate Critical-CH reload** (~600 ms × 8 routes): `Accept-CH`/`Critical-CH: Sec-Prefers-Color-Scheme` response headers cause a redirect-equivalent navigation. Biggest single mobile win.
2. **Reduce unused JavaScript** (300–590 ms × 8 routes): worst chunks ~52–69% unused (`0-_5q-bedv_lk.js` 71 KB/35% waste, `3j4nts4w7vo6j.js` 44 KB/69% waste, `3qdywc4m1juhd.js` 45 KB/52% waste). Candidates: code-split the quote wizard and lightbox islands so GSAP/NumberFlow don't load on catalog/list pages.
3. **Homepage forced reflow** (`forced-reflow-insight` fires on home): a layout-forcing call in chunk `0-_5q-bedv_lk.js` during load — pair with the hydration fix in flight; re-measure after.

## LCP image discovery

- Home hero image **is** discoverable: server-rendered `<link rel="preload" as="image" imageSrcSet=... fetchPriority="high">` present in HTML; `lcp-discovery-insight` shows no lazy-load penalty.
- Home LCP element is actually the hero **copy paragraph**, not the image — text LCP under font preload is fine.
- All non-hero images ship `loading="lazy" decoding="async"` with correct `sizes`/`srcSet` — verified on `/products`, category, product detail.

## Font loading strategy

`next/font` self-hosted subsets with `rel="preload" ... as="font" crossorigin` for the two primary faces (48 KB + 45 KB woff2), `font-display` handled by next/font. Two preloaded faces is within budget; remaining 8 woff2 files load on demand. Strategy is correct; no action.

## Third-party / animation library cost (from production chunks)

| Library | Chunk (gz-naive raw) | Size | Notes |
|---|---|---|---|
| GSAP (+ScrollTrigger) | `3j4nts4w7vo6j.js` | 116 KB | Largest animation cost; 69% unused on home — load per-island, not globally |
| Lenis | `33ihxt7uzi3-z.js` | 36 KB | Small; fine |
| NumberFlow | `44m_lsa6i6r7z.js` | 36 KB | Only needed where counters render |

## INP static risk cross-check (every scroll/pointer handler in `components/`)

| Component | Handler | Pattern | Risk |
|---|---|---|---|
| `ui/Magnetic.tsx` | `onPointerMove` | motion values + `useSpring` — **no setState** | Low. Layout read (`getBoundingClientRect`) per pointermove is the only cost; fine on fine-pointer only |
| `ui/CursorPreview.tsx` | `onPointerMove` | shared motion values (`sharedX.set`) — **no setState** | Low. Correctly gated to `pointer: fine` + reduced-motion |
| `layout/HeaderClient.tsx` | window `scroll` | rAF-throttled (`ticking` flag), setState only on threshold change | OK — textbook pattern |
| `ui/BeforeAfterSlider.tsx` | `onPointerMove` while dragging | **`setPosition` (setState) every pointermove** + `getBoundingClientRect` per event | **Flagged.** Only while actively dragging a small slider, so real-world impact is low, but it's the one true setState-per-event handler. Consider a motion value + drag gesture |
| `about/StatsBand.tsx`, `marketing/WhyChooseUs.tsx` | rAF loops | run only during in-view count-up, then cancel | OK |
| `marketing/Preloader.tsx` | rAF | short-lived boot animation | OK |
| `layout/MobileMenu.tsx` | rAF | single focus call | OK |
| `marketing/FeaturedProjects.tsx` | `onPointerMove` | routes into CursorPreview-style shared motion values | Low |
| `catalog/ProductLightbox.tsx` | `keydown` listener | discrete events only | OK |

**Verdict:** no high-risk INP handlers. One flag: `BeforeAfterSlider.tsx` setState-per-pointermove (mitigation optional; it's drag-bound, not hover-bound). Lab TBT ≤ 20 ms everywhere backs this up. INP itself is field-only — no CrUX data exists for this domain yet.

## Link crawl (zero-404 cross-check) — PASS with one env caveat

`AUDIT_BASE_URL=http://localhost:3100 node qa/check-links.mts` initially reported failures because **`sitemap.xml` emits absolute `http://localhost:3000` locs** (build-time `SITE_URL` env pointed at the dev port in `.env`). Two results:

- Direct verification of **all 36 sitemap routes against :3100 → 0 non-200s**, including `/solutions` (exists per commit `cc1cfe2`).
- The check-links crawler should resolve loc URLs relative to `BASE` (or the sitemap should emit relative/robust URLs) so audits aren't port-dependent — follow-up item.

## Follow-ups (not blocking, owner: M11 hardening)

1. Populate home SEO fields in Payload (title + meta description) — fixes SEO 83.
2. Re-run mobile audits on Vercel to isolate the Critical-CH redirect artifact from real production behavior.
3. Lazy-load GSAP/NumberFlow islands; trim the 3 worst JS chunks.
4. Investigate `/contact` ~950 KB page weight.
5. Optional: convert `BeforeAfterSlider` to motion-value drag; make `check-links.mts` base-port independent.
