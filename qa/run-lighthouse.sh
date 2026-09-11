#!/usr/bin/env bash
# M11 Lighthouse audit runner — audits the production server (default :3100).
# Usage: bash qa/run-lighthouse.sh [baseUrl]
set -u
BASE="${1:-http://localhost:3100}"
OUT="$(cd "$(dirname "$0")" && pwd)/lighthouse"
mkdir -p "$OUT"
ROUTES=(
  "/"
  "/products"
  "/products/pvc-wall-panels"
  "/products/pvc-wall-panels/classic-marble-pvc-panel"
  "/quote"
  "/solutions"
  "/projects"
  "/contact"
)
slug() { echo "$1" | sed 's#^/$#home#; s#^/##; s#/#-#g'; }
for route in "${ROUTES[@]}"; do
  name="$(slug "$route")"
  for form in mobile desktop; do
    echo "== $form $route"
    # Lighthouse 13: mobile is the default form factor (no --preset flag);
    # only desktop needs an explicit flag.
    preset_flag=(); [ "$form" = desktop ] && preset_flag=(--preset=desktop)
    npx lighthouse "$BASE$route" \
      "${preset_flag[@]}" \
      --only-categories=performance,accessibility,best-practices,seo \
      --chrome-flags="--headless=new --no-sandbox" \
      --output=json --output-path="$OUT/$name.$form.json" \
      --quiet || echo "FAILED $form $route"
  done
done
echo "done"
