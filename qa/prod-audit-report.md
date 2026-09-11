# PKEE Constructions — Production Audit Report

- **Date:** 2026-09-11
- **Target:** https://pkee-constructions-hammad-sikandars-projects.vercel.app/ (deploys from `main`)
- **Method:** Playwright (Chromium) crawl, 16 routes × 2 viewports (1440×900, 390×844), network + console capture, full-page screenshots in `qa/prod-screenshots/`.
- **Scope:** read-only audit. No app code changed.

---

## Executive summary

1. **ALL catalog imagery is broken in production.** Every image ships as `/api/media/file/seed-*.webp`, and the live origin returns **HTTP 500** with Payload's `{"errors":[{"message":"Something went wrong."}]}` for every media binary. The `next/image` optimizer then fails with **HTTP 400** on every render. Root cause: the database was migrated to hosted Postgres (Supabase) but media **binaries still live on the Payload local-disk adapter** — Vercel's ephemeral filesystem has no seed files, so media rows exist but bytes are gone. This was a documented pre-launch risk (`.env.example`: "Production checklist: wire a Payload S3 storage adapter before launch so Vercel's ephemeral filesystem doesn't lose uploads").
2. **Canonical / sitemap / robots / OG URLs point to a different host** than the live deployment (`https://pkee-constructions.vercel.app` vs `…-hammad-sikandars-projects.vercel.app`). `NEXT_PUBLIC_SITE_URL` is set to the old alias on Vercel. Both hosts currently resolve (the alias serves an older build), splitting SEO signals.
3. **Mobile fixed conversion bar obscures form content** — `body` has `padding-bottom: 0` and no `scroll-padding-bottom`; the `h-16` fixed bar covers labels/fields at the natural fold on `/quote` (verified live, not a screenshot artifact).
4. No horizontal overflow on any route; no other z-index collisions found on desktop. Analytics is correctly inert (no tracker script).

---

## 1. Issue table

