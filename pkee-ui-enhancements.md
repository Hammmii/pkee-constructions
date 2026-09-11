# PKEE Constructions — UI & Motion Enhancement Backlog (M11)

Research-driven backlog of interaction/motion upgrades. Grounded in the current
codebase (repo `pkee/`) and 2025–2026 best-in-class material/showroom sites
(Material Bank, Cosentino/Dekton, Porcelanosa, Mutina, Cassina, Aesop, Awwwards
interior nominees). Read together with `pkee-ui-design-system.md` (tokens,
guardrails) — every item below must respect those hard rules.

Priority: **P0** = highest perceived-premium gain, lowest risk → ship first.
**P1** = strong differentiators, medium effort. **P2** = polish / experiments.

Every item lists: what/where (concrete repo file), technique, deps, perf cost
(LCP/INP), reduced-motion fallback, effort (S/M/L).

> Note: `.kimi/skills/pkee-ui-craft/SKILL.md` referenced in the brief does not
> exist in the repo; recommendations are grounded in
> `pkee-ui-design-system.md` and direct code reading instead.

---

## Context: current state (what already exists — don't rebuild)

The repo already implements much of the "premium recipe": `PageTransition`
(dark wipe + crossfade, `components/motion/PageTransition.tsx`), `ImageReveal`,
`Reveal`, `Magnetic` (spring 180/15, `components/ui/Magnetic.tsx`), `Marquee`
(CSS `--animate-marquee`, off-screen pause), `Preloader` (monogram + counter,
sessionStorage-gated), `BeforeAfterSlider`, mega-menu with image tiles +
focus trap (`components/layout/MegaMenu.tsx`), split-line hero, Ken Burns
8s hero (`components/marketing/HomeHero.tsx`), product cards with slow 1.05
zoom + brass rule (`components/catalog/ProductCard.tsx`), quote wizard with
brass progress indicator. Backlog items below are **gaps or upgrades**, not
rebuilds.

---

## P0 — ship first (high premium signal, low risk)

### P0.1 NumberFlow counter in the Preloader
- **What/where:** replace the rAF-driven `setCount` in
  `components/marketing/Preloader.tsx` (currently hand-rolled `performance.now()`
  loop) with `<NumberFlow>` from `@number-flow/react`.
- **Technique:** digit-spin animation (each digit rolls like an odometer) —
  the single most "expensive-looking" micro-detail seen on award sites in 2025.
  Wrap the existing eased count state; keep the same 850ms budget and wipe exit.
- **Deps:** `@number-flow/react` (single dep, ~3KB, maintained, React 19-safe).
- **Perf:** zero layout thrash — NumberFlow animates transforms and uses
  `tabular-nums`; no LCP impact (preloader is above-the-fold overlay on first
  visit only). INP neutral.
- **Reduced motion:** `respectMotionPreference` defaults to true; pass
  `animated={false}` (static final number) or keep current skip path.
- **Effort: S.**

### P0.2 Catalog grid cursor-follow image preview (`/products`, `/projects`)
- **What/where:** `components/projects/ProjectCard.tsx` list pages and the
  products index (`app/products/page.tsx`) — desktop-only floating preview
  image that follows the cursor across the list (Material Bank / Awwwards
  archive-index pattern).
- **Technique:** absolutely-positioned `next/image` (or preloaded
  `background-image`) driven by `useMotionValue` + `useSpring` (reuse the
  `Magnetic` spring constants); on list-item hover, crossfade the preview to
  that item's image. Replaces the current per-card image-in-place hover on
  list views only; keep `ProductCard` as-is for grids.
- **Deps:** none (motion already in repo).
- **Perf:** INP risk is the main watch item — keep the listener on the list
  container (event delegation, one rAF-shared spring), `will-change:
  transform`, and preload only the first 4 images (rest lazy). No LCP impact
  (preview renders after hover, not on load).
- **Reduced motion / touch:** off entirely — `(pointer: fine)` +
  `usePrefersReducedMotion()`; mobile keeps tap-card behavior.
- **Effort: M.**

