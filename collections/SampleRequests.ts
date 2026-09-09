import type { CollectionConfig } from "payload";

import { isSalesStaff, publicCreateClosed, staffDeleteAccess } from "./access";

export const SampleRequests: CollectionConfig = {
  slug: "sample-requests",
  admin: {
    defaultColumns: ["product", "color", "status", "updatedAt"],
  },
  access: {
    admin: isSalesStaff,
    // Created server-side via the local API from the /samples form.
    create: publicCreateClosed,
    read: isSalesStaff,
    update: isSalesStaff,
    delete: staffDeleteAccess,
  },
  fields: [
    { name: "product", type: "relationship", relationTo: "products", required: true },
    { name: "color", type: "text" },
    { name: "finish", type: "text" },
    { name: "quantity", type: "number" },
    {
      name: "contact",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email", required: true },
        { name: "phone", type: "text" },
        { name: "address", type: "textarea" },
      ],
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "New", value: "new" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "shipped" },
        { label: "Fulfilled", value: "fulfilled" },
      ],
      defaultValue: "new",
      required: true,
    },
  ],
};
