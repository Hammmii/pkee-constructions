"use client";

import { useFormContext } from "react-hook-form";
import { TextAreaField } from "@/components/ui/field/TextAreaField";
import type { CustomStudioFormInput } from "@/lib/validators/customStudio";

/** Step 4 — the design brief in the customer's own words. */
export function StepDesign() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CustomStudioFormInput>();

  return (
    <div>
      <p className="mb-8 max-w-xl text-ink/60">
        Describe the piece: the room it lives in, the mood you're after, anything you've already
        decided — and anything you haven't.
      </p>
      <TextAreaField
        id="description"
        label="Design description"
        rows={6}
        autoComplete="off"
        placeholder="e.g. A fluted charcoal feature wall behind the reception desk, warm backlighting along the top edge…"
        error={errors.description?.message}
        {...register("description")}
      />
    </div>
  );
}
