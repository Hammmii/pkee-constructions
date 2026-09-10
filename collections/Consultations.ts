import type { CollectionConfig } from "payload";

import { isSalesStaff, publicCreateClosed, staffDeleteAccess } from "./access";

export const Consultations: CollectionConfig = {
  slug: "consultations",
  admin: {
    defaultColumns: ["type", "date", "contact.name", "status", "updatedAt"],
  },
  access: {
    admin: isSalesStaff,
    // Created server-side via the local API from the /consultation form.
    create: publicCreateClosed,
    read: isSalesStaff,
    update: isSalesStaff,
    delete: staffDeleteAccess,
  },
  fields: [
    {
      name: "source",
      type: "select",
      options: [
        { label: "Website — Quote", value: "website-quote" },
        { label: "Website — Samples", value: "website-samples" },
        { label: "Website — Consultation", value: "website-consultation" },
        { label: "Website — Custom Studio", value: "website-custom-studio" },
        { label: "Phone", value: "phone" },
        { label: "Walk-in", value: "walk-in" },
        { label: "Other", value: "other" },
      ],
      defaultValue: "website-consultation",
      index: true,
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Phone Call", value: "phone" },
        { label: "Video Call", value: "video" },
        { label: "Showroom Visit", value: "showroom" },
        { label: "Site Visit", value: "site-visit" },
      ],
    },
    { name: "date", type: "date", required: true },
    { name: "time", type: "text", required: true, admin: { description: "e.g. 10:30 AM" } },
    {
      name: "projectType",
      type: "select",
      options: [
        { label: "Residential", value: "residential" },
        { label: "Commercial", value: "commercial" },
      ],
    },
    { name: "productInterest", type: "text" },
    {
      name: "contact",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email", required: true },
        { name: "phone", type: "text" },
      ],
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "New", value: "new" },
        { label: "Confirmed", value: "confirmed" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
      ],
      defaultValue: "new",
      required: true,
    },
  ],
};
