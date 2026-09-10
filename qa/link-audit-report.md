# Link crawl results (generated 2026-09-10T21:17:56.213Z)

Base: http://localhost:3000 — 58 routes crawled, 117 unique internal hrefs verified.

| Route | HTTP | Main | Verdict |
|---|---|---|---|
| / | 200 | ✓ | FAIL |
| /about | 200 | ✓ | FAIL |
| /admin | 200 | ✓ | FAIL |
| /contact | 200 | ✓ | FAIL |
| /custom-studio | 200 | ✓ | FAIL |
| /products | 200 | ✓ | FAIL |
| /products/3d-parametric | 200 | ✓ | FAIL |
| /products/3d-parametric/kinesis-3d-parametric-wall | 200 | ✓ | FAIL |
| /products/artificial-gardens | 200 | ✓ | FAIL |
| /products/artificial-gardens/verde-artificial-garden-wall | 200 | ✓ | FAIL |
| /products/artificial-stone | 200 | ✓ | FAIL |
| /products/backsplash | 200 | ✓ | FAIL |
| /products/custom-doors | 200 | ✓ | FAIL |
| /products/customized-decor-sheet | 200 | ✓ | FAIL |
| /products/customized-decor-sheet/terra-3d-book-match | 200 | ✓ | FAIL |
| /products/decor-sheet | 200 | ✓ | FAIL |
| /products/decor-sheet/calacatta-decor-sheet | 200 | ✓ | FAIL |
| /products/faux-crystalline-stone | 200 | ✓ | FAIL |
| /products/faux-crystalline-stone/onyx-glow-crystalline-stone | 200 | ✓ | FAIL |
| /products/faux-nano-stone | 200 | ✓ | FAIL |
| /products/faux-nano-stone/nuvola-faux-nano-stone | 200 | ✓ | FAIL |
| /products/feature-walls | 200 | ✓ | FAIL |
| /products/fireplaces | 200 | ✓ | FAIL |
| /products/fireplaces/ember-3d-led-fireplace | 200 | ✓ | FAIL |
| /products/hd-stone | 200 | ✓ | FAIL |
| /products/hd-stone/strata-hd-stone-veneer | 200 | ✓ | FAIL |
| /products/led-profiles | 200 | ✓ | FAIL |
| /products/led-profiles/linea-led-profile-system | 200 | ✓ | FAIL |
| /products/louver-panels | 200 | ✓ | FAIL |
| /products/louver-panels/walnut-louver-panel | 200 | ✓ | FAIL |
| /products/mandir-darbar | 200 | ✓ | FAIL |
| /products/pvc-wall-panels | 200 | ✓ | FAIL |
| /products/pvc-wall-panels/brushed-metal-pvc-panel | 200 | ✓ | FAIL |
| /products/pvc-wall-panels/classic-marble-pvc-panel | 200 | ✓ | FAIL |
| /products/pvc-wall-panels/fluted-slat-pvc-panel | 200 | ✓ | FAIL |
| /products/pvc-wall-panels/heritage-oak-pvc-panel | 200 | ✓ | FAIL |
| /products/pvc-wall-panels/lumiere-backlit-pvc-panel | 200 | ✓ | FAIL |
| /products/trims | 200 | ✓ | FAIL |
| /products/wallpaper | 200 | ✓ | FAIL |
| /products/wpc-beams | 200 | ✓ | FAIL |
| /products/wpc-beams/rustic-wpc-ceiling-beam | 200 | ✓ | FAIL |
| /projects | 200 | ✓ | FAIL |
| /quote | 200 | ✓ | FAIL |
| /samples | 200 | ✓ | FAIL |
| /solutions | 404 | ✗ | FAIL |
| /solutions/bathroom | 200 | ✓ | FAIL |
| /solutions/bedroom | 200 | ✓ | FAIL |
| /solutions/feature-wall | 200 | ✓ | FAIL |
| /solutions/fireplace | 200 | ✓ | FAIL |
| /solutions/hotel | 200 | ✓ | FAIL |
| /solutions/kitchen | 200 | ✓ | FAIL |
| /solutions/living-room | 200 | ✓ | FAIL |
| /solutions/office | 200 | ✓ | FAIL |
| /solutions/outdoor | 200 | ✓ | FAIL |
| /solutions/prayer-room | 200 | ✓ | FAIL |
| /solutions/restaurant | 200 | ✓ | FAIL |
| /solutions/retail | 200 | ✓ | FAIL |
| /trade | 200 | ✓ | FAIL |

## Dead links & console errors (111)

