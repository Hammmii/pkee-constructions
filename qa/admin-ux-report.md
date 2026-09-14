# Admin UX Audit — Authenticated (local, Payload 3.88 / Postgres)

- **Date:** 2026-09-14
- **Scope:** full authenticated walkthrough of `/admin` with a real super-admin session (Playwright, storageState reused), cross-checked against the Payload REST API at every step.
- **Method:** login → dashboard → pipeline → activity → all 10 native collection views → lead lifecycle E2E (public `/quote` form → admin → CSV → delete) → viewport sanity at 1440 / 1280 / 390. Every state-changing action was verified via the API, not just the UI.
- **Result:** 53 checks passed, 1 real defect, 2 by-design rejections initially read as failures, 6 friction items.

## Pass/fail table

| # | Function | Result | Notes |
|---|----------|--------|-------|
| 1 | Login form renders | ✅ | |
| 2 | Invalid password rejected with error message | ✅ | Stays on `/admin/login`, clear error text |
| 3 | Valid login redirects, session persists across reload | ✅ | |
| 4 | Dashboard stat cards match API counts | ✅ | quotes 7, dealer-applications 4, contact-messages 3, consultations 6, sample-requests 5 — all matched |
| 5 | SLA chips (24h/72h) compute | ✅ | Chips on cards and header; values consistent with seeded timestamps |
| 6 | Recent-list deep links land on edit pages | ✅ | |
| 7 | CSV export (`/custom/api/export/quotes`) | ✅ | 200, UTF-8 BOM present, 9 rows incl. header, contains test lead email after E2E |
| 8 | Pipeline: 11 columns render | ✅ | |
| 9 | Pipeline: HTML5 drag → persists after reload (API-verified) | ✅ | `PK-2026-0002` new→contacted, verified via `/api/quotes` |
| 10 | Pipeline: status select saves | ✅ | `PK-2026-0004` → qualified, API-verified |
| 11 | Pipeline: assignee select saves | ❌ **DEFECT** | see D-1 |
| 12 | Pipeline: status-change note recorded | ✅ | "Status changed to Contacted (contacted)" with author + timestamp |
| 13 | Pipeline: keyboard fallback (native status select) | ✅ | |
| 14 | Activity feed renders unified list | ✅ | |
| 15 | Activity filters work | ✅ | Requires clicking **Filter** (no auto-submit on change) |
| 16 | Activity deep links land on edit pages | ✅ | `/admin/collections/dealer-applications/12` |
| 17 | Native list views ×10 (quotes, dealer-applications, contact-messages, consultations, sample-requests, products, projects, solutions, pages, media) | ✅ | all render + search works in each |
| 18 | contact-messages create via admin | ⛔ by design | `create: publicCreateClosed` — leads come only from the public form; admin shows a clear unauthorized page |
| 19 | Quotes/dealer-apps/etc. create via admin | ⛔ by design | same pattern — intentional, matches architecture doc |
| 20 | FAQ create → edit → delete (round-trip) | ✅ | edit persisted, delete required confirmation, doc 404 after |
| 21 | Delete confirmation dialog | ✅ | |
| 22 | Media upload (PNG) | ✅ | **requires `alt`** (required field) — validation and error surfacing work correctly |
| 23 | Migration field: dealer-app `DA-` reference | ✅ on edit view | **Missing from list columns** (F-3) |
| 24 | Migration field: consultation `source` | ✅ on edit view | **Missing from list columns** (F-4) |
| 25 | E2E: public quote form submits → confirmation `?ref=PK-2026-0008` | ✅ | Turnstile skipped locally (secret unset), honeypot present |
| 26 | E2E: lead appears in admin (dashboard + New column) | ✅ | |
| 27 | E2E: lead moves new → contacted → qualified → won | ✅ | API-verified at each step |
| 28 | E2E: lead in CSV export | ✅ | |
| 29 | E2E: test lead deleted | ✅ | |
| 30 | Viewports 1440 / 1280 / 390 | ✅ | No horizontal overflow; dashboard stacks cleanly at 390; pipeline columns scroll within their own container |
| 31 | Console errors during session | ⚠️ 2 explained | one 500 (D-1 assignee PATCH), one 400 (intentionally-closed create attempt). Nothing else in ~15 min session. |

