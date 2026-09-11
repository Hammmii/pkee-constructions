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

Seeding (dev/staging only, refuses to run with NODE_ENV=production):

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
- [ ] Media storage: uploads currently go to the local disk, which is
      ephemeral on Vercel. Wire a Payload S3 storage adapter and set the
      `S3_*` env vars (reserved in `.env.example`) before accepting CMS
      uploads in production.
- [ ] Cloudflare Turnstile: create a site key pair and add the production
      domain to the widget's allowed hostnames. Still recommended on
      production — leads are stored in Payload and handed off via the
      confirmation page's WhatsApp deep link, so nothing depends on email
      delivery.
- [ ] Attach the custom domain and confirm `https` + `NEXT_PUBLIC_SITE_URL`
      match (metadata/OG tags use it).