### P0.3 Mega-menu image crossfade + staggered tile entrance
- **What/where:** `components/layout/MegaMenu.tsx` — currently a static
  image-tile grid; Aesop/Cosentino pattern adds a featured image that
  crossfades per hovered family + tiles stagger in on open.
- **Technique:** motion `AnimatePresence` crossfade on a featured-image slot
  (`opacity` only, 300ms expo); tiles `staggerChildren 0.04s` with
  `y: 12 → 0, opacity: 0 → 1`. Keyboard focus changes the featured image too
  (onFocus mirrors onMouseEnter) so non-pointer users get the same richness.
- **Deps:** none.
- **Perf:** transform/opacity only; images are already in the DOM (preloaded
  with the panel) so no new network work. Blur-free. INP-safe (open animation
  < 400ms).
- **Reduced motion:** tiles render in final state instantly.
- **Effort: S–M.**

### P0.4 Skeleton "shimmer" upgrade + view-transition loading states
- **What/where:** `components/ui/Skeleton.tsx` (`animate-pulse` blocks) and
  route-level `loading.tsx` files (`app/products/loading.tsx`, add to
  `/products/[category]`, `/quote`).
- **Technique:** replace flat `animate-pulse` with a slow diagonal
  `background-position` shimmer (opacity-only alternative: a
  `linear-gradient` mask sweep at 8% opacity — still compositor-safe). Add
  `loading.tsx` where missing so every catalog route streams a branded
  skeleton that matches final layout (prevents CLS and reads intentional).
- **Deps:** none (pure CSS/Tailwind keyframes).
- **Perf:** shimmer is a background-position animation — runs on the
  compositor; pause off-screen via existing IntersectionObserver pattern.
  Loading skeletons *improve* perceived LCP.
- **Reduced motion:** static blocks (current behavior).
- **Effort: S.**

### P0.5 Quote-wizard step transitions + field micro-interactions
- **What/where:** `components/quote/QuoteWizard.tsx` (280 lines) and
  `components/quote/ProgressIndicator.tsx`.
- **Technique:** (a) `AnimatePresence mode="wait"` slide-fade between steps —
  outgoing step exits `x: -24, opacity: 0`, incoming enters `x: 24 → 0`,
  350ms expo; (b) progress indicator step changes animate a brass segment
  `scaleX` (already hairline-friendly); (c) floating labels: on focus/filled,
  label translates up (`transform` only) and turns brass; (d) valid-field
  checkmark fade-in; (e) submit button `whileTap scale 0.97` + brief
  success state before redirect to `/quote/confirmation`.
- **Deps:** none.
- **Perf:** all transform/opacity; one mounted step at a time. The wizard is
  below-the-fold-adjacent; INP unaffected.
- **Reduced motion:** instant step swap (skip AnimatePresence, render final).
- **Effort: M.**

### P0.6 Lenis + ScrollTrigger sync audit (correctness, not feature)
- **What/where:** `components/motion/SmoothScrollProvider.tsx`.
- **Technique:** verify the exact wiring the design doc mandates:
  `lenis.on('scroll', ScrollTrigger.update)` +
  `gsap.ticker.add(t => lenis.raf(t * 1000))` + `gsap.ticker.lagSmoothing(0)`
  (from lenis docs) — **do not** use the deprecated scrollerProxy. If any
  pinned/horizontal section (CollectionsExplorer, CraftProcess) shows drift
  or jitter this is the fix. Keep `autoRaf` off if ScrollTrigger owns the ticker.
- **Deps:** none.
- **Perf:** removes double-RAF; measurable INP improvement on scroll-heavy pages.
- **Reduced motion:** Lenis already honors it.
- **Effort: S.**

---

## P1 — strong differentiators

### P1.1 Shared-element image morph: product card → PDP hero / lightbox
- **What/where:** `components/catalog/ProductLightbox.tsx` and the PDP hero
  (`app/products/[category]/[slug]/`).