## Defects

### D-1 — Pipeline assignee select does not persist (severity: **high**)

**Repro:**
1. Log in → `/admin/pipeline`.
2. On any card, choose a user in the **Assignee** select.
3. UI updates optimistically; no error shown.
4. Reload (or `GET /api/quotes/:id`) → `assignedTo` is `null`.
5. Intermittently the `PATCH /custom/api/quotes/:id` returns **500** with `ValidationError: The following field is invalid: Assigned To` (visible in dev server log; browser shows nothing).

**Evidence:** direct API repro — `PATCH /custom/api/quotes/9` with `{"data":{"assignedTo":"1"}}` (or `1`) returns `200 {"id":9,...}` but `assignedTo` stays `null`; the same update via `PATCH /api/quotes/9` REST works. So the custom route (`app/(payload)/custom/api/quotes/[id]/route.ts`) builds `data.assignedTo` but the value is dropped or fails relationship validation inside `payload.update` — likely a string-vs-number ID coercion issue in the relationship validation, or a stale `notes` remap (`author: Number(n.author)`) interfering. Needs the fixer's eyes; the silent 200 + optimistic UI makes this look saved when it is not.

**Files:** `app/(payload)/custom/api/quotes/[id]/route.ts`, `components/admin/pipeline-board.tsx` (handleAssign + persist), `collections/Quotes.ts` (assignedTo relationship).

## Friction notes (for a showroom staff member's daily flow)

1. **F-1 — Quotes list hides who the lead is.** `Quotes.ts` `defaultColumns: ["reference","status","leadScore","updatedAt"]` — no customer name, email, or city. Staff must open every lead to see who it is. Add `customer.name` (and ideally `customer.email`) to `defaultColumns`. Highest-value micro-fix in this audit.
2. **F-2 — Assignee UI gives false confidence.** Even after D-1 is fixed, the board updates optimistically with no save indicator; the only feedback on the intermittent 500 is a console error. Add a transient "Saved"/"Failed" state on the card.
3. **F-3 — Dealer-application `DA-` reference not in list columns.** `defaultColumns: ["companyName","businessType","territory","status","updatedAt"]` — staff answering the phone with only a reference number can't find the application. Add `reference`.
4. **F-4 — Consultation `source` not in list columns** (`["type","date","contact.name","status","updatedAt"]`). Knowing which funnel (website / custom-studio / phone) produced a consult matters for triage. Add `source`.
5. **F-5 — Activity filters need a Filter click.** Auto-submit on `change` (or `form.onchange=submit`) would save a click every time; native selects already allow keyboard-only operation.
6. **F-6 — Pipeline lead-score badge is an unlabeled number** (e.g. "75", "90" circle on each card). Add a `title="Lead score"` tooltip or label so new staff know what it is.

Nice-to-haves observed: dashboard empty states and "Back to dashboard" links are consistent; delete confirmations are clear; activity reset link only appears when filtered (correct); media `alt` requirement is enforced with a clear inline error (good a11y hygiene); both SLA chips and per-card chips give an at-a-glance triage view that works well at 390px.

## Verdict

**Ready for staff use: YES, after D-1 is fixed.** Login, dashboard, pipeline (drag/status/notes), activity feed, all collection views, media, CSV export, and the full public→admin lead lifecycle all work and API-verify cleanly. The single blocker is the silently-failing assignee control — everything else is polish. The friction items F-1/F-3/F-4 are one-line `defaultColumns` changes that would visibly speed up daily intake work.

*QA session artifacts (screenshots, storageState) were kept in `/tmp` only; the throwaway QA admin user was deleted after the audit and seed data statuses were restored. No credentials committed.*
