"use client";

import { useFormContext } from "react-hook-form";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextField } from "@/components/ui/field/TextField";
import { PREFERRED_CONTACT_OPTIONS, type QuoteFormInput } from "@/lib/validators/quote";

const PREFERRED_CONTACT_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Phone call",
  text: "Text message",
  whatsapp: "WhatsApp",
};

/** Step 1 — who you are and how we reach you. */
export function StepCustomer() {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuoteFormInput>();

  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <TextField
        id="customer.name"
        label="Full name *"
        autoComplete="name"
        error={errors.customer?.name?.message}
        {...register("customer.name")}
      />
      <TextField
        id="customer.email"
        label="Email *"
        type="email"
        autoComplete="email"
        error={errors.customer?.email?.message}
        {...register("customer.email")}
      />
      <TextField
        id="customer.phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        error={errors.customer?.phone?.message}
        {...register("customer.phone")}
      />
      <SelectField
        id="customer.preferredContact"
        label="Preferred contact"
        autoComplete="off"
        error={errors.customer?.preferredContact?.message}
        {...register("customer.preferredContact")}
      >
        <option value="">No preference</option>
        {PREFERRED_CONTACT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {PREFERRED_CONTACT_LABELS[option] ?? option}
          </option>
        ))}
      </SelectField>
      <TextField
        id="customer.city"
        label="City"
        autoComplete="address-level2"
        error={errors.customer?.city?.message}
        {...register("customer.city")}
      />
      <TextField
        id="customer.postalCode"
        label="Postal code"
        autoComplete="postal-code"
        error={errors.customer?.postalCode?.message}
        {...register("customer.postalCode")}
      />
    </div>
  );
}