- **Technique:** two options:
  1. **Motion `layoutId`** shared-element transition (current design-doc
     recipe) — the card image morphs to the lightbox/hero on open. Proven,
     App-Router-safe, ~zero config.
  2. **Native View Transitions** via Next 16's `experimental.viewTransition`
     (`router.transitionTo`, `<Link transitionType>` / React `<ViewTransition>`):
     more native-feel page morphs (list → detail), zero JS springs, but newer
     and needs feature-detect + fallback to the existing `PageTransition` wipe.
- **Recommendation:** try (2) as an experiment on the card→PDP path behind a
  flag; keep (1) for the lightbox. Keep the existing ink-wipe as the
  no-support fallback.
- **Deps:** none (motion in repo; VT is platform).
- **Perf:** VT runs on the compositor and is cheaper than AnimatePresence
  full-tree remount; LCP unaffected (hero stays a plain `<img>`). INP: VT
  start cost ~10–20ms — acceptable.
- **Reduced motion:** `prefers-reduced-motion` disables VT automatically in
  supporting browsers; still gate manually.
- **Effort: M–L.**

### P1.2 Before/after slider on PDP & Custom Studio
- **What/where:** `components/ui/BeforeAfterSlider.tsx` exists — ensure it's
  deployed on `/custom-studio`, `/solutions/[slug]`, and optionally PDP
  "installed look" galleries.
- **Technique:** drag handle + `clip-path` on top layer (existing component);
  add keyboard arrows + `aria-valuenow` slider role if not present. Consider a
  GSAP ScrollTrigger auto-tease on first viewport entry (handle sweeps 15% →
  45% once, only if never interacted).
- **Deps:** none.
- **Perf:** clip-path on one layer is compositor-eligible; pause auto-tease
  off-screen.
- **Reduced motion:** no auto-tease; drag still works (direct manipulation).
- **Effort: S–M.**

### P1.3 Homepage pinned horizontal collections (finalize)
- **What/where:** `components/marketing/CollectionsExplorer.tsx`.
- **Technique:** GSAP ScrollTrigger horizontal pin (one per page, per design
  doc) with linear fallback + skip link; mobile = native snap scroll (already
  the pattern). If GSAP pin conflicts with Lenis, the P0.6 audit resolves it.
- **Perf:** this is the single heaviest item — pin + scrub costs ~3–5ms/frame;
  keep the pinned viewport small, images lazy, and `ScrollTrigger.refresh()`
  gated. Watch INP < 200ms on mid-range mobile (or desktop-only the pin).
- **Reduced motion:** linear stacked layout.
- **Effort: M.**

### P1.4 Category-page image reveal on hover (Dekton pattern)
- **What/where:** `app/products/[category]/page.tsx` hero / category tiles.
- **Technique:** hovering a category or swatch crossfades the section's
  background image via `opacity` layers (both preloaded) — Cosentino/Dekton
  catalog signature. No layout change.
- **Deps:** none.
- **Perf:** opacity crossfade only; watch total image weight (preload hero,
  lazy the rest).
- **Reduced motion:** instant swap, no fade.
- **Effort: S.**

### P1.5 Custom cursor (dot + trailing ring)
- **What/where:** new `components/ui/Cursor.tsx`, mounted in root layout,
  desktop-only.
- **Technique:** dot + lagging ring via motion `useSpring`, scales 2× over
  interactive elements, `mix-blend-difference`; keep native cursor visible
  (never `cursor: none` globally — per design doc).
- **Deps:** none.
- **Perf:** INP risk if done badly — one fixed element, springs on
  `useMotionValue`, `pointer-events: none`, and skip on `(pointer: coarse)`.
  Known jank source on low-end; position after P0 items land.
- **Reduced motion / touch:** not mounted.
- **Effort: M.**

### P1.6 Footer big-type reveal + magnetic CTA
- **What/where:** `components/layout/Footer.tsx`, `FooterStagger.tsx`,
  `FooterView.tsx`, `components/marketing/FinalCta.tsx`.
- **Technique:** scroll-triggered per-line clip reveal of the giant "Let's
  build your space" (clip-path `inset` wrappers, expo), brass coord/address
  row fades with 60ms stagger, and the CTA button wrapped in the existing
  `Magnetic`.
