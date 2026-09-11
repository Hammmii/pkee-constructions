# Production Admin + Deployment Audit — PKEE Constructions

- **Date:** 2026-09-11
- **Target:** https://pkee-constructions-hammad-sikandars-projects.vercel.app (Payload 3.88 embedded in Next 16.3.4, Vercel, database reportedly Supabase Postgres)
- **Scope:** READ-ONLY. No credentials were guessed or submitted; only unauthenticated GETs and one headless-browser page load were performed.
- **Login screenshot:** `qa/prod-screenshots/admin-login.png`

## TL;DR

The admin **login page is healthy** (renders, zero console errors, all assets 200),
and the **database is up** (public API returns real seeded docs). The production
site is nonetheless **visually broken**: every image 500s/400s because media is
served from Vercel's ephemeral filesystem and the seed binaries were never in
the deploy. Media storage, migration automation, and upload persistence are
the real deployment risks.

## 1. Reachability — /admin

| Check | Result |
|---|---|
| `GET /admin` | 200, `x-matched-path: /admin/[[...segments]]`, `x-powered-by: Next.js, Payload` |
| Redirect chain | Client-side (Next router) soft-redirect to `/admin/login` — no HTTP 3xx; headless Chromium landed on `/admin/login` (status 200) |
| Login page render | Email + Password + "Forgot password?" + Login button render; title "Login - Payload" |
| Assets | All 24 CSS/JS/favicon URLs referenced by the HTML → **HTTP 200** |
| Console errors (Chromium) | **none** |
| Failed network requests | **none** |
| `/api/payload-init` | 404 `Route not found` — expected on Payload 3.88 (init rides in the RSC payload, not a separate endpoint) |
| Screenshot | `qa/prod-screenshots/admin-login.png` (desktop 1440×900) |

Note: `curl -I` shows a 200 with no redirect because Payload's admin catch-all
serves the login shell for unauthenticated RSC requests; the redirect to
`/admin/login` happens in the client router.

## 2. Public API health

| Endpoint | Status | Notes |
|---|---|---|
| `GET /api/solutions?limit=1` | 200 | Real seeded docs returned from the prod DB (e.g. id 12 "Prayer Room"); DB is reachable and migrated (at least `20260910_193810_init`) |
| `GET /api/media/file/seed-sol-prayer-room-1.webp` | **500** | `{"errors":[{"message":"Something went wrong."}]}` — see F-1 |
| `GET /api/media/file/seed-sol-prayer-room-1-480x600.webp` (size) | **500** | same |
| `GET /_next/image?url=%2Fapi%2Fmedia%2F...&w=640&q=75` | **400** | next/image optimizer upstream fetch fails → every `<Image>` on the site is broken in prod |
| `GET /solutions` (HTML) | 200 | page shell fine; its `/_next/image` srcsets all point at the 500ing media API |
| `GET /api/leads`, `/api/globals/main-nav`, `/api/payload-access` | 404 | expected — those slugs/routes don't exist (intake collections are `quotes` etc., created via local API only) |

## 3. Findings

### F-1 — CRITICAL: all site media broken in production (local-disk adapter on Vercel)

