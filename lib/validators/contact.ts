import { z } from "zod";
import { CONTACT_SUBJECTS } from "@/lib/contact";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Enter a valid email address").max(160),
  phone: z
    .string()
    .trim()
    .max(24)
    .regex(/^[+()\-.\s\d]*$/, "Enter a valid phone number")
    .optional(),
  subject: z.enum([...CONTACT_SUBJECTS], {
    required_error: "Select a topic",
    invalid_type_error: "Select a topic",
  }),
  message: z.string().trim().min(10, "Tell us a little more — at least 10 characters").max(3000),
  website: z.string().optional(), // honeypot — must stay empty
  turnstileToken: z.string().optional(),
});

/** Coerced, validated output shape for a /contact submission. */
export type ContactMessageInput = z.output<typeof contactMessageSchema>;

/** Shape the form holds while editing: everything is a string. */
export type ContactFormInput = {
  name: string;
  email: string;
  phone?: string;
  subject: (typeof CONTACT_SUBJECTS)[number] | "";
  message: string;
};
