// One-off (not committed): read-back verification of seed results.
// Usage: node scripts/tmp-verify.mjs
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { config } = await import("dotenv");
config({ path: path.join(rootDir, ".env"), quiet: true });

const { createJiti } = await import("jiti");
const jiti = createJiti(import.meta.url);
const { default: payloadConfig } = await jiti.import(path.join(rootDir, "payload.config.ts"));
const { getPayload } = await import("payload");
const payload = await getPayload({ config: payloadConfig });

const collections = [
  "faqs",
  "product-categories",
  "products",
  "solutions",
  "projects",
  "testimonials",
  "pages",
  "media",
  "quotes",
  "dealer-applications",
  "sample-requests",
  "consultations",
  "contact-messages",
  "users",
];
console.log("Read-back counts (published) and draft counts where versioned:");
for (const c of collections) {
  const { totalDocs } = await payload.find({ collection: c, limit: 0 });
  let drafts = "-";
  try {
    const res = await payload.find({
      collection: c,
      limit: 0,
      draft: true,
      where: { _status: { equals: "draft" } },
    });
    drafts = res.totalDocs;
  } catch {}
  console.log(`  ${c.padEnd(22)} total=${String(totalDocs).padStart(4)}  drafts=${drafts}`);
}

const placeholderMedia = await payload.find({
  collection: "media",
  limit: 0,
  where: { placeholder: { equals: true } },
});
console.log(`\nMedia flagged placeholder=true: ${placeholderMedia.totalDocs}`);
const badAlt = placeholderMedia.docs.filter((d) => !d.alt.startsWith("[SEED-PLACEHOLDER]"));
console.log(`Seeded media missing alt prefix: ${badAlt.length}`);

const pvc = await payload.find({
  collection: "products",
  where: { "category.slug": { equals: "pvc-wall-panels" } },
  limit: 0,
});
console.log(`Products in PVC Wall Panels category: ${pvc.totalDocs}`);

const pvcPanel = await payload.find({
  collection: "products",
  where: { slug: { equals: "classic-marble-pvc-panel" } },
  depth: 1,
  limit: 1,
});
const p = pvcPanel.docs[0];
console.log(
  `classic-marble-pvc-panel: finishes=${p.finishes.length}, colors=${p.colors.length}, sizes=${p.sizes.length}, properties=${p.properties.length}, hero sizes=${Object.keys(p.heroImage.sizes ?? {}).join(",") || "none"}`,
);

const beforeAfter = await payload.find({
  collection: "projects",
  limit: 0,
  where: { and: [{ beforeImage: { exists: true } }, { afterImage: { exists: true } }] },
});
console.log(`Projects with before+after: ${beforeAfter.totalDocs}`);

const home = await payload.find({
  collection: "pages",
  where: { slug: { equals: "home" } },
  limit: 1,
});
const about = await payload.find({
  collection: "pages",
  where: { slug: { equals: "about" } },
  limit: 1,
  draft: true,
});
console.log(`Home blocks: ${home.docs[0].blocks.length}, about _status: ${about.docs[0]?._status}`);

const featuredT = await payload.find({
  collection: "testimonials",
  limit: 0,
  where: { featured: { equals: true } },
});
console.log(`Featured testimonials: ${featuredT.totalDocs}`);

await payload.destroy();
process.exit(0);
