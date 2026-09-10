# PKEE Constructions — Motion Language Spec (M11)

A short, normative spec for all motion on the site. Extends
`pkee-ui-design-system.md` §1/§4 with concrete numbers. If code and this
spec disagree, fix the code.

---

## 1. Easing curves

| Token | cubic-bezier | Use |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Default for everything entering/settling. |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Long fades, image crossfades. |
| `--ease-in-out-soft` | `cubic-bezier(0.65, 0, 0.35, 1)` | Wipes and overlay moves (symmetric read). |
| linear | — | Ken Burns drift, marquee loops only. |

Never use `ease-in` alone for visible motion; never use default
`ease` (reads cheap/JS-native).

## 2. Duration scale

| Tier | Range | Use |
|---|---|---|
| Micro (hover, tap, focus) | 200–350ms | Button fill, underline draw, label float, cursor ring. |
| Standard (reveals, card hovers) | 450–700ms | Split lines, image reveals, tile stagger steps. |
| Slow (signature) | 800–1200ms | Card image zoom, lightbox morph, big-type footer reveal. |
| Ambient | 8s linear | Hero Ken Burns, marquee loop (20–30s). |
| Page transition | ≤ 600ms total | Ink wipe + crossfade (see §6). |
| Preloader | ≤ 1.5s total | Counter ≤ 850ms, wipe ≤ 600ms. |

Rule of thumb: hover never faster than 250ms, never slower than 400ms;
scroll reveals never faster than 600ms. Speed reads cheap.

## 3. Hover values (the premium band)

- **Card image zoom:** `scale 1 → 1.05`, 1.0–1.2s `--ease-out-expo`. Never
  under 0.6s. Never above 1.12.
- **Cards never lift or drop shadow.** Differentiation = brass hairline
  `scaleX 0 → 1` (600–700ms expo) + optional "View material →" fade.
- **Buttons:** fill slides via `clip-path`/`scaleY`, 300ms; `whileTap:
  scale 0.97`, 150ms spring-release.
- **Links:** underline/brass rule draws origin-left, 500–700ms.
- **Magnetic:** ±8–12px, spring stiffness 150–200, damping 15; desktop
  `(pointer: fine)` only; `whileTap 0.97`.
- **Mega-menu / nav items:** 150–250ms opacity/transform staggers (menus
  must feel instant even when animated).
- **Cursor (if used):** ring lags dot ~120–200ms (spring), scale 1 → 2 over
  interactive elements, `mix-blend-difference`.

## 4. Reveal patterns

1. **Split-line headline (signature):** each line in an
   `overflow: hidden; clip-path: inset(0 0 100% 0)` wrapper; line rises to
   `inset(0 0 0% 0)` (transform: `y: 100% → 0` equivalent), expo, 0.08s
   stagger between lines. Scroll-triggered on enter (once), top 80% viewport.
2. **Image reveal (signature):** overflow-hidden wrapper's `clip-path` opens
   (`inset(0 0 100% 0) → inset(0)`) while inner image counter-scales
   `1.15 → 1.0`, 1000ms expo. Scroll-triggered, once.
3. **Parallax:** image inside wrapper moves ±8–12% slower than scroll
   (`yPercent −6 → 6` scrubbed). Ambient sections only; hero is Ken Burns
   (scale), not parallax. Max one parallax layer per viewport.
4. **Blur-in (text only):** `filter: blur(6px) → 0` + opacity, 600ms quart.
   Never on images (expensive, and blurs product photography).
5. **Stagger grids:** 40–60ms per item, `y: 12–24px → 0` + opacity, expo.
6. **Counters/numbers:** digit-roll via `@number-flow/react` (odometer spin),
   transform-only, `tabular-nums`.

All reveals: fire once (not scrubbed back and forth), gated behind
IntersectionObserver, start visible in SSR HTML.

## 5. Reduced motion (first-class path)

- `prefers-reduced-motion`: Lenis off, no parallax/marquee/cursor/magnetic/
  3D, no split-line (lines render fully), no Ken Burns (static frame),
  reveals render in final state instantly. Content is **never** stuck at
  opacity 0.
- Desktop-only interactions double-gated: `(pointer: fine)` AND
  `usePrefersReducedMotion()`.
- Touch: no custom cursor, magnetic, or tilt; galleries swipe-native.
- Skeletons, focus states, and direct-manipulation controls (drag sliders,
  text inputs) work identically under reduced motion.

## 6. Page transitions (App Router recommendation)

Keep the current **dark overlay wipe + content crossfade** via Motion
`AnimatePresence mode="wait"` (`components/motion/PageTransition.tsx`):
- Ink panel `clip-path: inset(0 0 0 0) → inset(0 0 100% 0)` on enter /
  reverse on exit, 450ms `--ease-out-expo` (symmetric-feel via
  `ease-in-out-soft` acceptable).
- Total choreographed time ≤ 600ms. `initial={false}` on first load.
- Reduced motion: no transition.

**Experiment (P1.1):** Next 16 View Transitions (`experimental.viewTransition`,
`transitionType` on `<Link>`) for card → PDP shared-element morphs, with the
wipe as the feature-detected fallback. Do not run both systems on the same
navigation; VT wins when supported.

## 7. Marquee

CSS `--animate-marquee` translateX −50% loop; 20–30s; duplicated
`aria-hidden` clone; IntersectionObserver pause off-screen; velocity-reactive
skew (≤ ±4°) optional and reduced-motion off.

## 8. Never do

- Never animate width/height/top/left/margin/padding or a global
  `--progress` variable — only `transform | opacity | filter | clip-path`.
- Never more than one pinned/horizontal-scroll section per page; never trap
  scroll without a skip affordance and linear fallback.
- Never shadow/lift on cards; never filled brass buttons; never pill + 2px
  radius mixed.
- Never `cursor: none` globally; never custom cursor/magnetic/tilt on touch.
- Never auto-carousels (testimonials rotate on user action only).
- Never blur > 10px on sticky overlays; blur is the #1 jank source.
- Never canvas/shader-only heroes — LCP image is always a plain `<img>`.
- Never two smooth-scroll or scroll-sync systems (Lenis + GSAP ticker only,
  `lagSmoothing(0)`).
- Never animate under 0.6s for signature moments; never default `ease`;
  never run an infinite loop that isn't paused off-screen.
- Never ship an animation that leaves content invisible if JS/hydration
  fails — SSR output is the final state.