- **Evidence:** media API returns 500 for every file (all sizes); `/_next/image` returns 400 for every image URL; screenshots in `qa/prod-screenshots/*.png` show image-less pages.
- **Root cause:** `collections/Media.ts` uses the default local-disk upload adapter (`staticDir: "./media"`). `media/` is **untracked** in git (`git ls-files media` → 0 files). On Vercel the filesystem is the build output only — the seed binaries (generated into `os.tmpdir()`/`./media` on whoever ran the seed) don't exist at runtime, so Payload throws when streaming the file → 500. New CMS uploads in prod would also land on an ephemeral disk and vanish on the next deploy.
- **Fix:** wire a remote storage adapter before launch (this is already flagged in README's production checklist and `.env.example` S3_* placeholders):
  1. `npm i @payloadcms/storage-s3`
  2. In `payload.config.ts`:
     ```ts
     import { s3Storage } from "@payloadcms/storage-s3";
     // inside buildConfig:
     plugins: [
       s3Storage({
         collections: { media: true },
         bucket: process.env.S3_BUCKET,
         config: {
           credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
           endpoint: process.env.S3_ENDPOINT, // Supabase Storage / R2 / S3
           region: process.env.S3_REGION,
           forcePathStyle: true, // required for many S3-compatible endpoints
         },
       }),
     ],
     ```
  3. Set the `S3_*` env vars in Vercel.
  4. Re-run the seed (or a small re-upload script) so DB rows get S3 URLs; verify `GET /api/media/file/...` returns 200.
  - Alternative interim: ship the 16 MB of seed binaries in `media/` (commit or a build step copying them in) — works but keeps the ephemerality problem for new uploads. Not recommended.

### F-2 — HIGH: no automated migration step on deploy; second migration's prod state unknown

- **Evidence:** `package.json` has no `migrate`/`postbuild` script; no `vercel.json`; no `.github/workflows`. Migrations exist: `migrations/20260910_193810_init` (schema) and `migrations/20260910_212226` (adds `dealer_applications.reference` NOT NULL + backfill, `consultations.source` enum + index). The prod DB clearly has the init schema (seeded docs served), but nothing proves `20260910_212226` was applied — any code path touching those columns on an un-migrated prod DB would 500 (NOT NULL column missing → insert fails).
- **Fix:** run and then automate.
  - One-off against Supabase (from a trusted machine, env vars from the untracked `.env` — never commit):
    ```bash
    cd pkee
    # .env: DATABASE_URL=postgres://...supabase...  PAYLOAD_SECRET=...
    npm run payload migrate        # applies pending migrations (incl. 20260910_212226 if missing)
    npm run payload migrate:status # verify none pending  (Payload 3: `payload migrate:status`)
    ```
  - Durable options (pick one):
    - **GitHub Action** on push to `main` (recommended; keeps Vercel build untouched):
      ```yaml
      # .github/workflows/migrate.yml
      on: { push: { branches: [main] } }
      jobs:
        migrate:
          runs-on: ubuntu-latest
          steps:
            - uses: actions/checkout@v4
            - uses: actions/setup-node@v4
              with: { node-version: 20, cache: npm }
            - run: npm ci
            - run: npm run payload migrate
              env:
                DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
                PAYLOAD_SECRET: ${{ secrets.PAYLOAD_SECRET }}
      ```
      Caveat: on push-to-migrate, a deploy that needs the new schema can race ahead of the migration; pair with "backwards-compatible migrations" discipline or run the action on `release` publishes.
    - Or a Vercel "Ignored Build Step"/release-phase equivalent is not natively ordered-before-traffic; if used, keep it idempotent (`payload migrate` is).

### F-3 — MEDIUM: production seed state is a placeholder dump, flagged for replacement

- **Evidence:** every media row in prod has `placeholder: true` and "[SEED-PLACEHOLDER]" alt/caption; `CONTENT-GAPS.md` tracks this. Also, `scripts/seed.mjs` only refuses to run when `NODE_ENV=production` — it will happily write seed content into a **production** database if run with `NODE_ENV` unset. That is presumably how prod was populated, but it means anyone re-running it locally with the prod `DATABASE_URL` overwrites prod content.
- **Fix:** add an explicit allow-list guard in `seed.mjs` (e.g. refuse unless `ALLOW_PROD_SEED=1`), and treat CONTENT-GAPS replacement + F-1 storage swap as one pre-launch task.

### F-4 — LOW/OK: build/runtime config

- `next.config.ts` uses `withPayload(nextConfig)`; **no** `output: "export"` / edge runtime issues — Payload routes run on the Node runtime (`x-powered-by: Next.js, Payload` confirms). Admin API CORS headers present.
- `payload.config.ts:25` throws if `DATABASE_URL` is missing — good; build on Vercel would fail loudly, so the deployed build has it. `PAYLOAD_SECRET` falls back to `""` (`payload.config.ts:70`) — Payload tolerates it, but cookies will be weakly signed. Confirm a long random `PAYLOAD_SECRET` is set in the Vercel project (can't verify server-side from outside).
- Cookie/domain: no custom cookie config in repo, so Payload uses host cookies — fine behind the Vercel proxy; no SameSite/domain action needed.
- `next.config.ts` `images` config has no `remotePatterns` — fine while media is same-origin `/api/media/file/...`; **add the Supabase Storage host once F-1 moves media to S3/Supabase Storage** (e.g. `remotePatterns: [{ protocol: "https", hostname: "<ref>.supabase.co" }]`).
- Custom admin views (`components/admin/{dashboard,pipeline,activity}.tsx`) read via `initPageResult.req.payload` (server-side, uses the request's own Payload instance) — they don't depend on the REST API or on non-empty collections; empty lead collections render zero-states. No failure mode found there.

## 4. Production deployment runbook (verified against this repo)

> Kept here rather than appended to README because steps 3–4 require code
> (S3 adapter) that does not exist yet; README's checklist stays authoritative.

1. **Env (Vercel project settings):** `DATABASE_URL` (Supabase pooled URL, `?pgbouncer=true&connection_limit=1` recommended for serverless), `PAYLOAD_SECRET` (≥32 random chars), `PAYLOAD_PUBLIC_SERVER_URL`/`NEXT_PUBLIC_SITE_URL` = the public URL, `PUBLIC_CONTACT_EMAIL`, Turnstile keys, then `S3_*` after step 3.
2. **Migrations:** one-off `npm run payload migrate` against Supabase (see F-2), then wire the GitHub Action so every merge applies pending migrations.
3. **Media:** add `@payloadcms/storage-s3` (F-1), re-seed/re-upload, add `images.remotePatterns` for the storage host, verify `/_next/image` returns 200.
4. **Verify:** `/admin/login` renders (screenshot in `qa/prod-screenshots/`), login as staff, dashboard/pipeline/activity load, submit one quote on the live site and watch it appear in the admin pipeline, `GET /api/solutions?limit=1` 200, all `/_next/image` 200.
5. **Domain cutover:** attach custom domain, confirm `NEXT_PUBLIC_SITE_URL` matches, re-issue Turnstile for the new hostname.

## 5. What was NOT tested (and why)

- Login submission / any authenticated admin area — no credentials; out of read-only scope.
- Whether migration `20260910_212226` is applied — requires authenticated DB access; command provided in F-2.
- Form POSTs (quote/trade/consultation) — would write to the prod DB; code paths use local API with `overrideAccess` and are covered by e2e in CI instead.
