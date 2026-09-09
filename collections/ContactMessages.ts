import type { CollectionConfig } from "payload";

import { isSalesStaff, publicCreateClosed, staffDeleteAccess } from "./access";

export const ContactMessages: CollectionConfig = {
  slug: "contact-messages",
  admin: {
    useAsTitle: "subject",
    defaultColumns: ["name", "email", "status", "updatedAt"],
  },
  access: {
    admin: isSalesStaff,
    // Created server-side via the local API from the /contact form.
    create: publicCreateClosed,
    read: isSalesStaff,
    update: isSalesStaff,
    delete: staffDeleteAccess,
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text" },
    { name: "subject", type: "text", required: true },
    { name: "message", type: "textarea", required: true },
    {
      name: "status",
      type: "select",
      options: [
        { label: "New", value: "new" },
        { label: "Read", value: "read" },
        { label: "Archived", value: "archived" },
      ],
      defaultValue: "new",
      required: true,
    },
  ],
};
