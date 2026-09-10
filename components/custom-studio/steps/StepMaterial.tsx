"use client";

import { useFormContext } from "react-hook-form";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextField } from "@/components/ui/field/TextField";
import type { CustomStudioFormInput } from "@/lib/validators/customStudio";

type StepMaterialProps = {
  /** Distinct `material` values from published Products (fallback list when empty). */
  materials: string[];
};

/** Step 1 — the material the design should be built on, and its finish. */
export function StepMaterial({ materials }: StepMaterialProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<CustomStudioFormInput>();

  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <SelectField
          id="baseMaterial"
          label="Base material"
          autoComplete="off"
          error={errors.baseMaterial?.message}
          {...register("baseMaterial")}
        >
          <option value="">Select a base material</option>
          {materials.map((material) => (
            <option key={material} value={material}>
              {material}
            </option>
          ))}
          <option value="Not sure yet">Not sure yet — advise me</option>
        </SelectField>
      </div>
      <div className="sm:col-span-2">
        <TextField
          id="finish"
          label="Finish"
          autoComplete="off"
          placeholder="e.g. Walnut, matte black, travertine, high-gloss"
          error={errors.finish?.message}
          {...register("finish")}
        />
      </div>
    </div>
  );
}
