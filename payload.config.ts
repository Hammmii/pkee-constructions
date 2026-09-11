import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import { Consultations } from "./collections/Consultations";
import { ContactMessages } from "./collections/ContactMessages";
import { DealerApplications } from "./collections/DealerApplications";
import { FAQs } from "./collections/FAQs";
import { Media } from "./collections/Media";
import { Pages } from "./collections/Pages";
import { ProductCategories } from "./collections/ProductCategories";
import { Products } from "./collections/Products";
import { Projects } from "./collections/Projects";
import { Quotes } from "./collections/Quotes";
import { SampleRequests } from "./collections/SampleRequests";
import { Solutions } from "./collections/Solutions";
import { Testimonials } from "./collections/Testimonials";
import { Users } from "./collections/Users";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required (see .env.example)");
}

// Remote object storage for media. On Vercel the filesystem is ephemeral, so
// without this every /api/media/file/* 500s in production. When S3_BUCKET is
// unset (local dev / CI) we skip the plugin and media stays on local disk.
const plugins = [];
if (process.env.S3_BUCKET) {
  plugins.push(
    s3Storage({
      collections: { media: true },
      bucket: process.env.S3_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "",
        },
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION,
        // Required by Supabase Storage / most S3-compatible endpoints.
        forcePathStyle: true,
      },
    }),
  );
} else {
  // biome-ignore lint/suspicious/noConsole: intentional boot-time operational warning.
  console.warn(
    "[payload] S3_BUCKET unset — media uses the local disk adapter. " +
      "Set S3_* env vars in production (see .env.example).",
  );
}

export default buildConfig({
  admin: {
    user: "users",
    components: {
      views: {
        dashboard: {
          Component: "/components/admin/dashboard#Dashboard",
        },
        pipeline: {
          Component: "/components/admin/pipeline#PipelineView",
          path: "/pipeline",
        },
        activity: {
          Component: "/components/admin/activity#ActivityView",
          path: "/activity",
        },
      },
    },
  },
  collections: [
    Users,
    Media,
    ProductCategories,
    Products,
    Solutions,
    Projects,
    FAQs,
    Testimonials,
    Pages,
    Quotes,
    DealerApplications,
    SampleRequests,
    Consultations,
    ContactMessages,
  ],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    migrationDir: path.resolve(dirname, "migrations"),
  }),
  plugins,
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
