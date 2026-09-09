import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  upload: {
    // served from ./media in dev; S3/R2 adapter lands in M11 (see .env.example)
    staticDir: "./media",
    imageSizes: [
      {
        name: "thumbnail",
        width: 480,
        height: 600,
        crop: "center",
        formatOptions: { format: "webp" },
      },
      { name: "card", width: 960, height: 1200, crop: "center", formatOptions: { format: "webp" } },
      { name: "hero", width: 2400, formatOptions: { format: "webp" } },
    ],
    mimeTypes: ["image/*", "application/pdf"],
  },
  admin: {
    defaultColumns: ["alt", "filename", "updatedAt"],
  },
  access: {
    read: () => true,
  },
  fields: [
    { name: "alt", type: "text", required: true },
    { name: "caption", type: "text" },
    {
      name: "placeholder",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Checked = SEED-PLACEHOLDER imagery, must be replaced before launch (CONTENT-GAPS.md).",
      },
    },
  ],
};