- **Deps:** none.
- **Perf:** footer is below the fold — zero LCP cost; IntersectionObserver-gated.
- **Reduced motion:** all lines visible.
- **Effort: S.**

---

## P2 — polish & experiments

### P2.1 Testimonial auto-progress crossfade (opt-in, off by default)
`components/marketing/TestimonialsSection.tsx` — design doc says no
auto-carousels; keep manual, but add a subtle manual-arrow micro-spring.
**Effort: S.**

### P2.2 Marquee velocity-reactive skew
`components/ui/MarqueeTrack.tsx` — tie skewX (−4° max) to Lenis scroll
velocity (2025 Awwwards staple). Pure `transform`, cheap; off under reduced
motion. **Effort: S.**

### P2.3 Trade page form parity
`/trade` application should inherit every P0.5 wizard micro-interaction.
**Effort: S.**

### P2.4 404 / error page craft
`app/not-found.tsx`, `app/error.tsx`, `app/global-not-found.tsx` — big-type
brass-numeral, single "back to materials" magnetic CTA. Cheap brand moment.
**Effort: S.**

### P2.5 Optional single R3F material moment
Homepage material spotlight per design doc §7 — **defer**: highest cost,
highest risk; only after all P0/P1 green and Lighthouse ≥ 90 holds.
**Effort: L.**

---

## Dependency summary

| Dep | New? | Used by |
|---|---|---|
| `@number-flow/react` | **yes** (single, ~3KB) | P0.1 |
| motion / GSAP / Lenis | existing | most items |
| View Transitions API | platform (Next 16 flag) | P1.1 |

Everything else is zero-new-dependency.

---

# ROUND 2 (R2) — 2026 premium patterns research