| Severity | Route | Kind | Detail |
|---|---|---|---|
| major | / | console | Encountered two children with the same key, `%s`. Keys should be unique so that components maintain their identity across updates. Non-unique keys may cause children to be duplicated and/or omitted — the behavior is unsupported and could change in a future version. /api/media/file/seed-proj-downtown |
| critical | / | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /about | dead-link | /solutions — dead link (404, 404 page content) |
| major | /admin | console | In HTML, %s cannot be a child of <%s>.%s
This will cause a hydration error.%s <html> main  

  ...
    <GsapLenisSync>
      <a>
      <HeaderClient>
      <PageTransition>
        <AnimatePresence mode="wait" initial={false}>
          <PresenceChild isPresent={true} initial={false} custom={undefin |
| major | /admin | console | <%s> cannot contain a nested %s.
See this log for the ancestor stack trace. main <html> |
| major | /admin | console | You are mounting a new %s component when a previous one has not first unmounted. It is an error to render more than one %s component at a time and attributes and children of these components will likely fail in unpredictable ways. Please only render a single instance of <%s> and if you need to mount |
| major | /admin | console | You are mounting a new %s component when a previous one has not first unmounted. It is an error to render more than one %s component at a time and attributes and children of these components will likely fail in unpredictable ways. Please only render a single instance of <%s> and if you need to mount |
| major | /admin | console | pageerror: Hydration failed because the server rendered text didn't match the client. As a result this tree will be regenerated on the client. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or ` |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at ins |
| major | /admin | console | NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at insertOrAp |
| major | /admin | console | NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at insertOrAp |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/static/ch |
| major | /admin | console | NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/static/ch |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at ins |
| major | /admin | console | NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at insertOrAp |
| major | /admin | console | NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at insertOrAp |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/static/ch |
| major | /admin | console | NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/static/ch |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at ins |
| major | /admin | console | NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at insertOrAp |
| major | /admin | console | NotFoundError: Failed to execute 'insertBefore' on 'Node': The node before which the new node is to be inserted is not a child of this node.
    at insertOrAppendPlacementNode (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:7302:75)
    at insertOrAp |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | %o

%s NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/st |
| major | /admin | console | NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/static/ch |
| major | /admin | console | NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.
    at removeChild (http://localhost:3000/_next/static/chunks/node_modules_next_dist_compiled_react-dom_096_9a-._.js:11753:24)
    at runWithFiberInDEV (http://localhost:3000/_next/static/ch |
| critical | /admin | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /contact | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /custom-studio | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/3d-parametric | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/3d-parametric/kinesis-3d-parametric-wall | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/artificial-gardens | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/artificial-gardens/verde-artificial-garden-wall | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/artificial-stone | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/backsplash | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/custom-doors | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/customized-decor-sheet | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/customized-decor-sheet/terra-3d-book-match | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/decor-sheet | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/decor-sheet/calacatta-decor-sheet | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/faux-crystalline-stone | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/faux-crystalline-stone/onyx-glow-crystalline-stone | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/faux-nano-stone | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/faux-nano-stone/nuvola-faux-nano-stone | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/feature-walls | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/fireplaces | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/fireplaces/ember-3d-led-fireplace | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/hd-stone | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/hd-stone/strata-hd-stone-veneer | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/led-profiles | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/led-profiles/linea-led-profile-system | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/louver-panels | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/louver-panels/walnut-louver-panel | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/mandir-darbar | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/pvc-wall-panels | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/pvc-wall-panels/brushed-metal-pvc-panel | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/pvc-wall-panels/classic-marble-pvc-panel | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/pvc-wall-panels/fluted-slat-pvc-panel | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/pvc-wall-panels/heritage-oak-pvc-panel | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/pvc-wall-panels/lumiere-backlit-pvc-panel | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/trims | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/wallpaper | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/wallpaper | dead-link | /quote?category=wallpaper — HTTP 500 |
| critical | /products/wpc-beams | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /products/wpc-beams/rustic-wpc-ceiling-beam | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /projects | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectstype=residential — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectstype=commercial — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=living-room — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=kitchen — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=bathroom — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=bedroom — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=office — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=restaurant — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=retail — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=hotel — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=outdoor — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=feature-wall — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=fireplace — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=prayer-room — dead link (404, 404 page content) |
| critical | /projects | dead-link | /projectsroom=basement — dead link (404, 404 page content) |
| critical | /quote | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /samples | dead-link | /solutions — dead link (404, 404 page content) |
| major | /solutions | console | Failed to load resource: the server responded with a status of 404 (Not Found) |
| critical | /solutions/bathroom | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/bedroom | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/feature-wall | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/fireplace | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/hotel | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/kitchen | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/living-room | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/office | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/outdoor | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/prayer-room | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/restaurant | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /solutions/retail | dead-link | /solutions — dead link (404, 404 page content) |
| critical | /trade | dead-link | /solutions — dead link (404, 404 page content) |
