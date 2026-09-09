import type { CollectionBeforeChangeHook, CollectionConfig } from "payload";

import {
  isSalesStaff,
  publicCreateClosed,
  salesPipelineAccess,
  salesPipelineUpdate,
  staffDeleteAccess,
} from "./access";

export const QUOTE_STATUSES = [
  { label: "New", value: "new" },
  { label: "Contacted", value: "contacted" },
  { label: "Qualified", value: "qualified" },
  { label: "Site Visit", value: "site-visit" },
  { label: "Design", value: "design" },
  { label: "Quote Preparing", value: "quote-preparing" },
  { label: "Quote Sent", value: "quote-sent" },
  { label: "Negotiation", value: "negotiation" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
  { label: "Archived", value: "archived" },
] as const;

const generateReference: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation === "create" && !data.reference) {
    const year = new Date().getFullYear();
    const { totalDocs } = await req.payload.find({
      collection: "quotes",
      where: { reference: { like: `PK-${year}-%` } },
      limit: 0,
    });
    data.reference = `PK-${year}-${String(totalDocs + 1).padStart(4, "0")}`;
  }
  return data;
};

export const Quotes: CollectionConfig = {
  slug: "quotes",
  admin: {
    useAsTitle: "reference",
    defaultColumns: ["reference", "status", "leadScore", "updatedAt"],
  },
  hooks: {
    beforeChange: [generateReference],
  },
  access: {
    // Admin UI available to all sales staff roles.
    admin: isSalesStaff,
    // Leads are created server-side via the local API from the quote form
    // server action — never through the public API (see collections/access.ts).
    create: publicCreateClosed,
    read: salesPipelineAccess,
    update: salesPipelineUpdate,
    delete: staffDeleteAccess,
  },
  fields: [
    { name: "reference", type: "text", unique: true, admin: { readOnly: true } },
    {
      name: "customer",
      type: "group",
      fields: [
        { name: "name", type: "text", required: true },
        { name: "email", type: "email", required: true },
        { name: "phone", type: "text" },
        {
          name: "preferredContact",
          type: "select",
          options: [
            { label: "Email", value: "email" },
            { label: "Phone", value: "phone" },
            { label: "Text", value: "text" },
            { label: "WhatsApp", value: "whatsapp" },
          ],
        },
        { name: "city", type: "text" },
        { name: "postalCode", type: "text" },
      ],
    },
    {
      name: "project",
      type: "group",
      fields: [
        {
          name: "projectType",
          type: "select",
          options: [
            { label: "Residential", value: "residential" },
            { label: "Commercial", value: "commercial" },
          ],
        },
        {
          name: "buildType",
          type: "select",
          options: [
            { label: "New Build", value: "new-build" },
            { label: "Renovation", value: "renovation" },
          ],
        },
        { name: "roomType", type: "text" },
        {
          name: "timeline",
          type: "select",
          options: [
            { label: "ASAP", value: "asap" },
            { label: "1–3 Months", value: "1-3-months" },
            { label: "3–6 Months", value: "3-6-months" },
            { label: "6+ Months", value: "6-plus-months" },
            { label: "Just Researching", value: "researching" },
          ],
        },
      ],
    },
    {
      name: "material",
      type: "group",
      fields: [
        { name: "product", type: "relationship", relationTo: "products" },
        { name: "finish", type: "text" },
        { name: "color", type: "text" },
        { name: "quantity", type: "number" },
        {
          name: "unit",
          type: "select",
          options: [
            { label: "Sq Ft", value: "sqft" },
            { label: "Sq M", value: "sqm" },
            { label: "Pieces", value: "pieces" },
          ],
        },
      ],
    },
    {
      name: "dimensions",
      type: "group",
      fields: [
        { name: "width", type: "number" },
        { name: "height", type: "number" },
        { name: "floorArea", type: "number" },
        { name: "wallCount", type: "number" },
        { name: "doorCount", type: "number" },
      ],
    },
    {
      name: "customization",
      type: "group",
      fields: [
        { name: "designRequirements", type: "textarea" },
        { name: "lighting", type: "text" },
        { name: "fabrication", type: "text" },
        { name: "installationRequired", type: "checkbox", defaultValue: false },
        { name: "deliveryRequired", type: "checkbox", defaultValue: false },
      ],
    },
    { name: "attachments", type: "upload", relationTo: "media", hasMany: true },
    {
      name: "status",
      type: "select",
      options: [...QUOTE_STATUSES],
      defaultValue: "new",
      required: true,
    },
    { name: "assignedTo", type: "relationship", relationTo: "users" },
    {
      name: "notes",
      type: "array",
      fields: [
        { name: "note", type: "textarea", required: true },
        { name: "author", type: "relationship", relationTo: "users" },
        { name: "date", type: "date", required: true },
      ],
    },
    {
      name: "leadScore",
      type: "number",
      admin: { description: "Computed at intake; higher = hotter lead." },
    },
    { name: "source", type: "text" },
    { name: "landingPage", type: "text" },
  ],
};
