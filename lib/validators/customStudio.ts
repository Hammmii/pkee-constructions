import { z } from "zod";

export const MAX_CUSTOM_STUDIO_ATTACHMENTS = 5;
export const MAX_CUSTOM_STUDIO_ATTACHMENT_BYTES = 10 * 1024 * 1024; // 10 MB
export const CUSTOM_STUDIO_ATTACHMENT_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "application/pdf",
] as const;

const emptyToUndefined = (value: unknown): unknown => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  return value;
};

const fileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, "File is empty")
  .refine((f) => f.size <= MAX_CUSTOM_STUDIO_ATTACHMENT_BYTES, "Each file must be 10 MB or smaller")
  .refine(
    (f) =>
      (CUSTOM_STUDIO_ATTACHMENT_TYPES as readonly string[]).includes(f.type) ||
      /\.(png|jpe?g|webp|avif|pdf)$/i.test(f.name),
    "Only images (PNG, JPG, WebP, AVIF) and PDFs are accepted",
  );

export const customStudioRequestSchema = z.object({
  baseMaterial: z.preprocess(
    emptyToUndefined,
    z
      .string({ required_error: "Select a base material" })
      .trim()
      .min(1, "Select a base material")
      .max(120),
  ),
  finish: z.string().trim().min(1, "Finish is required").max(120),
  width: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: "Enter a valid width" })
      .positive("Enter a valid width")
      .max(100_000, "Enter a valid width")
      .optional(),
  ),
  height: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number({ invalid_type_error: "Enter a valid height" })
      .positive("Enter a valid height")
      .max(100_000, "Enter a valid height")
      .optional(),
  ),
  quantity: z.string().trim().max(120).optional(),
  description: z
    .string()
    .trim()
    .min(20, "Tell us a little more about the design (at least 20 characters)")
    .max(4000),
  firstName: z.string().trim().min(1, "First name is required").max(80),
  lastName: z.string().trim().min(1, "Last name is required").max(80),
  email: z.string().trim().email("Enter a valid email address").max(160),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(24)
    .regex(/^[+()\-.\s\d]+$/, "Enter a valid phone number"),
  attachments: z
    .array(fileSchema)
    .max(
      MAX_CUSTOM_STUDIO_ATTACHMENTS,
      `Attach no more than ${MAX_CUSTOM_STUDIO_ATTACHMENTS} files`,
    )
    .optional()
    .default([]),
  website: z.string().optional(), // honeypot — must stay empty
  turnstileToken: z.string().optional(),
});

/** Coerced, validated output shape (width/height are real numbers). */
export type CustomStudioRequestInput = z.output<typeof customStudioRequestSchema>;

/** Shape the form holds while editing: everything is a string. */
export type CustomStudioFormInput = {
  baseMaterial: string;
  finish: string;
  width: string;
  height: string;
  quantity?: string;
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};
