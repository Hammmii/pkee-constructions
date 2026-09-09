import type { Access, Field } from "payload";

import { isStaff, isSuperAdmin } from "./Users";

export type StaffAccessArgs = { req: { user?: { id: string | number; roles?: string[] } | null } };

const SALES_ROLES = ["super-admin", "sales-manager", "sales-rep"] as const;
const MANAGER_ROLES = ["super-admin", "sales-manager"] as const;

export const isSalesStaff = ({ req: { user } }: StaffAccessArgs) =>
  Boolean(user && SALES_ROLES.some((role) => user.roles?.includes(role)));

export const isSalesManager = ({ req: { user } }: StaffAccessArgs) =>
  Boolean(user && MANAGER_ROLES.some((role) => user.roles?.includes(role)));

/**
 * Read/update: super-admin + sales-manager see everything; sales-rep only
 * documents assigned to them.
 */
export const salesPipelineAccess: Access = ({ req: { user } }) => {
  if (!user) return false;
  const roles = user.roles ?? [];
  if (MANAGER_ROLES.some((role) => roles.includes(role))) return true;
  if (roles.includes("sales-rep")) return { assignedTo: { equals: user.id } };
  return false;
};

/**
 * Sales-rep can update their own assigned documents; managers update all.
 */
export const salesPipelineUpdate: Access = ({ req: { user } }) => {
  if (!user) return false;
  const roles = user.roles ?? [];
  if (MANAGER_ROLES.some((role) => roles.includes(role))) return true;
  if (roles.includes("sales-rep")) return { assignedTo: { equals: user.id } };
  return false;
};

/**
 * Any staff member (incl. sales-rep) may read/update day-to-day intake
 * queues; only super-admin may delete.
 */
export const staffAccess: Access = isStaff;

/**
 * `delete` access (unlike `read`/`update`) must return a boolean, not a
 * `Where` query — hence the narrower signature than `Access`.
 */
export const staffDeleteAccess = ({ req: { user } }: StaffAccessArgs): boolean =>
  isSuperAdmin({ req: { user } });

/**
 * Intake collections (Quotes, DealerApplications, SampleRequests,
 * Consultations, ContactMessages) are created server-side through the
 * local API (`overrideAccess: true`) from form server actions — NOT through
 * the public REST/GraphQL API. `create: () => false` keeps the public API
 * surface closed as a safety net; the local API bypasses access control by
 * default.
 */
export const publicCreateClosed = (): boolean => false;

export const seoField: Field = {
  name: "seo",
  type: "group",
  fields: [
    { name: "metaTitle", type: "text", maxLength: 70 },
    { name: "metaDescription", type: "textarea", maxLength: 160 },
    { name: "ogImage", type: "upload", relationTo: "media" },
  ],
};
