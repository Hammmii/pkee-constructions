// One-off (not committed): remove seeded placeholder media so the re-run
// re-uploads files through sharp (imageSizes). Usage: node scripts/tmp-cleanup.mjs
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

const { docs } = await payload.find({
  collection: "media",
  where: { placeholder: { equals: true } },
  limit: 500,
});
console.log(`Deleting ${docs.length} seeded media docs…`);
for (const doc of docs) {
  await payload.delete({ collection: "media", id: doc.id });
}
await payload.destroy();
process.exit(0);
