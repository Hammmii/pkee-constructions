import type { CollectionConfig } from "payload";
import { isStaff, isSuperAdmin } from "./Users";

export const FAQs: CollectionConfig = {
  slug: "faqs",
  versions: { drafts: true },
  admin: {
    useAsTitle: "question",
    defaultColumns: ["question", "category", "updatedAt"],
  },
  access: {
    read: () => true,
    create: isStaff,
    update: isStaff,
    delete: isSuperAdmin,
  },
  fields: [
    { name: "question", type: "text", required: true },
    { name: "answer", type: "textarea", required: true },
    {
      name: "category",
      type: "select",
      options: [
        { label: "PVC Wall Panels", value: "pvc-wall-panels" },
        { label: "Decor Sheets", value: "decor-sheets" },
        { label: "Stone", value: "stone" },
        { label: "Walls & Backdrops", value: "walls-backdrops" },
        { label: "Custom Fabrication", value: "custom-fabrication" },
        { label: "Finishing & Light", value: "finishing-light" },
        { label: "Shipping & Installation", value: "shipping-installation" },
        { label: "Trade Program", value: "trade-program" },
        { label: "General", value: "general" },
      ],
    },
    { name: "relatedPage", type: "text", admin: { description: "e.g. /quote, /trade, /samples" } },
  ],
};
