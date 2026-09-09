import type { CollectionConfig } from "payload";
import { seoField } from "./access";
import { isStaff, isSuperAdmin } from "./Users";

export const Solutions: CollectionConfig = {
  slug: "solutions",
  versions: { drafts: true },
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "updatedAt"],
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
    { name: "heroImage", type: "upload", relationTo: "media" },
    { name: "intro", type: "textarea" },
    {
      name: "recommendedProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
    },
    { name: "faqs", type: "relationship", relationTo: "faqs", hasMany: true },
    seoField,
  ],
};
