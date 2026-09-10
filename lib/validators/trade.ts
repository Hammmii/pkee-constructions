import { z } from "zod";

export const BUSINESS_TYPES = [
  "retailer",
  "wholesaler",
  "contractor",
  "designer",
  "other",
] as const;

export const ANNUAL_TURNOVER_BRACKETS = [
  "under-250k",
  "250k-1m",
  "1m-5m",
  "5m-plus",
] as const;

export const MAX_ATTACHMENTS = 5;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const ALLOWED_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "application/pdf",
] as const;

const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "File is empty")
  .refine(
    (f) => f.size <= MAX_ATTACHMENT_BYTES,
    "Each file must be 10 MB or smaller",
  )
  .refine(
    (f) =>
      (ALLOWED_ATTACHMENT_TYPES as readonly string[]).includes(f.type) ||
      /\.(png|jpe?g|webp|avif|pdf)$/i.test(f.name),
    "Only images (PNG, JPG, WebP, AVIF) and PDFs are accepted",
  );

export const businessDetailsSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  companyName: z.string().trim().min(1, "Company name is required").max(160),
  companyAddress: z.string().trim().min(1, "Business address is required").max(240),
  email: z.string().trim().email("Enter a valid email address").max(160),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(24)
    .regex(/^[+()\-.\s\d]+$/, "Enter a valid phone number"),
  city: z.string().trim().min(1, "City is required").max(80),
  province: z.string().trim().min(1, "Province is required").max(80),
  postalCode: z
    .string()
    .trim()
    .min(1, "Postal code is required")
    .max(12)
    .regex(/^[A-Za-z0-9][A-Za-z0-9\- ]{1,10}$/, "Enter a valid postal code"),
  gstNumber: z.string().trim().max(32).optional(),
});

export const businessProfileSchema = z.object({
  businessType: z.enum(BUSINESS_TYPES, {
    message: "Select your business type",
  }),
  yearsInBusiness: z.coerce
    .number({ message: "Years in business is required" })
    .int("Enter a whole number")
    .min(0, "Cannot be negative")
    .max(150, "Enter a valid number of years"),
  annualTurnover: z.enum(ANNUAL_TURNOVER_BRACKETS, {
    message: "Select your annual turnover range",
  }),
  otherBrands: z.boolean(),
  otherBrandNames: z.string().trim().max(400).optional(),
  moreInfo: z.string().trim().max(2000).optional(),
});

export const attachmentsSchema = z.object({
  attachments: z
    .array(fileSchema)
    .max(MAX_ATTACHMENTS, `Attach no more than ${MAX_ATTACHMENTS} files`)
    .optional()
    .default([]),
});

export const tradeApplicationSchema = businessDetailsSchema
  .merge(businessProfileSchema)
  .merge(attachmentsSchema)
  .extend({
    website: z.string().optional(), // honeypot — must stay empty
    turnstileToken: z.string().optional(),
  })
  .refine(
    (d) => !d.otherBrands || (d.otherBrandNames && d.otherBrandNames.length > 0),
    {
      message: "List the brands you currently carry",
      path: ["otherBrandNames"],
    },
  );

/** Coerced, validated output shape (yearsInBusiness is a real number). */
export type TradeApplicationInput = z.output<typeof tradeApplicationSchema>;

/** Shape the form holds while editing: everything is a string (or boolean). */
export type TradeFormInput = {
  firstName: string;
  lastName: string;
  companyName: string;
  companyAddress: string;
  email: string;
  phone: string;
  city: string;
  province: string;
  postalCode: string;
  gstNumber?: string;
  businessType: (typeof BUSINESS_TYPES)[number] | "";
  yearsInBusiness: string;
  annualTurnover: (typeof ANNUAL_TURNOVER_BRACKETS)[number] | "";
  otherBrands: boolean;
  otherBrandNames?: string;
  moreInfo?: string;
};

export const TURNOVER_LABELS: Record<(typeof ANNUAL_TURNOVER_BRACKETS)[number], string> = {
  "under-250k": "Under $250k",
  "250k-1m": "$250k – $1M",
  "1m-5m": "$1M – $5M",
  "5m-plus": "$5M+",
};

export const BUSINESS_TYPE_LABELS: Record<(typeof BUSINESS_TYPES)[number], string> = {
  retailer: "Retailer / showroom",
  wholesaler: "Wholesaler / distributor",
  contractor: "Contractor / builder",
  designer: "Designer / architect",
  other: "Other",
};
