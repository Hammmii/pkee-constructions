import type { CollectionConfig } from "payload";
import { seoField } from "./access";
import { isStaff, isSuperAdmin } from "./Users";

export const Projects: CollectionConfig = {
  slug: "projects",
  versions: { drafts: true },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "location", "type", "featured", "updatedAt"],
  },
  access: {
    read: () => true,
    create: isStaff,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true },
    { name: "location", type: "text" },
    {
      name: "type",
      type: "select",
      options: [
        { label: "Residential", value: "residential" },
        { label: "Commercial", value: "commercial" },
      ],
    },
    {
      name: "room",
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
        { label: "Basement", value: "basement" },
      ],
    },
    { name: "productsUsed", type: "relationship", relationTo: "products", hasMany: true },
    {
      name: "materialsUsed",
      type: "array",
      fields: [{ name: "material", type: "text", required: true }],
    },
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "beforeImage", type: "upload", relationTo: "media" },
    { name: "afterImage", type: "upload", relationTo: "media" },
    { name: "gallery", type: "upload", relationTo: "media", hasMany: true },
    { name: "description", type: "textarea" },
    { name: "completionDate", type: "date" },
    {
      name: "services",
      type: "array",
      fields: [{ name: "service", type: "text", required: true }],
    },
    { name: "featured", type: "checkbox", defaultValue: false },
    seoField,
  ],
};
