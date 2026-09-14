# Analytics Instrumentation — Browser Verification Report (M11)

Date: 2026-09-14 · Method: Playwright (chromium) against `next dev` on :3000 with
`NEXT_PUBLIC_ANALYTICS_ID=test-verify-123` · Queue read via `page.evaluate(() => window.pkeeAnalytics)`.
Verification only — no app code was modified.

## Gate behaviour

| State | Result |
|---|---|
| `NEXT_PUBLIC_ANALYTICS_ID` set | `window.pkeeAnalytics` populated on first tracked event |
| ID unset (restarted with plain `.env`) | `window.pkeeAnalytics` never created (stayed `undefined` across PDP, /quote, /contact, and a WhatsApp click); zero console/page errors |

## Event matrix

| # | Event | Page / trigger | Fired? | Payload correct? | Notes |
|---|-------|----------------|--------|------------------|-------|
| 1 | `product_view` | PDP `/products/led-profiles/linea-led-profile-system` | ✅ | ✅ `{product: "linea-led-profile-system", category: "led-profiles"}` | **Fires 2× per mount** (see Defect D1), incl. after reload |
| 2 | `quote_start` | `/quote` (no params) | ✅ | ✅ `{product: null, preselected: false}` | Fires 2× (D1) |
| 2 | `quote_start` | `/quote?product=linea-led-profile-system` | ✅ | ✅ `{product: "linea-led-profile-system", preselected: true}` | Fires 2× (D1) |
| 3 | `quote_complete` | `/quote/confirmation?ref=PK-2026-0008` (real lead submitted) | ✅ | ✅ `{reference: "PK-2026-0008"}` matches `?ref=` | Fires 2× (D1). Lead doc created and deleted after verification |
| 4 | `get_this_look_click` | `/projects/river-heights-marble-bath` | ✅ | ✅ `{source: "river-heights-marble-bath", href: "/quote?product=classic-marble-pvc-panel"}` | CTA label is "Request a quote" under a "Get this look" heading |
| 4 | `get_this_look_click` | `/solutions/bathroom` | ✅ | ✅ `{source: "bathroom", href: "/quote?product=classic-marble-pvc-panel"}` | |
| 5 | `whatsapp_click` | `/contact` | ✅ | ✅ `{source: "contact", href: "https://wa.me/14317883188?text=…"}` | |
| 5 | `phone_click` | `/contact` | ✅ | ✅ `{source: "contact", href: "tel:+14317883188"}` | |
| 5 | `email_click` | `/contact` | ✅ | ✅ `{source: "contact", href: "mailto:hello@pkeeconstructions.ca"}` | |
| 6 | `dealer_application` | `/trade/confirmation?ref=DA-2026-0005` (real application submitted) | ✅ | ✅ `{reference: "DA-2026-0005"}` | Fires 2× (D1). Doc created and deleted |
| 6 | `sample_request` | `/samples/confirmation?ref=SR-2026-0006` (real request submitted) | ✅ | ✅ `{reference: "SR-2026-0006"}` | Fires 2× (D1). Doc created and deleted |
| 6 | `consultation_booking` | `/consultation/confirmation?ref=CT-2026-0007` (real booking submitted) | ✅ | ✅ `{reference: "CT-2026-0007"}` | Fires 2× (D1). Doc created and deleted |
| 7 | `filter_use` | `/projects` — clicked "Residential" type chip | ✅ | ✅ `{param: "type", value: "residential", active: false, href: "/projects?type=residential"}` | Server-component `TrackClick` on filter links |
| 7 | `filter_use` | `/products?backlit=1` | ✅ | ✅ `{backlit: true, category/material/indoorOutdoor/properties/sort: null}` | Rendered by server page from URL state |
| 7 | `search` | `/products?q=panel` | ✅ | ✅ `{q: "panel", results: 6}` | |
| 8 | `whatsapp_click` | PDP "Ask about … on WhatsApp" | ✅ | ✅ `{source: "product:linea-led-profile-system", href: "https://wa.me/…"}` | |
| 9 | (gate off) | PDP + /quote + /contact + WA click, ID unset | ✅ no events, no `window.pkeeAnalytics`, no console/page errors | tracker is fully inert |

Pass rate: **12 of 12 wired events fire with correct payloads** (each also timestamped ISO-8601).
Every defect below is a duplication / coverage issue, not a missing event.

## Defects

### D1 — `Track` fires every mount event twice (dev StrictMode double-effect)

- **Expected:** each `Track` event fires exactly once per mount (the component docblock and
  ref-guard in `components/analytics/Track.tsx:12-23` say "exactly once").
- **Actual:** `product_view`, `quote_start`, `quote_complete`, `dealer_application`,
  `sample_request`, `consultation_booking` all enqueue **2 identical events** per page load
  (verified on reload too).
- **Location:** `components/analytics/Track.tsx:25-28`.
- **Suspected cause:** the `first` ref only snapshots the props; the `useEffect` unconditionally
  calls `track(e, p)`. In `next dev` React StrictMode mounts → unmounts → remounts, running the
  effect both times. Production builds do not double-invoke, so this is dev-only duplication —
  but it pollutes any dev/staging measurement and means the "exactly once" contract holds only
  in prod. Fix: guard the effect body (e.g. skip if a `fired` ref is already set, or move the
  dedupe into `createTracker` keyed per event+payload).

### D2 — WhatsApp links not wrapped in `TrackClick` (untracked `whatsapp_click` surfaces)

Tracked: `/contact` (`app/(site)/contact/page.tsx:75`), `/quote` (`app/(site)/quote/page.tsx:80`),
`/trade` (`app/(site)/trade/page.tsx:63`), `/samples` (`app/(site)/samples/page.tsx:60`),
`/custom-studio` (`app/(site)/custom-studio/page.tsx:341`), PDP
(`app/(site)/products/[category]/[slug]/page.tsx:262`).

Untracked WhatsApp anchors (no `TrackClick`, no `track("whatsapp_click")`):

| File:line | Surface |
|---|---|
| `components/layout/WhatsAppFab.tsx:77` | Site-wide floating action button (every page) |
| `components/layout/FloatingActions.tsx:44` | Floating actions cluster |
| `components/layout/FooterView.tsx:63` | Footer (every page) |
| `components/layout/MobileMenu.tsx:152` | Mobile menu |
| `components/marketing/FinalCta.tsx:38` | Marketing final-CTA section |
| `components/lead/WhatsAppHandoff.tsx:37` | Confirmation-page handoff CTA (all 4 confirmation pages) |
| `app/(site)/warranty/page.tsx:119` | Warranty page |
| `app/(site)/privacy/page.tsx:115` | Privacy page |

The site-wide FAB + footer alone make this the highest-traffic WhatsApp entry point, so
`whatsapp_click` data materially under-counts. Suggested fix: wrap the shared components
(`WhatsAppFab`, `FooterView`, `MobileMenu`, `FloatingActions`, `WhatsAppHandoff`, `FinalCta`)
with `TrackClick event="whatsapp_click"` and a `source` per surface.

## Cleanup / environment

- Test Payload docs created during verification (quote `PK-2026-0008`, dealer application
  `QA Analytics Co …`, sample request, consultation booking) were all deleted via the keyed
  local-API client (`e2e/payload-client.ts` pattern; verified 4/4 deletions).
- Dev server was restarted without the test ID after verification; tree returned to normal
  (plain `.env`).
- Playwright driver scripts lived in `/tmp` / `.tmp-*` and were removed; nothing committed
  except this report. No `.env` or secrets committed.
