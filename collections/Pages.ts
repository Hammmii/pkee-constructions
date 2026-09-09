import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { Block, CollectionConfig } from "payload";
import { seoField } from "./access";
import { isStaff, isSuperAdmin } from "./Users";

const heroBlock: Block = {
  slug: "hero",
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "subheading", type: "textarea" },
    { name: "image", type: "upload", relationTo: "media" },
  ],
};

const richTextBlock: Block = {
  slug: "richText",
  fields: [{ name: "content", type: "richText", editor: lexicalEditor({}) }],
};

const imageGridBlock: Block = {
  slug: "imageGrid",
  fields: [
    { name: "images", type: "upload", relationTo: "media", hasMany: true },
    {
      name: "columns",
      type: "select",
      defaultValue: "3",
      options: [
        { label: "2 Columns", value: "2" },
        { label: "3 Columns", value: "3" },
        { label: "4 Columns", value: "4" },
      ],
    },
  ],
};

const statsBandBlock: Block = {
  slug: "statsBand",
  fields: [
    {
      name: "stats",
      type: "array",
      fields: [
        { name: "label", type: "text", required: true },
        { name: "value", type: "text", required: true },
      ],
    },
  ],
};

const ctaBandBlock: Block = {
  slug: "ctaBand",
  fields: [
    { name: "heading", type: "text", required: true },
    { name: "subheading", type: "textarea" },
    { name: "buttonLabel", type: "text", required: true },
    { name: "buttonHref", type: "text", required: true },
  ],
};

export const Pages: CollectionConfig = {
  slug: "pages",
  versions: { drafts: true },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
  },
  access: {
    // Content pages are read by the Next.js frontend through the local API
    // (which bypasses access control); direct API access stays staff-only.
    admin: isStaff,
    create: isStaff,
    read: isStaff,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "blocks",
      type: "blocks",
      blocks: [heroBlock, richTextBlock, imageGridBlock, statsBandBlock, ctaBandBlock],
    },
    seoField,
  ],
};