| # | Severity | Route(s) | Evidence | Suspected root cause | Suggested fix (file) |
|---|----------|----------|----------|----------------------|----------------------|
| 1 | **Critical** | All routes with media: `/`, `/products`, `/products/*/*`, `/projects`, `/solutions`, `/solutions/*`, `/custom-studio` | `/api/media/file/seed-page-home-hero-1.webp` → 500; `/_next/image?url=%2Fapi%2Fmedia%2Ffile%2F…` → 400; 15 broken imgs on `/` alone | Media rows in Supabase Postgres, binaries on local-disk adapter; Vercel ephemeral disk empty → Payload 500 on file read; next/image upstream failure → 400 | Wire a remote storage adapter (`@payloadcms/storage-s3` or Supabase storage) in `payload.config.ts`; re-seed/upload binaries; env keys already stubbed in `.env.example` (S3_*) |
| 2 | **High** | All pages (meta) | Homepage `<link rel="canonical" href="https://pkee-constructions.vercel.app/"/>`, `og:url`/`og:image` same host; `/sitemap.xml` + `/robots.txt` emit `https://pkee-constructions.vercel.app` | `NEXT_PUBLIC_SITE_URL` on Vercel points at the old project alias, not the live deployment URL (or the eventual `www.pkeeconstructions.ca`) | Set `NEXT_PUBLIC_SITE_URL` to the canonical production domain in the Vercel project env (`lib/seo/metadata.ts:8 getBaseUrl` reads it; fallback in code is `https://www.pkeeconstructions.ca`) |
| 3 | **High** | `/quote` (mobile), any long form page (mobile) | Fixed 3-cell bar (`z-40`, `h-16`) covers the `PHONE *` label at the natural viewport fold; `getComputedStyle(document.body).paddingBottom === "0px"`; verified with in-viewport screenshot | `FloatingActions` bar is `fixed bottom-0` but no page-level compensation (`scroll-padding-bottom` / spacer only guards the footer) | Add `scroll-padding-bottom` (≥4rem) on `html` and/or `pb-16 md:pb-0` on the page container; bar in `components/layout/FloatingActions.tsx:19` |
| 4 | **Medium** | `/products/[category]/[slug]` (mobile) | Sticky "Request a Quote / Request a Sample" card (`sticky bottom-6`, `app/(site)/products/[category]/[slug]/page.tsx:246`) overlaps the gallery thumbnail strip; thumbnails are visually cut behind the card | Sticky bottom-anchored CTA card shares the right column with gallery thumbs; no `pb` offset above the card | Add bottom padding to the gallery column or move the card below the gallery in the DOM on mobile (`app/(site)/products/[category]/[slug]/page.tsx`) |
| 5 | **Medium** | `/`, `/custom-studio`, `/solutions` | Large blank vertical gaps where hero/category/slider images should be; LCP hero absent → mobile home LCP is text-only; CLS risk when/if images are restored without reserved space | Downstream of #1; some sections don't reserve aspect-ratio boxes for missing media | After fixing #1, re-run Lighthouse; add `aspect-*`/sizes to media containers (`components/marketing/*`, hero in `app/(site)/page.tsx`) |
| 6 | **Medium** | `/custom-studio` | "Drag the transformation" before/after slider renders as an empty box with the drag handle pinned at the top edge (images 0-height) | Slider handle assumed image intrinsic height; with broken upstreams the container collapses | Same as #1 + make slider track a fixed-aspect container (component under `components/` — BeforeAfter slider) |
| 7 | **Low** | `/products/*` detail pages | Literal alt text "[SEED-PLACEHOLDER] Linea LED Profile System" visible where images fail | Placeholder media from the seed script renders its flag string as alt text in production | Acceptable pre-launch, but replace seed media with real assets before marketing the URL (seed script in repo, see `README.md` seed notes) |
| 8 | **Low** | `/quote` (mobile) | "GET A QUOTE" is the first cell of the fixed bar while the user is already on `/quote` | Redundant self-link in `FloatingActions.tsx` | Optionally suppress the Quote cell on `/quote`/`/consultation` routes |
| 9 | **Low** | Whole site (SEO) | Sitemap `changefreq`/`priority` emitted; `robots.txt` fine — but sitemap host mismatch (see #2) makes submitted sitemap URLs point at the old alias | `app/sitemap.ts` uses `getBaseUrl()` — correct code, wrong env | Fix env per #2 |

## 2. Failed-request log (classification)

All unique failing request classes (full list captured during crawl; ~150 failures, all same two classes):

| Class | Example URL | Status | Classification |
|-------|-------------|--------|----------------|
| A | `/api/media/file/seed-page-home-hero-1.webp` | 500 (Payload "Something went wrong.") | **(b) media row exists, binary gone** — Supabase DB + local-disk adapter on Vercel |
| B | `/_next/image?url=%2Fapi%2Fmedia%2Ffile%2Fseed-*.webp&w=…&q=75` | 400 | **(d) next/image loader error** — downstream of class A (upstream 500) |
| C | `*?_rsc=…` navigation prefetches | ERR_ABORTED | Benign — Next.js RSC prefetch aborts during crawl, not a defect |

**No** requests to `localhost`/`127.0.0.1` and **no** Supabase storage URLs were observed in network traffic — the owner's "using Supabase" refers to the database only; media was never migrated to object storage. (`.env.example:18` still ships `PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000`, which is a latent foot-gun if any code starts prefixing media URLs with it, but nothing currently does.)

**Code paths that build media URLs:**
- `lib/seo/JsonLd.tsx:12 mediaAbsoluteUrl()` — relative `media.url` → `absoluteUrl()` → host from `getBaseUrl()`.
- `lib/seo/metadata.ts:8 getBaseUrl()` — reads `NEXT_PUBLIC_SITE_URL`; falls back to `https://www.pkeeconstructions.ca`.
- `next.config.ts` — `images.formats/qualities` only; no remote patterns (fine — media is same-origin `/api/media/*`).
- DB stores `media.url` as relative `/api/media/file/<filename>` → served by Payload's local adapter → 500s when the file isn't on disk.

## 3. Page-by-page crawl results

| Route | HTTP | Broken imgs (d/m) | Console errs (d/m) | H-overflow | Notes |
|-------|------|--------------------|--------------------|-----------|-------|
| `/` | 200 | 15 / 16 | 16 / 17 | no | Hero image 500; alt text visible |
| `/products` | 200 | 12 / 3 | 12 / 3 | no | All cards show "USED_PLACEHOLDER" |
| `/products/led-profiles/linea-led-profile-system` | 200 | 5 / 5 | 5 / 5 | no | Sticky CTA overlap (issue 4) |
| `/products/fireplaces/ember-3d-led-fireplace` | 200 | 4 / 4 | 4 / 4 | no | — |
| `/projects` | 200 | 6 / 6 | 6 / 6 | no | — |
| `/solutions` | 200 | 12 / 6 | 12 / 7 | no | 12 solution cards broken |
| `/solutions/bathroom`, `/solutions/bedroom` | 200 | 8/6, 5/5 | = imgs | no | Hero 1920w requests 400 |
| `/quote` | 200 | 0 / 0 | 0 / 0 | no | Mobile bar covers fields (issue 3) |
| `/trade`, `/samples`, `/consultation`, `/about`, `/contact` | 200 | 0 | 0 | no | Clean |
| `/custom-studio` | 200 | 5 / 6 | 4 / 5 | no | Slider collapse (issue 6) |

d = desktop 1440, m = mobile 390.

## 4. robots.txt / sitemap.xml in production

- `/robots.txt`: `Disallow: /admin`, `/design-system`; **`Sitemap: https://pkee-constructions.vercel.app/sitemap.xml`** — wrong host (live deployment is the `…-hammad-sikandars-projects` URL).
- `/sitemap.xml`: emits `https://pkee-constructions.vercel.app/` for every `<loc>` (same wrong host). Route set itself is complete (home, products, projects, solutions, quote, trade, …).
- Homepage `<title>` is correct ("PKEE Constructions | Premium Decorative Building Materials Winnipeg"); canonical/OG present but on the wrong host (issue 2); `og:image` points at the broken media endpoint (`…/api/media/file/seed-page-home-hero-1.webp` → 500).
- **Analytics:** no analytics/gtag/plausible/segment script in the production HTML — tracker correctly inert (`NEXT_PUBLIC_ANALYTICS_ID` unset).
- **Payload/DB errors:** no uncaught page errors in console; the only console noise is "Failed to load resource" for the 500/400 media classes. All HTML pages return 200.

## 5. Screenshot index (`qa/prod-screenshots/`)

- `desktop-home.png`, `mobile-home.png` — hero image absent; blank media bands
- `desktop-homeproducts.png`, `mobile-homeproducts.png` — placeholder card wall
- `desktop-homeproducts-*.png` (2 product details), mobile equivalents — sticky CTA overlap on mobile
- `desktop-homeprojects.png`, `mobile-homeprojects.png`
- `desktop-homesolutions.png`, `mobile-homesolutions.png`, `desktop-homesolutions-{bathroom,bedroom}.png`, mobile equivalents
- `desktop-home{quote,trade,samples,consultation,custom-studio,about,contact}.png` + mobile equivalents — quote/contact mobile show bar overlap
- `/tmp/pkee-audit/bar-check.png` — in-viewport proof of issue 3 (mobile `/quote`, bar at y=780 covering content)

## 6. Recommended fix order

1. Storage adapter for Payload (S3/Supabase) + re-upload binaries → fixes ~95% of failures (issues 1, 5, 6, 7).
2. Set `NEXT_PUBLIC_SITE_URL` to the real production domain in Vercel (issue 2, 9).
3. Mobile bar scroll padding (issue 3) and sticky CTA offset on product pages (issue 4).
4. Re-run Lighthouse + the money-path Playwright suite after 1–2.
