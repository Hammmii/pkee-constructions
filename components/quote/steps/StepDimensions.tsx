"use client";

import { useFormContext } from "react-hook-form";
import { TextField } from "@/components/ui/field/TextField";
import type { QuoteFormInput } from "@/lib/validators/quote";

const numberFieldProps = {
  type: "number" as const,
  min: 0,
  step: "any",
  inputMode: "decimal" as const,
};

/** Step 4 — rough measurements; every field optional, estimates are fine. */
export function StepDimensions() {
  const {
    register,
    formState: { errors },
  } = useFormContext<QuoteFormInput>();

  return (
    <div>
      <p className="mb-8 max-w-xl text-ink/60">
        Ballpark numbers are enough — they help us prepare the right samples and ballpark pricing
        before we talk.
      </p>
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <TextField
          id="dimensions.width"
          label="Wall width (ft)"
          error={errors.dimensions?.width?.message}
          {...register("dimensions.width")}
          {...numberFieldProps}
        />
        <TextField
          id="dimensions.height"
          label="Wall height (ft)"
          error={errors.dimensions?.height?.message}
          {...register("dimensions.height")}
          {...numberFieldProps}
        />
        <TextField
          id="dimensions.floorArea"
          label="Floor area (sq ft)"
          error={errors.dimensions?.floorArea?.message}
          {...register("dimensions.floorArea")}
          {...numberFieldProps}
        />
        <TextField
          id="dimensions.wallCount"
          label="Number of walls"
          error={errors.dimensions?.wallCount?.message}
          {...register("dimensions.wallCount")}
          {...numberFieldProps}
        />
        <TextField
          id="dimensions.doorCount"
          label="Doors / openings"
          error={errors.dimensions?.doorCount?.message}
          {...register("dimensions.doorCount")}
          {...numberFieldProps}
        />
      </div>
    </div>
  );
}
