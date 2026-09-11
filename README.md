# PKEE Constructions — Website

Marketing + catalog site for PKEE Constructions (360 Keewatin St, Winnipeg, MB) —
premium decorative building materials. Built with **Next.js 16 (App Router) ·
TypeScript strict · Tailwind v4 · Payload CMS 3 · Postgres**. Leads are
delivered to the client via direct WhatsApp chat (the business number in
`lib/site.ts`). Not
ecommerce: every conversion flows into quote / consultation / trade application.

## Setup

```bash
npm install
cp .env.example .env        # fill in values (never commit .env)
npm run db:start            # embedded project-local Postgres (scripts/db.mjs)
npm run payload migrate     # create schema
npm run dev                 # starts embedded DB (if not running) + Next dev on :3000
```

Seeding (dev/staging only, refuses to run with NODE_ENV=production and
refuses a non-local DATABASE_URL unless ALLOW_PROD_SEED=1):

```bash
node scripts/seed.mjs   # idempotent; generates its own placeholder media
```

Then open `http://localhost:3000/admin` and log in. (If seeded media
binaries are missing in a fresh checkout, re-run the seed.)

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Embedded DB + Next dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:start` / `db:stop` / `db:status` | Embedded Postgres control |
| `npm run payload migrate` | Apply Payload/Postgres migrations |
| `npm run generate:types` | Regenerate `payload-types.ts` |
| `npm run check` | Biome + `tsc --noEmit` (quality gate) |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright money-path tests |
| `node qa/check-links.mts` | Full-site link/route audit (dev server on :3000) |

## Going to production (Vercel)

Vercel deploys `main` on every push. Before pointing the real domain at it:

- [ ] Set env vars in the Vercel project: `DATABASE_URL` (hosted Postgres,
      e.g. Neon/Supabase), `PAYLOAD_SECRET`, `PAYLOAD_PUBLIC_SERVER_URL`
      (the production URL), `NEXT_PUBLIC_SITE_URL`, `PUBLIC_CONTACT_EMAIL`,
      `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`,
      and `NEXT_PUBLIC_ANALYTICS_ID` (optional — no-op when unset).
      Never commit `.env`.
- [ ] Run `npm run payload migrate` against the production database (one-off,
      or wired as a release step).
- [ ] Media storage: media is served from **Supabase Storage** via
      `@payloadcms/storage-s3` (wired in `payload.config.ts` for the `media`
      collection only). Set the `S3_*` env vars from `.env.example`
      (`S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`,
      `S3_ENDPOINT` = `https://<project-ref>.supabase.co/storage/v1/s3`,
      `S3_REGION`). When `S3_BUCKET` is unset, Payload logs a boot warning
      and media falls back to the local disk (local dev/CI only).
      **After switching, re-run the seed against the production DB
      (`ALLOW_PROD_SEED=1 node scripts/seed.mjs`)** — or re-upload — so media
      rows are re-created with S3 URLs; then verify `GET /api/media/file/...`
      and `/_next/image` return 200. The Supabase host is already allowlisted
      in `next.config.ts` `images.remotePatterns`.
- [ ] Cloudflare Turnstile: create a site key pair and add the production
      domain to the widget's allowed hostnames. Still recommended on
      production — leads are stored in Payload and handed off via the
      confirmation page's WhatsApp deep link, so nothing depends on email
      delivery.
- [ ] Attach the custom domain and confirm `https` + `NEXT_PUBLIC_SITE_URL`
      match (metadata/OG tags use it).
