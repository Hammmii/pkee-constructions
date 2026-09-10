import { z } from "zod";

export const CONSULTATION_TYPES = ["phone", "video", "showroom", "site-visit"] as const;
export type ConsultationType = (typeof CONSULTATION_TYPES)[number];

export const PROJECT_TYPES = ["residential", "commercial"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const consultationStep1Schema = z.object({
  type: z.enum(CONSULTATION_TYPES, { message: "Select a consultation type" }),
  projectType: z.enum(PROJECT_TYPES, { message: "Select a project type" }),
  productInterest: z.string().optional(),
});

export const consultationStep2Schema = z.object({
  date: z
    .string()
    .min(1, "Pick a date")
    .refine((value) => {
      const parsed = new Date(`${value}T12:00:00`);
      if (Number.isNaN(parsed.getTime())) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return parsed.getTime() >= today.getTime();
    }, "Pick a date in the future"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Select a time"),
});

export const consultationStep3Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(7, "Enter a valid phone number"),
  notes: z.string().max(2000, "Keep notes under 2000 characters").optional(),
  honeypot: z.string().optional(),
});

export const consultationSchema = consultationStep1Schema
  .merge(consultationStep2Schema)
  .merge(consultationStep3Schema);

export type ConsultationStep1 = z.infer<typeof consultationStep1Schema>;
export type ConsultationStep2 = z.infer<typeof consultationStep2Schema>;
export type ConsultationStep3 = z.infer<typeof consultationStep3Schema>;
export type ConsultationForm = z.infer<typeof consultationSchema>;
