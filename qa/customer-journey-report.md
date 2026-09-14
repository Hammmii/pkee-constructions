# Customer-Journey Mystery-Shop Audit (M11)

Date: 2026-09-14 · Target: http://localhost:3000 (local dev) · Auditor: mystery-shopper pass (Playwright, mobile + desktop)
Scope: full funnel as 3 personas + cross-cutting passes. **Nothing was fixed.** Prod-only image failures excluded per instructions.

Method notes: Playwright specs were written temporarily (`e2e/mystery-shop.spec.ts`, `e2e/mystery-mobile.spec.ts`), executed against the running dev server, then deleted. A real test lead was submitted through the full 7-step quote wizard and **deleted from Payload after verification** (reference PK-2026-0008). Screenshots were taken per step and discarded after the findings were transcribed.

---

## 1. Persona friction logs

### P1 — Researcher (mobile, no brand knowledge, lands on product page from Google)

Route: `/products/pvc-wall-panels/brushed-metal-pvc-panel` → mobile nav → WhatsApp.

| Step | Observation | What a real user feels/does |
|---|---|---|
| Product page top | Breadcrumbs work; hero image renders as a **flat beige blur** (local seed image) — for a *materials* site, texture IS the product. | "Is this a real company or a template?" Bounce risk is highest here. |
| Value comprehension | Clear what the product is (description, specs table: material, size 8'×4', thickness, fire rating, properties). | Good. Understands the offer. |
| Location | "Winnipeg / 360 Keewatin St" present via footer + breadcrumbs context. | Good. |
| **Price signals** | **Zero price indicators.** No "from $X/sq ft", no "budget guide", no price-range filter. The only path is quote/sample request. | Showroom buyers expect at least an anchor ("projects like this typically start at…"). Some will bounce to a competitor that gives a number. |
| Trust signals | **No testimonials/reviews on product page.** No install service-area statement, no delivery info. Warranty only reachable via small footer link. | Weak social proof at the exact decision point. |
| WhatsApp | 4 WA links on the page; prefill is genuinely helpful: `Hi PKEE, question about Brushed Metal PVC Panel.` | Works. Low-friction question path. |
| Sticky stacking | Header "REQUEST A QUOTE" + **bottom fixed bar (Get a Quote / WhatsApp / Call)** — 3 quote CTAs on screen at once; the bottom bar **overlaps page content** (cuts off text at the fold on the product page and covers the footer CTA in the open menu). | Cluttered, slightly desperate feel; bottom bar hides content. |
| Mobile menu | Only 6 entries (Products, Solutions, Projects, Custom Studio, About, Contact). **No direct path to /samples, /consultation, /trade, /quote** from the menu itself; quote only via the sticky bars. Contact block in menu is good. | Researcher who wants samples must hunt. |
| Layout | No horizontal overflow; no jank. | Clean. |

### P2 — Buyer (desktop): home → bento → category → product → quote wizard → confirmation

Route: `/` → `/products` → `/products/pvc-wall-panels` → product → `/quote` (7 steps) → confirmation.

- Home: strong — hero, category marquee, shop-by-space, featured materials bento, "Why PKEE".
- Category page: cards + "request a quote" copy present; no price bands.
- Product page: specs, Request-quote + Request-sample CTA pair, related products, "Projects using this material". Good.
- **Quote wizard (completed end-to-end, lead verified in Payload, then deleted):**
  - Step 1–2 (contact, project): clear.
  - **Step 3 (material): the product `<select>` rendered empty/blank** on dev DB — label gives no hint it's optional (confirmed optional in `e2e/quote.spec.ts:59`). A real user may stall thinking the form is broken.
  - Units toggle (SQ FT / SQ M / PIECES) is clear; quantity field fine.
  - Step 4 dimensions, Step 5 customization (incl. "installation required") — clear.
  - Step 6 file upload works; attachment **landed in Payload (attachments: 1)** — the attachment-drop bug documented in `e2e/quote.spec.ts:6-13` appears **fixed**; that spec's header comment is now stale and its failing assertions should be re-enabled.
  - Step 7 review + submit fine. Residential test lead scored 50.
- **Confirmation page is a strength:** reference number (PK-2026-0008, survives reload), numbered "what happens next" (2 business days), WhatsApp handoff CTA, showroom address + email fallback. Minor grammar: "samples options" → "sample options". Heading uses first name only ("Thank you, Mystery.").

### P3 — Trade pro: /trade, /samples, /consultation, /custom-studio

- **/trade — strongest page on the site.** Value prop ("build your business on our range"), benefits table (pricing, stock priority, territory, support), 3-step apply form, "prefer to talk first?" showroom fallback. No friction observed.
- **/samples — the 5-sample cap is only visible as the field label "QUANTITY (MAX 5)".** Intro copy never says samples are capped at 5, whether they're free, or shipping expectations. A contractor reading "Feel it before you commit" won't know the rules until the field.
- **/consultation — good.** Consultation type, project type, product of interest; showroom hours visible next to the form (Mon–Fri 9:00–17:00, Sat by appointment). Slot picker on a later step was not deep-exercised.
- **/custom-studio — good.** Rich page, JSON-LD, upload flow present.

---

## 2. Cross-cutting findings

