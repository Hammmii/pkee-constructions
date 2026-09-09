/**
 * M2 seed script — idempotent, dev/staging only.
 *
 * Usage: node scripts/seed.mjs
 *
 * - Refuses to run with NODE_ENV=production.
 * - Loads .env via dotenv (DATABASE_URL, PAYLOAD_SECRET required).
 * - Generates warm-neutral SVG placeholder images locally (no network),
 *   rasterizes them with sharp, uploads to the Media collection, and flags
 *   every seeded asset with `placeholder: true` + "[SEED-PLACEHOLDER]" alt.
 * - Seed order: FAQs → ProductCategories → Products → Solutions →
 *   Projects → Testimonials → Pages. Existing docs (matched by slug or
 *   filename) are updated in place; nothing is duplicated on re-run.
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, "..");

if (process.env.NODE_ENV === "production") {
  console.error("Refusing to run seed script with NODE_ENV=production.");
  process.exit(1);
}

try {
  const { config } = await import("dotenv");
  config({ path: path.join(rootDir, ".env"), quiet: true });
} catch {
  console.warn("dotenv not available — relying on environment variables.");
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (check .env).");
  process.exit(1);
}

const { createJiti } = await import("jiti");
const jiti = createJiti(import.meta.url);
// payload.config.ts uses extensionless relative imports, which Node's native
// TS stripping cannot resolve — jiti handles it.
const { default: config } = await jiti.import(path.join(rootDir, "payload.config.ts"));
const { getPayload } = await import("payload");
const sharp = (await import("sharp")).default;

const payload = await getPayload({ config });

// ---------------------------------------------------------------------------
// Placeholder image generation (local only, no network)
// ---------------------------------------------------------------------------

const mediaDir = path.join(os.tmpdir(), "pkee-seed-media");
await mkdir(mediaDir, { recursive: true });

const PALETTE = [
  ["#D9D2C4", "#8C5B3F"],
  ["#C9BFAE", "#5C4033"],
  ["#B08D57", "#2E2A24"],
  ["#A89C88", "#4A3F33"],
  ["#E4DCCC", "#7A5C3E"],
];

function svgFor(label, bg, fg, w = 1200, h = 1500) {
  const short = label.length > 34 ? `${label.slice(0, 33)}…` : label;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg}"/>
      <stop offset="1" stop-color="${fg}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect x="40" y="40" width="${w - 80}" height="${h - 80}" fill="none" stroke="${fg}" stroke-opacity="0.35" stroke-width="2"/>
  <text x="60" y="${h - 90}" font-family="Georgia, serif" font-size="52" fill="${fg}" fill-opacity="0.85">${short.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</text>
  <text x="60" y="${h - 140}" font-family="Georgia, serif" font-style="italic" font-size="26" fill="${fg}" fill-opacity="0.55">PKEE Constructions — seed placeholder</text>
</svg>`;
}

async function placeholderMedia(key, label) {
  const filename = `seed-${key}.webp`;
  const existing = await payload.find({
    collection: "media",
    where: { filename: { equals: filename } },
    limit: 1,
  });
  if (existing.docs.length > 0) return existing.docs[0].id;

  const [bg, fg] = PALETTE[Math.abs(hash(key)) % PALETTE.length];
  const svgPath = path.join(mediaDir, `seed-${key}.svg`);
  const outPath = path.join(mediaDir, filename);
  await writeFile(svgPath, svgFor(label, bg, fg), "utf8");
  await sharp(svgPath).webp({ quality: 80 }).toFile(outPath);

  const doc = await payload.create({
    collection: "media",
    filePath: outPath,
    data: {
      alt: `[SEED-PLACEHOLDER] ${label}`,
      caption:
        "[SEED-PLACEHOLDER] generated placeholder — replace with real photography before launch",
      placeholder: true,
    },
  });
  return doc.id;
}

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

function richText(text) {
  return {
    root: {
      children: [
        {
          children: [
            { detail: 0, format: 0, mode: "normal", style: "", text, type: "text", version: 1 },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  };
}

// ---------------------------------------------------------------------------
// Idempotent upsert helper
// ---------------------------------------------------------------------------

async function upsert(collection, whereField, whereValue, data) {
  const existing = await payload.find({
    collection,
    where: { [whereField]: { equals: whereValue } },
    limit: 1,
    draft: true,
  });
  if (existing.docs.length > 0) {
    await payload.update({ collection, id: existing.docs[0].id, data });
    track(collection, "updated");
    return existing.docs[0].id;
  }
  const doc = await payload.create({ collection, data });
  track(collection, "created");
  return doc.id;
}

const counts = new Map();
function track(collection, kind) {
  if (!counts.has(collection)) counts.set(collection, { created: 0, updated: 0 });
  counts.get(collection)[kind] += 1;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

console.log("Seeding FAQs…");
const faqSeeds = [
  [
    "Are PVC wall panels suitable for bathrooms?",
    "Yes — our PVC wall panels are 100% waterproof and mould-resistant, making them ideal for bathrooms, showers, and basements. They install over existing tile with minimal prep.",
    "pvc-wall-panels",
    "/products/pvc-wall-panels",
  ],
  [
    "How are PVC wall panels installed?",
    "Panels interlock with a tongue-and-groove or click system over battens or adhesive. Our team offers professional installation across Winnipeg and Manitoba, or we can supply cutting guides for your contractor.",
    "pvc-wall-panels",
    "/products/pvc-wall-panels",
  ],
  [
    "Can PVC panels be used behind a fireplace?",
    "Yes, with proper clearances from the heat source. Our fire-resistant panels are rated for typical fireplace surrounds; our team will confirm suitability for your specific unit during consultation.",
    "pvc-wall-panels",
    "/faq",
  ],
  [
    "What is the difference between Decor Sheets and PVC Wall Panels?",
    "Decor sheets are large-format stone- or woodgrain-composite panels for seamless walls, while PVC wall panels are lighter, waterproof interlocking panels best for bathrooms, basements, and feature walls.",
    "decor-sheets",
    "/products/decor-sheet",
  ],
  [
    "Do you offer custom sizes and book-matching?",
    "Yes — our Custom Studio fabricates customized decor sheets with 3D relief, book-matched veining, and custom prints. Upload your design or book a consultation.",
    "custom-fabrication",
    "/custom-studio",
  ],
  [
    "Can crystalline stone be backlit?",
    "Absolutely. Faux crystalline stone and nano stone are translucent — LED backlighting creates a dramatic glow effect for bars, reception desks, and feature walls.",
    "stone",
    "/products/faux-crystalline-stone",
  ],
  [
    "Do you ship outside Winnipeg?",
    "We deliver across Manitoba and can arrange shipping across Canada for sheet goods. Installation services are currently focused in Winnipeg and surrounding areas.",
    "shipping-installation",
    "/contact",
  ],
  [
    "How do I get a quote?",
    "Use the Request a Quote form with your room dimensions and product interests — you'll receive a reference number immediately and a detailed quote from our sales team within one business day.",
    "general",
    "/quote",
  ],
  [
    "What is the trade program?",
    "Dealers, contractors, and designers get trade pricing, priority stock, and territory support. Apply via the For Trade page; our team reviews applications within 2–3 business days.",
    "trade-program",
    "/trade",
  ],
  [
    "How long does a custom mandir or darbar take?",
    "Typically 4–8 weeks depending on carving detail, stone selection, and lighting integration. Rush options are available — discuss timelines in a showroom consultation.",
    "custom-fabrication",
    "/products/mandir-darbar",
  ],
  [
    "Are your materials suitable for commercial spaces?",
    "Yes — restaurants, hotels, offices, and retail spaces use our panels and stone for high-traffic walls. Scratch-resistant and fire-resistant options are available.",
    "stone",
    "/solutions/restaurant",
  ],
  [
    "Can I see samples before ordering?",
    "Yes — request free samples of most panel lines, or visit our showroom at 360 Keewatin St, Winnipeg to see full-size installed displays.",
    "general",
    "/samples",
  ],
];
const faqIds = {};
for (const [question, answer, category, relatedPage] of faqSeeds) {
  const id = await upsert(
    "faqs",
    "question",
    question,
    { question, answer, category, relatedPage },
    question,
  );
  faqIds[question] = id;
}

console.log("Seeding ProductCategories…");
const categorySeeds = [
  {
    name: "PVC Wall Panels",
    slug: "pvc-wall-panels",
    group: "sheets-panels",
    rich: true,
    intro:
      "Our hero category — premium waterproof PVC wall panels in marble, woodgrain, fluted, and metallic finishes. Lightweight, fire-resistant, and installable over existing surfaces: the fastest way to transform a bathroom, basement, or feature wall.",
    benefits: [
      "100% waterproof and mould-resistant",
      "Installs over tile, drywall, or concrete",
      "Fire-resistant core",
      "Grout-free, easy-clean surface",
      "Warm to the touch and quiet under impact",
      "Budget-friendly vs. natural stone",
    ],
    applications: ["living-room", "bathroom", "bedroom", "basement", "feature-wall", "kitchen"],
    faqs: [
      "Are PVC wall panels suitable for bathrooms?",
      "How are PVC wall panels installed?",
      "Can PVC panels be used behind a fireplace?",
    ],
    seo: {
      metaTitle: "PVC Wall Panels Winnipeg | PKEE Constructions",
      metaDescription:
        "Premium waterproof PVC wall panels — marble, woodgrain, fluted. Supply, fabrication, and installation in Winnipeg. Visit 360 Keewatin St.",
    },
  },
  {
    name: "Decor Sheets",
    slug: "decor-sheet",
    group: "sheets-panels",
    intro:
      "Large-format decorative composite sheets with stone, marble, and woodgrain faces for seamless, grout-free wall surfaces.",
    benefits: [
      "Seamless large-format coverage",
      "Realistic stone and woodgrain faces",
      "Lighter than natural stone",
    ],
    applications: ["living-room", "feature-wall", "office", "hotel"],
    faqs: ["What is the difference between Decor Sheets and PVC Wall Panels?"],
  },
  {
    name: "Customized Decor Sheets",
    slug: "customized-decor-sheet",
    group: "sheets-panels",
    intro:
      "3D relief, book-match, and custom-print decor sheets fabricated to your design by our Custom Studio.",
    benefits: ["Custom 3D relief and textures", "Book-matched veining", "Print your own design"],
    applications: ["feature-wall", "hotel", "restaurant", "retail"],
    faqs: ["Do you offer custom sizes and book-matching?"],
  },
  {
    name: "Louver Panels",
    slug: "louver-panels",
    group: "sheets-panels",
    intro:
      "Tongue-and-groove louver panels in wood-composite finishes — classic slatted warmth for walls, ceilings, and cabinetry.",
    benefits: ["Classic slatted texture", "Conceals uneven walls", "Wood-composite durability"],
    applications: ["living-room", "bedroom", "office"],
  },
  {
    name: "WPC Beams",
    slug: "wpc-beams",
    group: "sheets-panels",
    intro:
      "Wood-plastic composite beams and ceiling planks for warm architectural ceilings and accent structures.",
    benefits: ["Rot and termite proof", "Realistic wood grain", "Low maintenance"],
    applications: ["living-room", "outdoor", "basement"],
  },
  {
    name: "Faux Crystalline Stone",
    slug: "faux-crystalline-stone",
    group: "stone",
    intro:
      "Translucent crystalline stone, CNC-carved and seamless — stunning backlit for bars, desks, and feature walls.",
    benefits: ["Backlit translucent effect", "CNC-carved to design", "Seamless large slabs"],
    applications: ["feature-wall", "restaurant", "hotel", "retail"],
    faqs: ["Can crystalline stone be backlit?"],
  },
  {
    name: "Faux Nano Stone",
    slug: "faux-nano-stone",
    group: "stone",
    intro: "Nano-engineered stone surface with refined veining and a premium honed feel.",
    benefits: ["Fine, consistent veining", "Stain resistant", "Premium honed finish"],
    applications: ["kitchen", "bathroom", "feature-wall"],
  },
  {
    name: "Artificial Stone",
    slug: "artificial-stone",
    group: "stone",
    intro:
      "Versatile cast stone for columns, cladding, and carved details without natural-stone weight or cost.",
    benefits: [
      "Lightweight vs. natural stone",
      "Moulded to any profile",
      "Suitable for interior and exterior",
    ],
    applications: ["outdoor", "feature-wall", "fireplace"],
  },
  {
    name: "HD Stone",
    slug: "hd-stone",
    group: "stone",
    intro:
      "High-definition printed stone veneer — dramatic natural patterns at a fraction of slab cost.",
    benefits: ["High-definition natural patterns", "Thin and flexible", "Cost effective"],
    applications: ["living-room", "feature-wall", "office"],
    faqs: ["Are your materials suitable for commercial spaces?"],
  },
  {
    name: "Wallpaper",
    slug: "wallpaper",
    group: "walls-backdrops",
    intro:
      "Designer wallpapers — textured, metallic, and mural options curated for premium interiors.",
    benefits: ["Curated designer range", "Professional installation", "Mural and custom options"],
    applications: ["bedroom", "living-room", "retail"],
  },
  {
    name: "Backsplash",
    slug: "backsplash",
    group: "walls-backdrops",
    intro:
      "Kitchen and bathroom backsplashes in stone, glass, and mosaic — grout options matched to your counters.",
    benefits: ["Moisture resistant", "Easy-clean surfaces", "Coordinated with counters"],
    applications: ["kitchen", "bathroom"],
  },
  {
    name: "Feature Walls",
    slug: "feature-walls",
    group: "walls-backdrops",
    intro:
      "Complete feature-wall packages: panels, stone, lighting, and trims designed and installed as one system.",
    benefits: ["Design-to-install service", "Integrated lighting", "Mixed-material packages"],
    applications: ["feature-wall", "living-room", "bedroom", "restaurant"],
  },
  {
    name: "Artificial Gardens",
    slug: "artificial-gardens",
    group: "walls-backdrops",
    intro: "Maintenance-free tropical garden walls — lush greenery that needs no light or water.",
    benefits: ["Zero maintenance", "UV-stable foliage", "Instant biophilic impact"],
    applications: ["outdoor", "restaurant", "retail", "office"],
  },
  {
    name: "Custom Doors",
    slug: "custom-doors",
    group: "custom-fabrication",
    intro:
      "Custom door coverings and complete door transformations in stone, louvers, and 3D panels.",
    benefits: ["Fits existing door frames", "Stone, louver, or 3D faces", "Matching wall packages"],
    applications: ["living-room", "bedroom", "prayer-room"],
  },
  {
    name: "Mandir & Darbar",
    slug: "mandir-darbar",
    group: "custom-fabrication",
    intro:
      "Handcrafted home mandirs and darbars — carved stone, integrated lighting, and storage designed for your space.",
    benefits: ["Custom carved design", "Integrated LED lighting", "Storage and display built in"],
    applications: ["prayer-room"],
    faqs: ["How long does a custom mandir or darbar take?"],
  },
  {
    name: "3D Parametric",
    slug: "3d-parametric",
    group: "custom-fabrication",
    intro:
      "Parametric 3D wall systems — computationally designed relief patterns CNC-cut to your wall dimensions.",
    benefits: ["One-of-a-kind patterns", "Precision CNC cutting", "Scalable to any wall"],
    applications: ["feature-wall", "retail", "hotel", "office"],
  },
  {
    name: "Fireplaces",
    slug: "fireplaces",
    group: "finishing-light",
    intro:
      "2D and 3D LED fireplace surrounds and media walls — warm ambience without gas lines or venting.",
    benefits: ["No venting required", "2D and 3D flame effects", "Media-wall integration"],
    applications: ["fireplace", "living-room"],
    faqs: ["Can PVC panels be used behind a fireplace?"],
  },
  {
    name: "LED Profiles",
    slug: "led-profiles",
    group: "finishing-light",
    intro:
      "Aluminium LED profiles, channels, and diffusers for cove, backlit-panel, and accent lighting.",
    benefits: ["Clean recessed lines", "Even diffuser output", "Full accessory range"],
    applications: ["feature-wall", "ceiling", "kitchen"],
  },
  {
    name: "Trims",
    slug: "trims",
    group: "finishing-light",
    intro:
      "Matching trims, corner pieces, and transition profiles for a clean, professional install finish.",
    benefits: ["Colour-matched finishes", "Clean corners and edges", "Fast installation"],
    applications: ["living-room", "bathroom", "kitchen"],
  },
];

const categoryIds = {};
for (const cat of categorySeeds) {
  const heroId = await placeholderMedia(`cat-${cat.slug}`, cat.name);
  categoryIds[cat.slug] = await upsert("product-categories", "slug", cat.slug, {
    name: cat.name,
    slug: cat.slug,
    group: cat.group,
    heroImage: heroId,
    intro: cat.intro ?? null,
    benefits: (cat.benefits ?? []).map((benefit) => ({ benefit })),
    applications: cat.applications ?? [],
    faqs: (cat.faqs ?? []).map((q) => faqIds[q]).filter(Boolean),
    seo: cat.seo ?? {
      metaTitle: `${cat.name} Winnipeg | PKEE Constructions`,
      metaDescription: `${cat.name} supplied, fabricated, and installed by PKEE Constructions, Winnipeg. 360 Keewatin St.`,
    },
  });
}

console.log("Seeding Products…");
const productSeeds = [
  {
    name: "Classic Marble PVC Wall Panel",
    slug: "classic-marble-pvc-panel",
    category: "pvc-wall-panels",
    featured: true,
    summary:
      "Waterproof interlocking PVC panel with a realistic Carrara marble face — grout-free luxury for bathrooms and feature walls.",
    description:
      "Our signature PVC wall panel: a 100% waterproof, fire-resistant core printed with high-definition Carrara veining. Clicks together over existing tile or drywall — a full bathroom wall in a day, no grout, no mess.",
    finishes: [
      { name: "Gloss", swatch: "#F0EDE6" },
      { name: "Matte", swatch: "#E4DFD5" },
    ],
    colors: [
      { name: "Carrara White", hex: "#F0EDE6" },
      { name: "Statuario", hex: "#E8E4DC" },
      { name: "Nero Marquina", hex: "#26241F" },
    ],
    sizes: [{ size: "8 × 4 ft (2440 × 1220 mm)" }, { size: "10 × 4 ft (3050 × 1220 mm)" }],
    material: "Waterproof PVC core, HD printed marble face",
    cuttingMethod: "Score-and-snap or fine-tooth saw",
    thickness: "5 mm / 8 mm",
    properties: ["waterproof", "fire-resistant", "easy-install", "budget-friendly"],
    applications: ["bathroom", "living-room", "bedroom", "basement", "feature-wall"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: false,
    seo: {
      metaTitle: "Classic Marble PVC Wall Panel | PKEE Constructions",
      metaDescription:
        "Waterproof marble-look PVC wall panels, supplied and installed in Winnipeg. Grout-free bathroom walls in a day.",
    },
  },
  {
    name: "Heritage Oak PVC Wall Panel",
    slug: "heritage-oak-pvc-panel",
    category: "pvc-wall-panels",
    summary:
      "Warm woodgrain PVC panel with a deep embossed oak texture — the look of slatted oak at a fraction of the cost.",
    description:
      "Deep-embossed oak grain gives Heritage Oak a convincing timber feel. Fully waterproof and termite-proof, it brings warmth to bathrooms, basements, and bedrooms without any of wood's maintenance.",
    finishes: [
      { name: "Textured", swatch: "#B08D57" },
      { name: "Matte", swatch: "#A67C4E" },
    ],
    colors: [
      { name: "Natural Oak", hex: "#B08D57" },
      { name: "Smoked Walnut", hex: "#5C4033" },
      { name: "Driftwood Grey", hex: "#9A938A" },
    ],
    sizes: [{ size: "8 × 4 ft (2440 × 1220 mm)" }, { size: "8 × 2 ft V-groove (2440 × 610 mm)" }],
    material: "Waterproof PVC core, embossed woodgrain laminate",
    cuttingMethod: "Fine-tooth saw",
    thickness: "8 mm",
    properties: ["waterproof", "fire-resistant", "easy-install", "budget-friendly"],
    applications: ["bedroom", "living-room", "basement", "bathroom"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: false,
  },
  {
    name: "Fluted Slat PVC Panel",
    slug: "fluted-slat-pvc-panel",
    category: "pvc-wall-panels",
    featured: true,
    summary:
      "Vertical fluted PVC slats — the designer feature-wall look, lightweight and fully waterproof.",
    description:
      "Vertical fluting catches light and shadow across the wall. Fluted Slat panels interlock edge-to-edge for a continuous rhythm, ideal for TV walls, headboards, and commercial feature walls.",
    finishes: [
      { name: "Satin", swatch: "#D9D2C4" },
      { name: "Matte Black", swatch: "#2E2A24" },
    ],
    colors: [
      { name: "Ivory", hex: "#F2EDE4" },
      { name: "Graphite", hex: "#3B3833" },
      { name: "Brass Taupe", hex: "#B08D57" },
    ],
    sizes: [
      { size: "9.8 × 1.2 ft slat (3000 × 370 mm)" },
      { size: "8 × 4 ft sheet (2440 × 1220 mm)" },
    ],
    material: "Co-extruded PVC, fluted profile",
    cuttingMethod: "Miter or fine-tooth saw",
    thickness: "9 mm (flute depth 25 mm)",
    properties: ["waterproof", "fire-resistant", "easy-install", "eco-friendly"],
    applications: ["feature-wall", "living-room", "bedroom", "office", "retail"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: true,
  },
  {
    name: "Brushed Metal PVC Panel",
    slug: "brushed-metal-pvc-panel",
    category: "pvc-wall-panels",
    summary:
      "Metallic-finish PVC panels for kitchens, offices, and retail — the industrial look without metal's cost or weight.",
    description:
      "A brushed metallic laminate over a waterproof PVC core. Resists fingerprints and steam, making it a practical choice for kitchen walls, elevator surrounds, and retail fit-outs.",
    finishes: [
      { name: "Brushed", swatch: "#B8B2A6" },
      { name: "Hairline", swatch: "#8F897D" },
    ],
    colors: [
      { name: "Champagne", hex: "#C9BFAE" },
      { name: "Gunmetal", hex: "#5A564E" },
      { name: "Copper", hex: "#B87352" },
    ],
    sizes: [{ size: "8 × 4 ft (2440 × 1220 mm)" }],
    material: "PVC core, brushed metallic PET laminate",
    cuttingMethod: "Fine-tooth saw",
    thickness: "5 mm",
    properties: ["waterproof", "scratch-resistant", "easy-install", "budget-friendly"],
    applications: ["kitchen", "office", "retail", "restaurant"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: false,
  },
  {
    name: "Lumière Backlit PVC Panel",
    slug: "lumiere-backlit-pvc-panel",
    category: "pvc-wall-panels",
    summary:
      "Translucent PVC panel engineered for LED backlighting — glowing marble effects without stone slab pricing.",
    description:
      "A translucent PVC face diffuses LED light evenly for a soft, backlit stone effect. Pairs with our LED profiles for glowing headboards, reception walls, and spa-style bathrooms.",
    finishes: [{ name: "Translucent Gloss", swatch: "#EDE8DE" }],
    colors: [
      { name: "Onyx White", hex: "#F5F2EC" },
      { name: "Amber Vein", hex: "#C8A165" },
    ],
    sizes: [{ size: "8 × 4 ft (2440 × 1220 mm)" }],
    material: "Translucent PVC, light-diffusing face",
    cuttingMethod: "Fine-tooth saw",
    thickness: "8 mm",
    properties: ["waterproof", "fire-resistant", "easy-install"],
    applications: ["feature-wall", "bedroom", "bathroom", "hotel"],
    indoorOutdoor: "indoor",
    backlit: true,
    customizable: true,
  },
  {
    name: "Calacatta Decor Sheet",
    slug: "calacatta-decor-sheet",
    category: "decor-sheet",
    featured: true,
    summary:
      "Large-format decor sheet with dramatic Calacatta veining — seamless stone looks for whole walls.",
    description:
      "Our best-selling decor sheet reproduces Calacatta marble in a 4×8 ft format with book-matchable faces. Installs flat over prepared drywall for a seamless stone wall in hours.",
    finishes: [
      { name: "Polished", swatch: "#F0EDE6" },
      { name: "Honed", swatch: "#E8E4DC" },
    ],
    colors: [{ name: "Calacatta Gold", hex: "#EFEAE0" }],
    sizes: [{ size: "8 × 4 ft (2440 × 1220 mm)" }, { size: "10 × 4 ft (3050 × 1220 mm)" }],
    material: "Stone-composite core, printed Calacatta face",
    cuttingMethod: "Track saw or CNC",
    thickness: "3 mm / 5 mm",
    properties: ["scratch-resistant", "eco-friendly", "easy-install"],
    applications: ["living-room", "feature-wall", "office", "hotel"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: false,
  },
  {
    name: "Terra 3D Book-Match Decor Sheet",
    slug: "terra-3d-book-match",
    category: "customized-decor-sheet",
    summary:
      "Custom 3D-relief book-matched sheets — our studio fabricates your veining pattern in relief.",
    description:
      "Terra takes customized decor sheets further: a 3D relief surface CNC-carved to match your chosen veining, mirrored book-match across sheets. Every project is one of one.",
    finishes: [
      { name: "3D Relief", swatch: "#8C5B3F" },
      { name: "Satin Relief", swatch: "#A07654" },
    ],
    colors: [
      { name: "Terracotta Vein", hex: "#8C5B3F" },
      { name: "Sage Mineral", hex: "#9BA18A" },
    ],
    sizes: [{ size: "Custom to 10 × 5 ft" }],
    material: "Composite core, CNC-carved 3D relief",
    cuttingMethod: "CNC (fabricated in-house)",
    thickness: "9 mm",
    properties: ["scratch-resistant", "eco-friendly"],
    applications: ["feature-wall", "hotel", "restaurant", "retail"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: true,
  },
  {
    name: "Walnut Louver Panel",
    slug: "walnut-louver-panel",
    category: "louver-panels",
    summary:
      "Tongue-and-groove walnut-finish louver panels — timeless slatted warmth for walls and ceilings.",
    description:
      "Classic louver slats in a rich walnut stain. The tongue-and-groove system conceals fasteners and uneven substrates, wrapping rooms in continuous wood warmth.",
    finishes: [
      { name: "Walnut Stain", swatch: "#5C4033" },
      { name: "Natural", swatch: "#B08D57" },
    ],
    colors: [
      { name: "Dark Walnut", hex: "#5C4033" },
      { name: "Natural Ash", hex: "#C9BFAE" },
    ],
    sizes: [{ size: "8 × 6 in slat (2440 × 150 mm)" }, { size: "8 × 4 ft sheet (2440 × 1220 mm)" }],
    material: "WPC core, walnut veneer laminate",
    cuttingMethod: "Miter saw",
    thickness: "12 mm slat",
    properties: ["scratch-resistant", "easy-install", "eco-friendly"],
    applications: ["living-room", "bedroom", "office"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: false,
  },
  {
    name: "Rustic WPC Ceiling Beam",
    slug: "rustic-wpc-ceiling-beam",
    category: "wpc-beams",
    summary:
      "Wood-plastic composite beams and planks — reclaimed-wood ceilings with zero rot or termite risk.",
    description:
      "WPC beams deliver the look of heavy timber without the weight, cost, or upkeep. Ideal for coffered ceilings, pergolas, and basement finishing.",
    finishes: [
      { name: "Reclaimed", swatch: "#7A5C3E" },
      { name: "Driftwood", swatch: "#9A938A" },
    ],
    colors: [
      { name: "Barnwood Brown", hex: "#7A5C3E" },
      { name: "Coastal Grey", hex: "#9A938A" },
    ],
    sizes: [{ size: "Beam 10 ft (3050 mm)" }, { size: "Plank 8 × 8 in (2440 × 200 mm)" }],
    material: "Wood-plastic composite",
    cuttingMethod: "Standard wood tools",
    thickness: "40 mm beam wall",
    properties: ["waterproof", "eco-friendly", "easy-install"],
    applications: ["living-room", "outdoor", "basement"],
    indoorOutdoor: "both",
    backlit: false,
    customizable: false,
  },
  {
    name: "Onyx Glow Faux Crystalline Stone",
    slug: "onyx-glow-crystalline-stone",
    category: "faux-crystalline-stone",
    featured: true,
    summary:
      "CNC-carved crystalline stone, backlit — a glowing onyx feature for bars, desks, and sanctuaries.",
    description:
      "Translucent crystalline stone carved in-house on our CNC. Backlit with LED it glows like natural onyx; book-matched slabs join seamlessly across entire walls.",
    finishes: [{ name: "Polished", swatch: "#E8DCC8" }],
    colors: [
      { name: "Honey Onyx", hex: "#D8B87E" },
      { name: "Glacier", hex: "#EDE8DE" },
    ],
    sizes: [{ size: "Slab up to 10 × 5 ft" }],
    material: "Faux crystalline composite, translucent",
    cuttingMethod: "CNC-carved in-house",
    thickness: "12 mm",
    properties: ["scratch-resistant", "eco-friendly"],
    applications: ["feature-wall", "restaurant", "hotel", "retail", "prayer-room"],
    indoorOutdoor: "indoor",
    backlit: true,
    customizable: true,
  },
  {
    name: "Nuvola Faux Nano Stone",
    slug: "nuvola-faux-nano-stone",
    category: "faux-nano-stone",
    summary:
      "Honed nano stone with cloud-soft veining — premium stone feel for kitchens and baths.",
    description:
      "Nuvola's nano-engineered surface resists stains and etching while keeping the cool, honed feel of natural stone.",
    finishes: [{ name: "Honed", swatch: "#E8E4DC" }],
    colors: [
      { name: "Cloud White", hex: "#EFEDE8" },
      { name: "Dove Grey", hex: "#C4C0B8" },
    ],
    sizes: [{ size: "Slab 10 × 5 ft (3050 × 1520 mm)" }],
    material: "Nano-engineered stone composite",
    cuttingMethod: "CNC / waterjet",
    thickness: "10 mm",
    properties: ["scratch-resistant", "waterproof", "eco-friendly"],
    applications: ["kitchen", "bathroom", "feature-wall"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: false,
  },
  {
    name: "Strata HD Stone Veneer",
    slug: "strata-hd-stone-veneer",
    category: "hd-stone",
    summary:
      "High-definition stone veneer — dramatic strata patterns, thin enough to fit anywhere.",
    description:
      "Strata prints ultra-high-definition mineral photography onto a thin flexible substrate, wrapping columns, bulkheads, and entire feature walls in stone strata.",
    finishes: [
      { name: "Matte", swatch: "#8F897D" },
      { name: "Satin", swatch: "#A89C88" },
    ],
    colors: [
      { name: "Sedona Strata", hex: "#A07654" },
      { name: "Basalt", hex: "#4A453E" },
    ],
    sizes: [{ size: "Sheet 8 × 4 ft (2440 × 1220 mm)" }],
    material: "Flexible mineral-print substrate",
    cuttingMethod: "Utility knife or saw",
    thickness: "2 mm",
    properties: ["scratch-resistant", "easy-install", "budget-friendly"],
    applications: ["feature-wall", "living-room", "office", "retail"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: false,
  },
  {
    name: "Verde Artificial Garden Wall",
    slug: "verde-artificial-garden-wall",
    category: "artificial-gardens",
    summary:
      "Maintenance-free tropical garden walls — lush, UV-stable greenery for indoors and out.",
    description:
      "Verde panels interlock into dense tropical walls with zero watering, no light requirements, and UV-stable foliage rated for Canadian winters.",
    finishes: [
      { name: "Tropical Mix", swatch: "#5B6B4F" },
      { name: "Fern", swatch: "#6E7D5A" },
    ],
    colors: [
      { name: "Evergreen", hex: "#5B6B4F" },
      { name: "Olive", hex: "#7A7C55" },
    ],
    sizes: [{ size: "Panel 3.3 × 3.3 ft (1000 × 1000 mm)" }],
    material: "UV-stable PE foliage on grid",
    cuttingMethod: "Scissors / shears",
    thickness: "Panel 50 mm foliage depth",
    properties: ["waterproof", "easy-install", "budget-friendly"],
    applications: ["outdoor", "restaurant", "retail", "office"],
    indoorOutdoor: "both",
    backlit: false,
    customizable: false,
  },
  {
    name: "Kinesis 3D Parametric Wall",
    slug: "kinesis-3d-parametric-wall",
    category: "3d-parametric",
    summary:
      "Computationally designed 3D relief walls — parametric patterns CNC-cut to your dimensions.",
    description:
      "Kinesis turns algorithmic patterns into physical relief: waves, folds, and gradients CNC-milled to your exact wall dimensions, primed and ready for paint or metallic finish.",
    finishes: [
      { name: "Primed", swatch: "#F2EDE4" },
      { name: "Metallic", swatch: "#B08D57" },
    ],
    colors: [
      { name: "Gallery White", hex: "#F2EDE4" },
      { name: "Burnished Brass", hex: "#B08D57" },
    ],
    sizes: [{ size: "Custom modules to 4 × 4 ft" }],
    material: "MDF / solid surface, CNC parametric relief",
    cuttingMethod: "CNC (fabricated in-house)",
    thickness: "25–75 mm relief",
    properties: ["scratch-resistant", "eco-friendly"],
    applications: ["feature-wall", "retail", "hotel", "office"],
    indoorOutdoor: "indoor",
    backlit: false,
    customizable: true,
  },
  {
    name: "Ember 3D LED Fireplace",
    slug: "ember-3d-led-fireplace",
    category: "fireplaces",
    featured: true,
    summary:
      "2D/3D LED flame fireplace surrounds — cosy ambience and media-wall integration, no venting.",
    description:
      "Ember pairs a realistic 3D flame insert with a custom surround in stone, PVC, or 3D panels. Runs on a standard outlet — no gas, no venting, full heat-free ambience.",
    finishes: [
      { name: "Stone Surround", swatch: "#4A453E" },
      { name: "Slat Surround", swatch: "#5C4033" },
    ],
    colors: [
      { name: "Charcoal Stone", hex: "#3B3833" },
      { name: "Walnut Slat", hex: "#5C4033" },
    ],
    sizes: [{ size: "Custom to 12 ft width" }],
    material: "LED flame insert + custom surround",
    cuttingMethod: "Fabricated in-house",
    thickness: "Surround to design",
    properties: ["easy-install", "eco-friendly"],
    applications: ["fireplace", "living-room", "bedroom"],
    indoorOutdoor: "indoor",
    backlit: true,
    customizable: true,
  },
  {
    name: "Linea LED Profile System",
    slug: "linea-led-profile-system",
    category: "led-profiles",
    summary:
      "Aluminium LED channels and diffusers — clean recessed lines for coves, panels, and accents.",
    description:
      "Linea covers the full range: surface, recessed, and corner profiles with frosted diffusers for even light. Cut to length and paired with our panels for backlit installs.",
    finishes: [
      { name: "Anodized Silver", swatch: "#C4C0B8" },
      { name: "Black", swatch: "#2E2A24" },
    ],
    colors: [
      { name: "Silver", hex: "#C4C0B8" },
      { name: "Matte Black", hex: "#2E2A24" },
    ],
    sizes: [{ size: "8 ft (2440 mm) — cut to length" }],
    material: "Anodized aluminium, PC diffuser",
    cuttingMethod: "Miter saw",
    thickness: "10 / 17 / 25 mm channel",
    properties: ["easy-install", "budget-friendly"],
    applications: ["feature-wall", "ceiling", "kitchen"],
    indoorOutdoor: "both",
    backlit: true,
    customizable: false,
  },
];

const productIds = {};
for (const p of productSeeds) {
  const heroId = await placeholderMedia(`prod-${p.slug}`, p.name);
  const galleryId = await placeholderMedia(`prod-${p.slug}-g2`, `${p.name} — detail`);
  const related = productSeeds
    .filter((r) => r.category === p.category && r.slug !== p.slug)
    .slice(0, 3)
    .map((r) => productIds[r.slug])
    .filter(Boolean);
  productIds[p.slug] = await upsert("products", "slug", p.slug, {
    name: p.name,
    slug: p.slug,
    category: categoryIds[p.category],
    summary: p.summary,
    description: richText(p.description),
    heroImage: heroId,
    gallery: [galleryId],
    finishes: p.finishes,
    colors: p.colors,
    sizes: p.sizes,
    material: p.material,
    cuttingMethod: p.cuttingMethod,
    thickness: p.thickness,
    properties: p.properties,
    applications: p.applications,
    indoorOutdoor: p.indoorOutdoor,
    backlit: p.backlit,
    customizable: p.customizable,
    relatedProducts: related,
    featured: p.featured ?? false,
    placeholderMedia: true,
    seo: p.seo ?? { metaTitle: `${p.name} | PKEE Constructions`, metaDescription: p.summary },
    _status: "published",
  });
}

console.log("Seeding Solutions…");
const solutionSeeds = [
  {
    slug: "living-room",
    name: "Living Room",
    intro:
      "Feature walls, slatted warmth, and media-wall fireplaces for the room everyone gathers in.",
    products: [
      "fluted-slat-pvc-panel",
      "walnut-louver-panel",
      "ember-3d-led-fireplace",
      "strata-hd-stone-veneer",
    ],
  },
  {
    slug: "kitchen",
    name: "Kitchen",
    intro:
      "Waterproof panels and stone backsplashes that stand up to steam, splashes, and daily cleanup.",
    products: [
      "brushed-metal-pvc-panel",
      "nuvola-faux-nano-stone",
      "linea-led-profile-system",
      "classic-marble-pvc-panel",
    ],
  },
  {
    slug: "bathroom",
    name: "Bathroom",
    intro:
      "100% waterproof PVC panels and nano stone — grout-free walls that stay beautiful for years.",
    products: [
      "classic-marble-pvc-panel",
      "heritage-oak-pvc-panel",
      "lumiere-backlit-pvc-panel",
      "nuvola-faux-nano-stone",
    ],
  },
  {
    slug: "bedroom",
    name: "Bedroom",
    intro: "Soft-touch fluted panels, warm louvers, and backlit headboards for restful retreats.",
    products: [
      "fluted-slat-pvc-panel",
      "heritage-oak-pvc-panel",
      "lumiere-backlit-pvc-panel",
      "walnut-louver-panel",
    ],
  },
  {
    slug: "office",
    name: "Office",
    intro:
      "Professional slat walls, stone veneer reception features, and low-maintenance finishes for workspaces.",
    products: [
      "brushed-metal-pvc-panel",
      "strata-hd-stone-veneer",
      "walnut-louver-panel",
      "kinesis-3d-parametric-wall",
    ],
  },
  {
    slug: "restaurant",
    name: "Restaurant",
    intro:
      "Backlit crystalline bars, garden walls, and durable feature surfaces built for hospitality traffic.",
    products: [
      "onyx-glow-crystalline-stone",
      "verde-artificial-garden-wall",
      "terra-3d-book-match",
      "strata-hd-stone-veneer",
    ],
  },
  {
    slug: "retail",
    name: "Retail",
    intro:
      "High-impact 3D parametric displays and metallic panels that make product walls unforgettable.",
    products: [
      "kinesis-3d-parametric-wall",
      "brushed-metal-pvc-panel",
      "verde-artificial-garden-wall",
      "onyx-glow-crystalline-stone",
    ],
  },
  {
    slug: "hotel",
    name: "Hotel",
    intro:
      "Book-matched stone, backlit crystalline, and quiet luxury panels for lobbies and suites.",
    products: [
      "terra-3d-book-match",
      "onyx-glow-crystalline-stone",
      "calacatta-decor-sheet",
      "fluted-slat-pvc-panel",
    ],
  },
  {
    slug: "outdoor",
    name: "Outdoor",
    intro: "WPC beams, garden walls, and weather-rated panels for patios, pergolas, and exteriors.",
    products: [
      "rustic-wpc-ceiling-beam",
      "verde-artificial-garden-wall",
      "linea-led-profile-system",
    ],
  },
  {
    slug: "feature-wall",
    name: "Feature Wall",
    intro:
      "The signature PKEE wall — panels, stone, 3D relief, and lighting composed as one system.",
    products: [
      "fluted-slat-pvc-panel",
      "onyx-glow-crystalline-stone",
      "kinesis-3d-parametric-wall",
      "calacatta-decor-sheet",
    ],
  },
  {
    slug: "fireplace",
    name: "Fireplace",
    intro: "LED fireplace surrounds and heat-safe stone — ambience without the renovation.",
    products: ["ember-3d-led-fireplace", "classic-marble-pvc-panel", "strata-hd-stone-veneer"],
  },
  {
    slug: "prayer-room",
    name: "Prayer Room",
    intro: "Custom mandirs and darbars — carved stone, soft lighting, and serene backlit surfaces.",
    products: ["onyx-glow-crystalline-stone", "lumiere-backlit-pvc-panel", "calacatta-decor-sheet"],
  },
];
for (const s of solutionSeeds) {
  const heroId = await placeholderMedia(`sol-${s.slug}`, `${s.name} — PKEE`);
  await upsert("solutions", "slug", s.slug, {
    name: s.name,
    slug: s.slug,
    heroImage: heroId,
    intro: s.intro,
    recommendedProducts: s.products.map((p) => productIds[p]).filter(Boolean),
    faqs: [faqIds["How do I get a quote?"]].filter(Boolean),
    seo: {
      metaTitle: `${s.name} Design Ideas & Materials Winnipeg | PKEE Constructions`,
      metaDescription: s.intro,
    },
    _status: "published",
  });
}

console.log("Seeding Projects…");
const projectSeeds = [
  {
    slug: "river-heights-marble-bath",
    title: "River Heights Marble Bath",
    location: "Winnipeg, MB",
    type: "residential",
    room: ["bathroom"],
    beforeAfter: true,
    featured: true,
    products: ["classic-marble-pvc-panel", "nuvola-faux-nano-stone"],
    materials: ["Classic Marble PVC Panel", "Nuvola Faux Nano Stone", "Matching trim system"],
    description:
      "A dated 1990s ensuite rewrapped in Carrara-look PVC panels over existing tile — waterproof, grout-free, finished in three days including new LED-lit mirror wall.",
    services: ["Supply", "Design consultation", "Installation"],
    completionDate: "2026-05-20",
  },
  {
    slug: "exchange-district-cafe-feature",
    title: "Exchange District Café Feature Wall",
    location: "Winnipeg, MB",
    type: "commercial",
    room: ["restaurant"],
    beforeAfter: false,
    featured: true,
    products: ["terra-3d-book-match", "linea-led-profile-system", "verde-artificial-garden-wall"],
    materials: [
      "Terra 3D Book-Match Decor Sheet",
      "Verde Artificial Garden Wall",
      "Linea LED Profile System",
    ],
    description:
      "A café re-fit pairing a backlit book-match relief wall with a maintenance-free garden wall behind the counter — Instagram queue included, at no extra charge.",
    services: ["Supply", "Custom fabrication", "Installation"],
    completionDate: "2026-04-11",
  },
  {
    slug: "bridgwater-fluted-media-wall",
    title: "Bridgwater Fluted Media Wall",
    location: "Winnipeg, MB",
    type: "residential",
    room: ["living-room", "feature-wall"],
    beforeAfter: true,
    featured: false,
    products: ["fluted-slat-pvc-panel", "ember-3d-led-fireplace"],
    materials: ["Fluted Slat PVC Panel (Graphite)", "Ember 3D LED Fireplace"],
    description:
      "Full-height fluted media wall with integrated 3D LED fireplace — warmth, texture, and zero venting in a new-build great room.",
    services: ["Design", "Supply", "Installation"],
    completionDate: "2026-03-02",
  },
  {
    slug: "osborne-village-boutique",
    title: "Osborne Village Boutique Fit-Out",
    location: "Winnipeg, MB",
    type: "commercial",
    room: ["retail"],
    beforeAfter: false,
    featured: false,
    products: ["kinesis-3d-parametric-wall", "brushed-metal-pvc-panel"],
    materials: ["Kinesis 3D Parametric Wall (Burnished Brass)", "Brushed Metal PVC Panel"],
    description:
      "A parametric brass feature wall anchors the fitting-room corridor, with metallic panels wrapping the cash desk — high drama, fast clean-down.",
    services: ["Custom fabrication", "Supply"],
    completionDate: "2025-11-28",
  },
  {
    slug: "charleswood-basement-oak",
    title: "Charleswood Basement Oak Re-Wrap",
    location: "Winnipeg, MB",
    type: "residential",
    room: ["basement", "living-room"],
    beforeAfter: false,
    featured: false,
    products: ["heritage-oak-pvc-panel", "rustic-wpc-ceiling-beam"],
    materials: ["Heritage Oak PVC Panel", "Rustic WPC Ceiling Beam (Coastal Grey)"],
    description:
      "A moisture-prone basement finished in waterproof oak panels and grey WPC beams — a warm family den where drywall kept failing.",
    services: ["Supply", "Installation"],
    completionDate: "2025-09-15",
  },
  {
    slug: "downtown-hotel-lobby-backlit",
    title: "Downtown Hotel Lobby Backlit Stone",
    location: "Winnipeg, MB",
    type: "commercial",
    room: ["hotel", "feature-wall"],
    beforeAfter: false,
    featured: true,
    products: ["onyx-glow-crystalline-stone", "linea-led-profile-system"],
    materials: ["Onyx Glow Faux Crystalline Stone", "Linea LED Profile System"],
    description:
      "Twelve metres of seamless backlit crystalline stone behind the reception desk — book-matched, CNC-carved, glowing amber at night.",
    services: ["Custom fabrication", "Supply", "Installation"],
    completionDate: "2026-01-30",
  },
];
const projectIds = {};
for (const pr of projectSeeds) {
  const heroId = await placeholderMedia(`proj-${pr.slug}`, pr.title);
  const galleryIds = [await placeholderMedia(`proj-${pr.slug}-g2`, `${pr.title} — detail 1`)];
  const data = {
    title: pr.title,
    slug: pr.slug,
    location: pr.location,
    heroImage: heroId,
    type: pr.type,
    room: pr.room,
    productsUsed: pr.products.map((p) => productIds[p]).filter(Boolean),
    materialsUsed: pr.materials.map((material) => ({ material })),
    gallery: galleryIds,
    description: pr.description,
    completionDate: pr.completionDate,
    services: pr.services.map((service) => ({ service })),
    featured: pr.featured,
    seo: {
      metaTitle: `${pr.title} | PKEE Constructions Projects`,
      metaDescription: pr.description.slice(0, 155),
    },
    _status: "published",
  };
  if (pr.beforeAfter) {
    data.beforeImage = await placeholderMedia(`proj-${pr.slug}-before`, `${pr.title} — before`);
    data.afterImage = await placeholderMedia(`proj-${pr.slug}-after`, `${pr.title} — after`);
  }
  projectIds[pr.slug] = await upsert("projects", "slug", pr.slug, data);
}

console.log("Seeding Testimonials…");
const testimonialSeeds = [
  {
    name: "Amara K.",
    rating: 5,
    text: "Our bathroom went from tired tile to a marble-panelled retreat in three days. No grout to scrub, ever. Worth every dollar.",
    project: "river-heights-marble-bath",
    product: "classic-marble-pvc-panel",
    location: "Winnipeg, MB",
    verified: true,
    featured: true,
  },
  {
    name: "Devon R.",
    rating: 5,
    text: "The backlit stone wall behind our reception desk stops people mid-lobby. PKEE's install crew was meticulous and on schedule.",
    project: "downtown-hotel-lobby-backlit",
    product: "onyx-glow-crystalline-stone",
    location: "Winnipeg, MB",
    verified: true,
    featured: true,
  },
  {
    name: "Priya S.",
    rating: 5,
    text: "They designed our mandir with carved stone and soft lighting exactly as we imagined. The craftsmanship is beautiful.",
    product: "onyx-glow-crystalline-stone",
    location: "Winnipeg, MB",
    verified: true,
    featured: false,
  },
  {
    name: "Marc T.",
    rating: 4,
    text: "Fluted panels turned a plain TV wall into the best feature of our new build. Quote was clear, install was clean.",
    project: "bridgwater-fluted-media-wall",
    product: "fluted-slat-pvc-panel",
    location: "Winnipeg, MB",
    verified: true,
    featured: false,
  },
  {
    name: "Elena V.",
    rating: 5,
    text: "As a designer I need suppliers who hit spec and date. PKEE's parametric wall for my retail client did both — flawless edges.",
    project: "osborne-village-boutique",
    product: "kinesis-3d-parametric-wall",
    location: "Winnipeg, MB",
    verified: false,
    featured: true,
  },
  {
    name: "Jordan M.",
    rating: 5,
    text: "Basement finally feels like part of the house. The oak panels look real and have survived two humid Winnipeg summers.",
    project: "charleswood-basement-oak",
    product: "heritage-oak-pvc-panel",
    location: "Winnipeg, MB",
    verified: true,
    featured: false,
  },
  {
    name: "Sofia L.",
    rating: 4,
    text: "Great range in the showroom — we compared five panel lines side by side before choosing. The sample program made deciding easy.",
    product: "calacatta-decor-sheet",
    location: "Winnipeg, MB",
    verified: false,
    featured: false,
  },
  {
    name: "Arjun P.",
    rating: 5,
    text: "Book-matched sheets for our café wall plus a garden wall behind the bar — customers photograph it daily. Great trade support too.",
    project: "exchange-district-cafe-feature",
    product: "terra-3d-book-match",
    location: "Winnipeg, MB",
    verified: true,
    featured: false,
  },
];
for (const t of testimonialSeeds) {
  await upsert("testimonials", "name", t.name, {
    name: t.name,
    rating: t.rating,
    text: t.text,
    project: t.project ? projectIds[t.project] : null,
    product: t.product ? productIds[t.product] : null,
    location: t.location,
    verified: t.verified,
    featured: t.featured,
    _status: "published",
  });
}

console.log("Seeding Pages…");
const homeHeroId = await placeholderMedia("page-home-hero", "PKEE Constructions showroom");
await upsert("pages", "slug", "home", {
  title: "Home",
  slug: "home",
  blocks: [
    {
      blockType: "hero",
      heading: "Premium surfaces, engineered for Winnipeg homes & businesses",
      subheading:
        "PVC wall panels, stone, and custom fabrication — supplied, fabricated, and installed by one team at 360 Keewatin St.",
      image: homeHeroId,
    },
    {
      blockType: "statsBand",
      stats: [
        { label: "Sq ft installed", value: "250,000+" },
        { label: "Product lines", value: "19" },
        { label: "Designs in stock", value: "400+" },
      ],
    },
    {
      blockType: "ctaBand",
      heading: "Let's build your space",
      subheading: "Tell us about your project — get a detailed quote within one business day.",
      buttonLabel: "Request a Quote",
      buttonHref: "/quote",
    },
  ],
  seo: {
    metaTitle: "PKEE Constructions | Premium Decorative Building Materials Winnipeg",
    metaDescription:
      "PVC wall panels, decor sheets, stone, and custom fabrication. Supply + install at 360 Keewatin St, Winnipeg. Request a quote today.",
  },
  _status: "published",
});

const aboutHeroId = await placeholderMedia("page-about-hero", "PKEE Constructions — our story");
await upsert("pages", "slug", "about", {
  title: "About",
  slug: "about",
  blocks: [
    {
      blockType: "hero",
      heading: "A digital showroom with a real workshop behind it",
      subheading:
        "PKEE Constructions supplies, fabricates, and installs premium decorative surfaces from our Keewatin St showroom. [SEED-PLACEHOLDER copy — replace with the real company story.]",
      image: aboutHeroId,
    },
    {
      blockType: "richText",
      content: richText(
        "[SEED-PLACEHOLDER copy] Founded in Winnipeg, PKEE brings premium interior surfaces — PVC wall panels, decor sheets, faux stone, and custom fabrication — to homes and businesses across Manitoba. Replace this paragraph with the verified company history, principals, and milestones.",
      ),
    },
    {
      blockType: "ctaBand",
      heading: "Visit the showroom",
      subheading: "360 Keewatin St, Winnipeg — see full-size installed displays.",
      buttonLabel: "Book a Consultation",
      buttonHref: "/consultation",
    },
  ],
  seo: {
    metaTitle: "About PKEE Constructions | Winnipeg",
    metaDescription:
      "Premium decorative building materials — supplier, fabricator, installer. Showroom at 360 Keewatin St, Winnipeg.",
  },
  _status: "draft",
});

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

await rm(mediaDir, { recursive: true, force: true });

const order = [
  "faqs",
  "product-categories",
  "products",
  "solutions",
  "projects",
  "testimonials",
  "pages",
];
console.log("\nSeed complete.\n");
console.log("Collection".padEnd(22), "Created".padStart(8), "Updated".padStart(8));
console.log("-".repeat(38));
for (const c of order) {
  const { created, updated } = counts.get(c) ?? { created: 0, updated: 0 };
  console.log(c.padEnd(22), String(created).padStart(8), String(updated).padStart(8));
}

await payload.destroy();
process.exit(0);
