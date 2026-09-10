import { z } from "zod";

/**
 * Shared Zod schema for the quote pipeline — used by the RHF resolver on the
 * client AND re-validated with `safeParse` inside the server action. Never
 * trust the client: the action parses raw FormData through this same schema.
 *
 * Option values mirror collections/Quotes.ts exactly.
 */

export const PREFERRED_CONTACT_OPTIONS = ["email", "phone", "text", "whatsapp"] as const;
export const PROJECT_TYPE_OPTIONS = ["residential", "commercial"] as const;
export const BUILD_TYPE_OPTIONS = ["new-build", "renovation"] as const;
export const TIMELINE_OPTIONS = [
  "asap",
  "1-3-months",
  "3-6-months",
  "6-plus-months",
  "researching",
] as const;
export const UNIT_OPTIONS = ["sqft", "sqm", "pieces"] as const;

export type PreferredContact = (typeof PREFERRED_CONTACT_OPTIONS)[number];
export type ProjectType = (typeof PROJECT_TYPE_OPTIONS)[number];
export type BuildType = (typeof BUILD_TYPE_OPTIONS)[number];
export type Timeline = (typeof TIMELINE_OPTIONS)[number];
export type Unit = (typeof UNIT_OPTIONS)[number];

/** "" or whitespace-only → undefined (empty optional fields from selects/inputs). */
const emptyToUndefined = (value: unknown): unknown => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const optionalTrimmed = (max: number) =>
  z.preprocess(emptyToUndefined, z.string().trim().min(1).max(max).optional());

const optionalEnum = <T extends readonly [string, ...string[]]>(options: T) =>
  z.preprocess(emptyToUndefined, z.enum([...options]).optional());

/** Numbers arrive as strings from FormData/RHF; empty string means "not given". */
const optionalNumber = (max: number, opts: { integer?: boolean; min?: number } = {}) =>
  z.preprocess(
    emptyToUndefined,
    (opts.integer
      ? z.coerce
          .number({ invalid_type_error: "Enter a number" })
          .int("Enter a whole number")
          .min(opts.min ?? 0)
          .max(max)
      : z.coerce
          .number({ invalid_type_error: "Enter a number" })
          .min(opts.min ?? 0)
          .max(max)
    ).optional(),
  );

/* ---------------------------------------------------------------------------
 * Per-step schemas (also composed into the full quoteSchema below)
 *-------------------------------------------------------------------------- */

export const customerStepSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  email: z.string().trim().max(200).email("Enter a valid email address"),
  phone: optionalTrimmed(30),
  preferredContact: optionalEnum(PREFERRED_CONTACT_OPTIONS),
  city: optionalTrimmed(80),
  postalCode: optionalTrimmed(10),
});

export const projectStepSchema = z.object({
  projectType: optionalEnum(PROJECT_TYPE_OPTIONS),
  buildType: optionalEnum(BUILD_TYPE_OPTIONS),
  roomType: optionalTrimmed(120),
  timeline: optionalEnum(TIMELINE_OPTIONS),
});

export const materialStepSchema = z.object({
  categorySlug: optionalTrimmed(120),
  productSlug: optionalTrimmed(160),
  finish: optionalTrimmed(120),
  color: optionalTrimmed(120),
  quantity: optionalNumber(1_000_000, { min: 1 }),
  unit: optionalEnum(UNIT_OPTIONS),
});

export const dimensionsStepSchema = z.object({
  width: optionalNumber(100_000),
  height: optionalNumber(100_000),
  floorArea: optionalNumber(10_000_000),
  wallCount: optionalNumber(500, { integer: true }),
  doorCount: optionalNumber(500, { integer: true }),
});

export const customizationStepSchema = z.object({
  designRequirements: optionalTrimmed(3000),
  lighting: optionalTrimmed(300),
  fabrication: optionalTrimmed(300),
  installationRequired: z.boolean().optional(),
  deliveryRequired: z.boolean().optional(),
});

/** Full payload — all seven steps plus the honeypot. Attachments ride in FormData. */
export const quoteSchema = z.object({
  customer: customerStepSchema,
  project: projectStepSchema,
  material: materialStepSchema,
  dimensions: dimensionsStepSchema,
  customization: customizationStepSchema,
  hp: z.string().max(100).optional(),
});

/** Coerced, validated output shape (numbers are real numbers). */
export type QuoteValues = z.output<typeof quoteSchema>;

/**
 * Shape the form actually holds while editing: everything is a string (or
 * boolean for checkboxes) until the resolver/server coerces. Written out
 * explicitly because `z.input` collapses to `unknown` under preprocess.
 */
export type QuoteFormInput = {
  customer: {
    name: string;
    email: string;
    phone?: string;
    preferredContact?: PreferredContact | "";
    city?: string;
    postalCode?: string;
  };
  project: {
    projectType?: ProjectType | "";
    buildType?: BuildType | "";
    roomType?: string;
    timeline?: Timeline | "";
  };
  material: {
    categorySlug?: string;
    productSlug?: string;
    finish?: string;
    color?: string;
    quantity?: string;
    unit?: Unit | "";
  };
  dimensions: {
    width?: string;
    height?: string;
    floorArea?: string;
    wallCount?: string;
    doorCount?: string;
  };
  customization: {
    designRequirements?: string;
    lighting?: string;
    fabrication?: string;
    installationRequired?: boolean;
    deliveryRequired?: boolean;
  };
  hp?: string;
};