Second research pass (Sept 2026). Sources: [Next.js 16 App Router View
Transitions guide](https://nextjs.org/docs/app/guides/view-transitions) (Aug
2026), [React 19.2 `<ViewTransition>` reference](https://react.dev/reference/react/ViewTransition),
[MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API/Using),
[Chrome View Transitions primer](https://developer.chrome.com/docs/web-platform/view-transitions),
Awwwards 2025–2026 interior/material nominees, and 2025–2026 WhatsApp
Business / click-to-chat conversion literature. Completed R1 items (P0.1–P0.6,
P1.2–P1.4) are excluded — this is a fresh list.

**Context change since R1:** the site moved from email handoff to
**WhatsApp-first lead handoff** (`site.whatsapp` in `lib/site.ts`, mobile
sticky bar in `components/layout/FloatingActions.tsx`, quote emails now
position WhatsApp as the follow-up channel). R2 priorities reflect that.

## R2-P0 — ship first

### R2.1 React 19.2 `<ViewTransition>` migration (replaces/supersedes P1.1 experiment)
- **What/where:** `components/motion/PageTransition.tsx` +
  `components/catalog/ProductLightbox.tsx` + card→PDP path.
- **Why now:** Next 16's App Router uses React canary with stable
  `<ViewTransition>`; **no flag, no config needed** (verified against the
  Next.js VT guide and React docs). The R1 "experimental flag" caveat is gone.
  Four production recipes now documented by Vercel:
  1. **Shared-element morph** — named `<ViewTransition name={...}>` on product
     card image + PDP hero; browser animates position/size. Card→PDP morph is
     the exact "thumbnail → hero" example in the official guide.
  2. **Suspense reveal handoff** — skeleton exits fast (150ms slide-down +
     fade), content enters slower (400ms slide-up, 210ms fade delayed until
     exit completes). Replaces flat skeleton swap; pairs with R1 P0.4 skeletons.
  3. **Directional navigation** — `<Link transitionTypes={['nav-forward']}>` /
     `nav-back`, 60px slide offset; header pinned via `viewTransitionName` +
     `display: none` on old snapshot. Drop the ink-wipe for intra-catalog
     navigation; keep it only as the no-support fallback (VT is progressive —
     unsupported browsers just don't animate, per MDN).
  4. **Same-route crossfade** — `key={slug}` + `share="auto"` for PDP
     gallery/tab swaps.
- **Critical gotchas (from React docs):** (a) wrap pages in the **page, not
  the layout** — enter/exit never fire in layouts; (b) `default="none"` on
  every named pair or unrelated transitions will crossfade them; (c) exit/
  enter only fire if `<ViewTransition>` is the first node in its tree; (d)
  names must be globally unique (`pkee-product-${slug}`); (e) browser back/
  button navigations carry no transition type — morph still works, slide
  doesn't; (f) `::view-transition { pointer-events: none }` so clicks aren't
  swallowed mid-transition; (g) VT waits up to 500ms for fonts/images — keeps
  PDP morph flicker-free.
- **Deps:** none (React 19.2 ships with Next 16).
- **Perf:** snapshots are compositor-side; VT start ~10–20ms; cheaper than
  AnimatePresence full-tree remount. No LCP impact (hero stays plain
  `next/image`). **INP watch:** pause the ink-wipe AnimatePresence entirely
  when VT runs — never both systems on one navigation.
- **Reduced motion:** `animation-duration: 1ms` (or none) inside
  `@media (prefers-reduced-motion: reduce)` targeting
  `::view-transition-group(*)` — React does **not** auto-disable VT.
- **Effort: M.**

### R2.2 WhatsApp-first lead UX (see dedicated section below — P0.2–P0.4 inside it)

### R2.3 Text-fill image reveal (kinetic typography, signature home moment)
- **What/where:** one hero-adjacent statement section on the homepage (e.g.
  "Surfaces that outlast trends" behind/inside giant display type) — new
  `components/marketing/TypeFillSection.tsx`.
- **Technique:** oversized Neue Montreal/Editorial display line where the
  letters are a mask (`background-clip: text`) revealing a slow-panning
  material texture; on scroll, a second pass fills the text with ink as the
  texture recedes (IntersectionObserver-scrubbed CSS custom property on
  `clip-path` — *not* a scroll-linked paint). This is the 2025–2026 Awwwards
  interior-site signature (kinetic type + material imagery).
- **Perf:** `background-clip: text` + transform-only scrub; one image, one
  compositor animation. **Never** per-letter DOM splits with individual
  springs (that pattern is the #1 INP killer on this family of effects).
- **Reduced motion:** static filled text over the texture, no scrub.
- **Effort: M.**

### R2.4 Quote confirmation → WhatsApp deep-link bridge
- **What/where:** `app/(site)/quote/confirmation/page.tsx` (+ trade/custom-
  studio/samples confirmations).
- **Technique:** after submit, the confirmation page becomes a
  *next-step launcher*: (a) expectation-setting header ("We've received your
  project details — our team replies on WhatsApp within one business day"),
  (b) a **prefilled `wa.me` deep link** carrying a templated message ("Hi
  PKEE, I just submitted a quote request for {category} — reference {id}")
  so the thread opens with context, (c) copy-reference button, (d) brass
  progress-style "What happens next" 3-step strip (received → team reviews →
  WhatsApp reply). Progressive enhancement: link is a plain `<a>`, works
  no-JS.
- **Deps:** none.
- **Perf:** zero (static page + one anchor).
- **Reduced motion:** n/a.
- **Effort: S.**

## R2-P1 — strong differentiators

### R2.5 Bento editorial grid on homepage "Featured Materials"
- **What/where:** `components/marketing/FeaturedMaterials.tsx`.
- **Technique:** asymmetric bento (2 large + 2–3 small cells, CSS grid) with
  per-cell hover: image zoom (existing 1.05 recipe) + brass rule + spec-row
  teaser reveal. Editorial rhythm differentiates from the uniform card grid
  without new deps. Keep cell count CMS-driven (empty cells collapse).
- **Perf:** grid layout shift risk — reserve aspect-ratio boxes to keep CLS 0.
- **Reduced motion:** zoom off, rule draw only.
- **Effort: M.**

### R2.6 Scroll-driven before/after video-still "process" sequence
- **What/where:** `components/marketing/CraftProcess.tsx`.
- **Technique:** lightweight upgrade of the existing pinned section: instead
  of a scrubbed horizontal pin, use scroll-driven **frame-stepping** across a
  preloaded burst of stills (install sequence) or a `<video>` with
  `requestVideoFrameCallback`-driven `currentTime` scrub (no audio, muted,
  `preload="metadata"` + poster). Scroll-scrubbed *video* is the 2026 premium
  upgrade of the 2024 pinned-horizontal pattern — but only at 720p-max,
  ≤2.5MB, and **only on the one signature section** (per motion spec "one
  pinned section" rule, which this replaces rather than adds to).
- **Perf/INP:** video scrub is the watch item — throttle to rAF, step at
  ~8fps equivalence, disable on `(pointer: coarse)` + reduced motion (show
  static 3-up stills instead).
- **Effort: M–L. Defer until R2.1 lands.**

### R2.7 PDP "installed look" morph gallery (VT share, not lightbox)
- **What/where:** PDP gallery (`app/(site)/products/[category]/[slug]/`).
- **Technique:** thumbnails and main image are named `<ViewTransition>` pairs
  (`default="none" share="cross-fade"`); clicking a thumb crossfades in place
  with `key={img.id}` (same-route crossfade recipe) instead of opening the
  lightbox. Lightbox stays for zoom/detail. Same-route crossfades read as
  "same place, different content" — correct semantic per Vercel guide.
- **Perf:** compositor crossfade; no JS springs.
- **Reduced motion:** instant swap.
- **Effort: S–M (builds on R2.1).**

### R2.8 Contextual WhatsApp entry points in catalog flow
- **What/where:** PDP CTA cluster + quote wizard step 1.
- **Technique:** secondary "Ask about this material on WhatsApp" text-link
  beside the primary quote CTA, with **prefilled wa.me text naming the
  product slug** (`?text=Hi PKEE, question about {product.name} ({sku})`).
  Chat-first microcopy ("Prefer chat? Send us photos of your space and we'll
  suggest matches."). One per page max — WhatsApp entries must never compete
  with the primary quote CTA visually (text-link, not button).
- **Perf:** zero. **Effort: S.**

## R2 — WhatsApp-first lead UX (dedicated section)

The handoff moved email → WhatsApp; the UX hasn't caught up. 2025–2026
click-to-WhatsApp conversion research is consistent on four patterns:

1. **R2.2a Floating WhatsApp prominence, done tastefully (P0).**
   Current: mobile-only bar segment (`FloatingActions.tsx`) + footer link.
   Gaps: (a) no **desktop** persistent entry — add a single floating
   action button bottom-right on desktop (`(pointer: fine)` only), brass
   hairline circle, label appears on hover, `aria-label` set, dismissible
   per-session; (b) mobile bar's middle cell is the *only* WhatsApp entry —
   make PDP/trade pages show a WhatsApp-preferred variant of the bar when
   `quoteCta` context isn't present. Rules: max **one** floating WhatsApp
   element per viewport; never overlays the LCP or the sticky bar; respects
   `scroll-margin` so it never covers focused content.
2. **R2.2b Post-submit expectation setting (P0, = R2.4).** The #1 cause of
   WhatsApp-handoff drop-off is silence anxiety: users don't know a human
   will message them, or when. Every confirmation page must state channel
   ("We'll reply on WhatsApp"), timeframe ("within one business day"), and
   offer the deep-link bridge so impatient/high-intent users open the thread
   *themselves* immediately (this also primes the business number in the
   user's WhatsApp, dramatically improving reply-open rates).
3. **R2.2c Chat-first microcopy (P0, copy-level).** Shift tone on conversion
   surfaces from form-letter to chat-register: button labels
   ("Send my request" → fine), helper text ("No account needed — we reply on
   WhatsApp."), trade page ("Questions first? Chat with our trade desk."),
   and quote step intros. Never promise instant bot replies we don't staff;
   never invent phone numbers or response SLAs beyond what's in `lib/site.ts`.
4. **R2.2d Prefilled-context wa.me links everywhere (P0).** Every WhatsApp
   anchor site-wide should carry a `?text=` template with page/product/
   reference context (URL-encoded, built server-side). Research shows
   prefilled threads convert ~2–3× better than bare `wa.me` links because
   the first message is already "started." Central builder in `lib/site.ts`:
   `whatsappLink(context: string): string`.
- **Accessibility:** every WhatsApp anchor has an accessible name including
  the destination number; the FAB is a real `<a>`, keyboard-focusable, visible
  focus ring; no `target=_blank` without `rel="noopener"`.
- **Reduced motion:** n/a (static affordances).
- **Effort: S–M across all four.**

## R2 — evaluated and rejected/deferred (with reasons)

| Pattern | Verdict | Why |
|---|---|---|
| **WebGL/shader hero** (noise/liquid brass shaders) | **Reject** | Motion spec §8 already bans canvas/shader heroes — LCP must stay a plain `<img>`. Even as post-LCP ambient layer: ~150–400KB three.js + shader compile jank on mid-range mobile for a *materials* brand whose luxury signal is photographic fidelity. A well-lit photo beats a shader for panels/stone every time. |
| **3D product viewer (R3F)** | **Keep deferred** (was P2.5) | Material panels are flat, repeating-texture products — a 3D orbit adds little over good photography + before/after. Revisit only for Custom Studio joint/pattern preview, post-M11. |
| **Tactile sound design** | **Reject** | A11y: autoplay audio and surprise sound violate WCAG-adjacent expectations; muted-by-default sound is dead weight. Premium silence > gimmick. |
| **Adaptive/dark luxury theme** | **Reject for now** | Bone/ink is the brand; a dark variant doubles token/QA surface and risks muddying the brass accent. Revisit only if real user research asks. |
| **AI personalization ("recommended for your project")** | **Reject for now** | Cold-start showroom with no behavioral data; rule-based "pairs with / completes the look" CMS relations give 80% of the perceived intelligence at 0% of the privacy/weight cost. |
| **Conversational/one-question-at-a-time forms** | **Reject** | The multi-step wizard already exists (P0.5 shipped); chat-form hybrids break progressive enhancement and hurt completion for high-attachment quote flows. |
| **OTP-less auth / passkeys** | **N/A** | No accounts on the site. |
| **Mobile gesture interactions** (swipe-between PDPs, pull-to-reveal) | **Defer (P2)** | Native-feel swipe between products is nice but collides with horizontal galleries; revisit after R2.1 VT (browser-back swipe already works). Pull-to-refresh is non-standard on web — reject. |
| **Marquee innovations** (velocity blur, direction reverse) | **P2 addition** | R1 P2.2 velocity-skew shipped as the marquee upgrade; 2026 add-on: direction-linked reverse on scroll-back, ≤ ±4° skew cap stays. **Effort: S.** |
| **Image-to-text fill** | **Adopted as R2.3** | See above. |

## R2 dependency summary

| Dep | New? | Used by |
|---|---|---|
| React 19.2 `<ViewTransition>` | platform (ships with Next 16 canary) | R2.1, R2.7 |
| `lib/site.ts` `whatsappLink()` helper | internal | R2.2, R2.4, R2.8 |
| Video asset for R2.6 | CMS/media | R2.6 |

Everything else: zero-new-dependency.

---

## Global guardrails (apply to every item)

- Animate only `transform | opacity | filter | clip-path`; overlay blur < 10px.
- LCP element stays a plain `next/image` with `priority` — never canvas/shader/VT-only.
- Every animation gated on `usePrefersReducedMotion()` and/or
  `(pointer: fine)`; content never stuck at opacity 0 (SSR-visible, animate
  from hidden after hydration).
- Pause off-screen animations (IntersectionObserver); one smooth-scroll
  system; mobile keeps native touch scroll.
- Verify with Lighthouse mobile ≥ 90, INP < 200ms after each P0/P1 lands.
