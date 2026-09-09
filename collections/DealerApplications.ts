import type { CollectionConfig } from "payload";

import { isSalesStaff, publicCreateClosed, staffDeleteAccess } from "./access";

export const DealerApplications: CollectionConfig = {
  slug: "dealer-applications",
  admin: {
    useAsTitle: "companyName",
    defaultColumns: ["companyName", "businessType", "territory", "status", "updatedAt"],
  },
  access: {
    admin: isSalesStaff,
    // Created server-side via the local API from the /trade form server action.
    create: publicCreateClosed,
    read: isSalesStaff,
    update: isSalesStaff,
    delete: staffDeleteAccess,
  },
  fields: [
    { name: "firstName", type: "text", required: true },
    { name: "lastName", type: "text", required: true },
    { name: "companyName", type: "text", required: true },
    { name: "companyAddress", type: "text", required: true },
    { name: "email", type: "email", required: true },
    { name: "phone", type: "text", required: true },
    { name: "city", type: "text" },
    { name: "province", type: "text" },
    { name: "postalCode", type: "text" },
    { name: "gstNumber", type: "text" },
    {
      name: "businessType",
      type: "select",
      required: true,
      options: [
        { label: "Retailer", value: "retailer" },
        { label: "Wholesaler", value: "wholesaler" },
        { label: "Contractor", value: "contractor" },
        { label: "Designer", value: "designer" },
        { label: "Other", value: "other" },
      ],
    },
    { name: "yearsInBusiness", type: "number" },
    {
      name: "annualTurnover",
      type: "select",
      options: [
        { label: "Under $250k", value: "under-250k" },
        { label: "$250k – $1M", value: "250k-1m" },
        { label: "$1M – $5M", value: "1m-5m" },
        { label: "$5M+", value: "5m-plus" },
      ],
    },
    { name: "otherBrands", type: "checkbox", defaultValue: false },
    { name: "otherBrandNames", type: "text" },
    { name: "moreInfo", type: "textarea" },
    { name: "documents", type: "upload", relationTo: "media", hasMany: true },
    {
      name: "status",
      type: "select",
      options: [
        { label: "New", value: "new" },
        { label: "Under Review", value: "under-review" },
        { label: "Documents Pending", value: "documents-pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
      defaultValue: "new",
      required: true,
    },
    { name: "territory", type: "text" },
    { name: "assignedRep", type: "relationship", relationTo: "users" },
  ],
};
