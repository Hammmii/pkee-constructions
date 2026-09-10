"use client";

import { useFormContext } from "react-hook-form";
import { TextField } from "@/components/ui/field/TextField";
import type { CustomStudioFormInput } from "@/lib/validators/customStudio";

/** Step 3 — rough dimensions so the studio can price fabrication accurately. */
export function StepDimensions() {
  const {
    register,
    formState: { errors },
  } = useFormContext<CustomStudioFormInput>();

  return (
    <div>
      <p className="mb-8 max-w-xl text-ink/60">
        Rough numbers are fine — our team confirms measurements before anything is fabricated. Leave
        a field blank if you don't know it yet.
      </p>
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <TextField
          id="width"
          label="Width (inches)"
          type="number"
          inputMode="decimal"
          min={1}
          autoComplete="off"
          placeholder="e.g. 96"
          error={errors.width?.message}
          {...register("width")}
        />
        <TextField
          id="height"
          label="Height (inches)"
          type="number"
          inputMode="decimal"
          min={1}
          autoComplete="off"
          placeholder="e.g. 48"
          error={errors.height?.message}
          {...register("height")}
        />
        <div className="sm:col-span-2">
          <TextField
            id="quantity"
            label="Quantity / area"
            autoComplete="off"
            placeholder="e.g. 2 feature walls, ~120 sq ft"
            error={errors.quantity?.message}
            {...register("quantity")}
          />
        </div>
      </div>
    </div>
  );
}
