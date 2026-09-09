import type { CollectionConfig } from "payload";

import { isStaff, isSuperAdmin } from "./Users";

export const Testimonials: CollectionConfig = {
  slug: "testimonials",
  versions: { drafts: true },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "rating", "verified", "featured", "updatedAt"],
  },
  access: {
    read: () => true,
    create: isStaff,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "rating", type: "number", min: 1, max: 5, required: true },
    { name: "text", type: "textarea", required: true },
    { name: "project", type: "relationship", relationTo: "projects" },
    { name: "product", type: "relationship", relationTo: "products" },
    { name: "location", type: "text" },
    { name: "verified", type: "checkbox", defaultValue: false },
    { name: "featured", type: "checkbox", defaultValue: false },
    { name: "image", type: "upload", relationTo: "media" },
  ],
};
