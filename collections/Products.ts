import { lexicalEditor } from "@payloadcms/richtext-lexical";
import type { CollectionConfig } from "payload";
import { seoField } from "./access";
import { isStaff, isSuperAdmin } from "./Users";

export const Products: CollectionConfig = {
  slug: "products",
  versions: { drafts: true },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "category", "featured", "updatedAt"],
  },
  access: {
    read: () => true,
    create: isStaff,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    {
      name: "category",
      type: "relationship",
      relationTo: "product-categories",
      required: true,
    },
    { name: "summary", type: "text" },
    { name: "description", type: "richText", editor: lexicalEditor({}) },
    { name: "heroImage", type: "upload", relationTo: "media", required: true },
    { name: "gallery", type: "upload", relationTo: "media", hasMany: true },
    {
      name: "finishes",
      type: "array",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "swatch", type: "text", admin: { description: "Hex colour, e.g. #B08D57" } },
      ],
    },
    {
      name: "colors",
      type: "array",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "hex", type: "text", admin: { description: "Hex colour, e.g. #8C5B3F" } },
      ],
    },
    { name: "sizes", type: "array", fields: [{ name: "size", type: "text", required: true }] },
    { name: "material", type: "text" },
    { name: "cuttingMethod", type: "text" },
    { name: "thickness", type: "text" },
    {
      name: "properties",
      type: "select",
      hasMany: true,
      options: [
        { label: "Waterproof", value: "waterproof" },
        { label: "Fire-Resistant", value: "fire-resistant" },
        { label: "Scratch-Resistant", value: "scratch-resistant" },
        { label: "Eco-Friendly", value: "eco-friendly" },
        { label: "Budget-Friendly", value: "budget-friendly" },
        { label: "Easy Install", value: "easy-install" },
      ],
    },
    {
      name: "applications",
      type: "select",
      hasMany: true,
      options: [
        { label: "Living Room", value: "living-room" },
        { label: "Kitchen", value: "kitchen" },
        { label: "Bathroom", value: "bathroom" },
        { label: "Bedroom", value: "bedroom" },
        { label: "Office", value: "office" },
        { label: "Restaurant", value: "restaurant" },
        { label: "Retail", value: "retail" },
        { label: "Hotel", value: "hotel" },
        { label: "Outdoor", value: "outdoor" },
        { label: "Feature Wall", value: "feature-wall" },
        { label: "Fireplace", value: "fireplace" },
        { label: "Prayer Room", value: "prayer-room" },
        { label: "Ceiling", value: "ceiling" },
        { label: "Basement", value: "basement" },
      ],
    },
    {
      name: "indoorOutdoor",
      type: "select",
      options: [
        { label: "Both", value: "both" },
        { label: "Indoor", value: "indoor" },
        { label: "Outdoor", value: "outdoor" },
      ],
    },
    { name: "backlit", type: "checkbox", defaultValue: false },
    { name: "customizable", type: "checkbox", defaultValue: false },
    {
      name: "relatedProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    { name: "featured", type: "checkbox", defaultValue: false },
    {
      name: "placeholderMedia",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description:
          "Checked = some or all media on this document is SEED-PLACEHOLDER; must be replaced before launch (CONTENT-GAPS.md).",
      },
    },
    seoField,
  ],
};
