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

## Global guardrails (apply to every item)

- Animate only `transform | opacity | filter | clip-path`; overlay blur < 10px.
- LCP element stays a plain `next/image` with `priority` — never canvas/shader/VT-only.
- Every animation gated on `usePrefersReducedMotion()` and/or
  `(pointer: fine)`; content never stuck at opacity 0 (SSR-visible, animate
  from hidden after hydration).
- Pause off-screen animations (IntersectionObserver); one smooth-scroll
  system; mobile keeps native touch scroll.
- Verify with Lighthouse mobile ≥ 90, INP < 200ms after each P0/P1 lands.
