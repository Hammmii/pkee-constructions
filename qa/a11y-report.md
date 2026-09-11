# A11y quick pass (manual checks — no axe-core in this repo)

Generated 2026-09-11T05:25:11.702Z against http://localhost:3000.

| Page | Check | Status | Detail |
|---|---|---|---|
| / | exactly one h1 | pass | found 1 |
| / | alt text on images | pass | 34 images in <main>, 0 missing/empty alt |
| / | focus-visible styles on keyboard focus | pass | {"outline":"solid","shadow":"none","width":"1px"} |
| / | body text contrast ≥ 4.5:1 | pass | 16 body paragraphs sampled, min 12.43:1 |
| / | eyebrow/label contrast vs 3:1 (note) | note | min 16.03:1 over 1 short labels (brass on bone/ink) |
| product detail | exactly one h1 naming the product | pass | ["Classic Marble PVC Wall Panel"] |
| product detail | finish swatches are a labelled radiogroup | pass | radiogroup[aria-label=Finishes] present |
| product detail | lightbox exposes dialog role | pass | aria-label="[SEED-PLACEHOLDER] Classic Marble PVC Wall Panel" |
| product detail | heading contrast ≥ 3:1 | pass | 2 h2 sampled, min 16.03:1 |
| category | accordion <details open> toggles | pass | open attribute toggles on click |
| category | aria-expanded present before first toggle | note | summary has no aria-expanded until first interaction (native <details> conveys state) |
| /quote | all visible inputs labelled | pass | all visible inputs labelled |
| /quote | exactly one h1 | pass | found 1 |
