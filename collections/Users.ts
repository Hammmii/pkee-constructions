import type { CollectionConfig } from "payload";

const ADMIN_ROLES = ["super-admin", "content-manager", "sales-manager"] as const;

export const isSuperAdmin = ({ req: { user } }: { req: { user?: { roles?: string[] } | null } }) =>
  Boolean(user?.roles?.includes("super-admin"));

export const isStaff = ({ req: { user } }: { req: { user?: { roles?: string[] } | null } }) =>
  Boolean(user && ADMIN_ROLES.some((role) => user.roles?.includes(role)));

export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: {
    useAsTitle: "email",
    defaultColumns: ["email", "roles", "updatedAt"],
  },
  access: {
    admin: isStaff,
    create: isSuperAdmin,
    delete: isSuperAdmin,
    read: isSuperAdmin,
    update: isSuperAdmin,
  },
  fields: [
    {
      name: "roles",
      type: "select",
      options: [
        { label: "Super Admin", value: "super-admin" },
        { label: "Content Manager", value: "content-manager" },
        { label: "Sales Manager", value: "sales-manager" },
        { label: "Sales Representative", value: "sales-rep" },
      ],
      hasMany: true,
      defaultValue: ["content-manager"],
      required: true,
    },
  ],
};
