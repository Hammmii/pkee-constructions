import type { CollectionConfig } from "payload";
import { seoField } from "./access";
import { isStaff, isSuperAdmin } from "./Users";

export const ProductCategories: CollectionConfig = {
  slug: "product-categories",
  versions: { drafts: true },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "group", "updatedAt"],
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
      name: "group",
      type: "select",
      required: true,
      options: [
        { label: "Sheets & Panels", value: "sheets-panels" },
        { label: "Stone", value: "stone" },
        { label: "Walls & Backdrops", value: "walls-backdrops" },
        { label: "Custom Fabrication", value: "custom-fabrication" },
        { label: "Finishing & Light", value: "finishing-light" },
      ],
    },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "intro", type: "textarea" },
    {
      name: "benefits",
      type: "array",
      fields: [{ name: "benefit", type: "text", required: true }],
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
    { name: "faqs", type: "relationship", relationTo: "faqs", hasMany: true },
    seoField,
  ],
};
