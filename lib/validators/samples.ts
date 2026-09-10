import { z } from "zod";

export const samplesStep1Schema = z.object({
  productId: z.string().min(1, "Select a product"),
  color: z.string().min(1, "Select a color"),
  finish: z.string().min(1, "Select a finish"),
  quantity: z.coerce.number().int().min(1, "Minimum 1 sample").max(5, "Maximum 5 samples"),
});

export const samplesStep2Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
});

export const samplesStep3Schema = z.object({
  address: z.string().min(5, "Address is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  postalCode: z
    .string()
    .regex(/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, "Enter a valid Canadian postal code"),
  honeypot: z.string().optional(),
});

export const samplesSchema = samplesStep1Schema.merge(samplesStep2Schema).merge(samplesStep3Schema);

export type SamplesStep1 = z.infer<typeof samplesStep1Schema>;
export type SamplesStep2 = z.infer<typeof samplesStep2Schema>;
export type SamplesStep3 = z.infer<typeof samplesStep3Schema>;
export type SamplesForm = z.infer<typeof samplesSchema>;
