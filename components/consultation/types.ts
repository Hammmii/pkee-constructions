export type ConsultationFormInput = {
  type: string;
  projectType: string;
  productInterest: string;
  date: string;
  time: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  notes: string;
  honeypot: string;
};

export type ConsultationTypeOption = {
  value: string;
  label: string;
  description: string;
};

export const CONSULTATION_TYPE_OPTIONS: readonly ConsultationTypeOption[] = [
  { value: "phone", label: "Phone Call", description: "A specialist calls you — 15 minutes." },
  {
    value: "video",
    label: "Video Call",
    description: "Walk us through your space or plans on a video call.",
  },
  {
    value: "showroom",
    label: "Showroom Visit",
    description: "See and touch the full material library at 360 Keewatin St.",
  },
  {
    value: "site-visit",
    label: "Site Visit",
    description: "We come to your project — Winnipeg and surrounding areas.",
  },
] as const;

export const CONSULTATION_STEP_TITLES = ["Consultation", "Schedule", "Contact"] as const;

export const CONSULTATION_STEP_FIELDS: Record<number, (keyof ConsultationFormInput)[]> = {
  0: ["type", "projectType", "productInterest"],
  1: ["date", "time"],
  2: ["firstName", "lastName", "email", "phone"],
};
