"use client";

import { useFormContext } from "react-hook-form";
import { TextAreaField } from "@/components/ui/field/TextAreaField";
import { TextField } from "@/components/ui/field/TextField";
import type { QuoteFormInput } from "@/lib/validators/quote";

function ServiceCheckbox({
  id,
  label,
  registration,
}: {
  id: string;
  label: string;
  registration: ReturnType<ReturnType<typeof useFormContext<QuoteFormInput>>["register"]>;
}) {
  return (
    <label
      htmlFor={id}
      className="flex min-h-[44px] cursor-pointer items-center gap-3 border border-stone px-4 py-3 transition-colors has-checked:border-brass has-checked:bg-brass/10"
    >
      <input id={id} type="checkbox" className="h-5 w-5 accent-brass" {...registration} />
      <span className="text-[0.8125rem] uppercase tracking-[0.12em]">{label}</span>
    </label>
  );
}

/** Step 5 — the creative and service requirements around the material. */
export function StepCustomization() {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuoteFormInput>();

  return (
    <div className="grid gap-x-10 gap-y-8">
      <TextAreaField
        id="customization.designRequirements"
        label="Design requirements"
        rows={5}
        placeholder="Style, references, must-haves — anything that helps us understand the look you're after."
        error={errors.customization?.designRequirements?.message}
        {...register("customization.designRequirements")}
      />
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <TextField
          id="customization.lighting"
          label="Lighting"
          placeholder="e.g. backlit, recessed, natural"
          error={errors.customization?.lighting?.message}
          {...register("customization.lighting")}
        />
        <TextField
          id="customization.fabrication"
          label="Cutting / fabrication"
          placeholder="e.g. custom shapes, curved panels"
          error={errors.customization?.fabrication?.message}
          {...register("customization.fabrication")}
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <ServiceCheckbox
          id="customization.installationRequired"
          label="Installation required"
          registration={register("customization.installationRequired")}
        />
        <ServiceCheckbox
          id="customization.deliveryRequired"
          label="Delivery required"
          registration={register("customization.deliveryRequired")}
        />
      </div>
    </div>
  );
}
