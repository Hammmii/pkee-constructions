import path from "node:path";
import { fileURLToPath } from "node:url";
import { postgresAdapter } from "@payloadcms/db-postgres";
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
  secret: process.env.PAYLOAD_SECRET || "",
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
});