### Content quality — placeholders rendering publicly (critical)
- **`/warranty` is a public placeholder page**: "Draft v1 — requires legal review before launch", "every coverage term below is a placeholder", multiple "TODO-CLIENT: confirm…" strings render verbatim (`app/(site)/warranty/page.tsx`). This is linked from every footer — a customer clicking the warranty link mid-purchase-intent sees an unfinished draft.
- **`/about` renders 6 "TODO-CLIENT: confirmed bio pending" principal bios** (`app/(site)/about/page.tsx:30-53`).
- `components/motion/TypeFillSection.tsx:121` TODO is comment-only (rendered copy is fine).
- No lorem ipsum found. Spelling/grammar otherwise clean; only "samples options" on the quote confirmation.

### Trust/completeness gaps (showroom-site must-haves)
| Item | Status |
|---|---|
| Warranty/guarantee | Page exists but is placeholder (see above) — **effectively missing** |
| Installation service explanation | Mentioned (quote step 5 checkbox, product properties) but no dedicated page/section explaining the install process, crew areas, prep, timelines |
| Delivery/service area | **Missing** — nowhere states where PKEE delivers/installs (Winnipeg only? Manitoba?) |
| Return policy | **Missing** (Terms of Use only) |
| FAQ | `collections/FAQs.ts` exists but **no public FAQ route found** — collection is admin-only so far |
| Social proof | `TestimonialsSection` on home renders **empty on the seeded dev DB**; no reviews on product pages |
| Contact hours | Good — contact page + consultation page show hours; footer shows address |
| Price indicators | **None anywhere** (by-design no published prices, but no "from $X" anchors either) |

### SEO/social basics
- Titles + meta descriptions: good on all 6 routes checked.
- **og:image missing** on `/products`, `/quote`, `/trade`, `/consultation`; **og:title missing** on `/quote`. Home + product detail have both.
- **Sitemap omits /warranty, /privacy, /terms** (`app/sitemap.ts` MARKETING_ROUTES).
- 404 page: helpful (brand line, address, "Back to home", "Browse materials"). Favicon 200.

### Performance feel
- Preloader ≤1.5s, skipped on repeat visits via sessionStorage and under reduced motion (`components/marketing/Preloader.tsx`) — by design; first-visit screenshot showed the counter mid-animation only.
- No scroll jank or layout shift observed in scripted passes; no horizontal overflow on mobile.

---

## 3. Missing-content checklist (priority order)

1. **P0 — Warranty page real content** (currently a public "placeholder" draft; linked from every footer).
2. **P0 — Remove/replace TODO-CLIENT bios on /about** (principals are named with "bio pending" text live).
3. **P0 — Any price anchor**: per-category "projects typically start at $X–$Y / sq ft installed" bands, or a "pricing approach" explainer page.
4. **P1 — Delivery & service-area statement** (Winnipeg/Manitoba radius) on contact + FAQ.
5. **P1 — Public FAQ page** wired to the FAQs collection (pricing, samples, lead times, install, delivery).
6. **P1 — Installation service page/section** (process, warranty tie-in, service area).
7. **P1 — Real project photography + testimonials seeded** so TestimonialsSection and project cards render.
8. **P2 — Samples policy copy** (cap of 5, free/paid, shipping) above the form.
9. **P2 — Return/cancellation policy** (samples + custom fabrication, which likely needs a custom-fab disclaimer).
10. **P2 — og:image for quote/trade/consultation/products-index; add legal routes to sitemap.**

---

## 4. Quick wins (small fix → big UX gain)

| Fix | File pointer | Payoff |
|---|---|---|
| Replace warranty placeholder copy or unlink footer until confirmed | `app/(site)/warranty/page.tsx`, `components/layout/FooterView.tsx:12-14` | Removes the single biggest trust-killer on the site |
| Same for /about bios (or drop the People section) | `app/(site)/about/page.tsx:27-53` | Placeholder text names real-looking people with "pending" copy |
| Add bottom padding so the mobile sticky bar stops covering content/footer CTAs | `components/layout/FloatingActions.tsx` (fixed `z-40 md:hidden`), `app/globals.css` scroll-padding | Mobile users currently have content hidden behind the bar |
| Mark step-3 product select as optional with helper text when empty | `components/quote/steps/StepMaterial.tsx` | Removes "is this broken?" stall in the money path |
| Add og:image/og:title fallbacks in shared metadata helper | `lib/seo/metadata.ts` (consumed by `app/(site)/quote/page.tsx`, `trade/page.tsx`, `consultation/page.tsx`) | Social shares of conversion pages look unfinished |
| Add /warranty /privacy /terms to sitemap | `app/sitemap.ts` MARKETING_ROUTES | Legal/trust pages indexable |
| Explain the 5-sample cap + free/shipping in intro copy | `app/(site)/samples/page.tsx` | Sets expectations before the form |
| Add Samples / Consultation / Trade links to the mobile menu | `components/layout/MobileMenu.tsx` | Researchers can find sample/booking paths without hunting |
| Grammar: "samples options" → "sample options" | quote confirmation copy (near `app/(site)/quote/confirmation`) | Polish on the highest-visibility page |
| Re-enable/fix stale attachment assertions | `e2e/quote.spec.ts:6-13` (bug appears fixed — attachments now land) | Money-path test back to green signal |

---

## 5. Verification log

- Full 7-step quote submitted with test data; lead verified in Payload (status new, source website, score 50, 1 attachment), then deleted. ✅
- WhatsApp prefill + confirmation WA handoff verified (deep link to wa.me/14317883188 with reference). ✅
- Mobile (390×390 viewport) and desktop passes green; no horizontal overflow; 404 + favicon checked. ✅
- Temp spec files and screenshots removed; no app code modified. ✅
