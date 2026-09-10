export type SampleProductOption = {
  id: string;
  name: string;
  slug: string;
};

export type SamplesFormInput = {
  productId: string;
  color: string;
  finish: string;
  quantity: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  honeypot: string;
};

export const SAMPLES_STEP_TITLES = ["Samples", "Contact", "Delivery"] as const;

export const SAMPLES_STEP_FIELDS: Record<number, (keyof SamplesFormInput)[]> = {
  0: ["productId", "color", "finish", "quantity"],
  1: ["firstName", "lastName", "email", "phone"],
  2: ["address", "city", "province", "postalCode"],
};

export const CANADIAN_PROVINCES: readonly { value: string; label: string }[] = [
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "British Columbia" },
  { value: "MB", label: "Manitoba" },
  { value: "NB", label: "New Brunswick" },
  { value: "NL", label: "Newfoundland and Labrador" },
  { value: "NS", label: "Nova Scotia" },
  { value: "NT", label: "Northwest Territories" },
  { value: "NU", label: "Nunavut" },
  { value: "ON", label: "Ontario" },
  { value: "PE", label: "Prince Edward Island" },
  { value: "QC", label: "Québec" },
  { value: "SK", label: "Saskatchewan" },
  { value: "YT", label: "Yukon" },
] as const;
