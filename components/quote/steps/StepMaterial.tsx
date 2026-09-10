"use client";

import { useFormContext } from "react-hook-form";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextField } from "@/components/ui/field/TextField";
import { type QuoteFormInput, UNIT_OPTIONS } from "@/lib/validators/quote";
import type { CategoryOption, ProductOption } from "../types";

const UNIT_LABELS: Record<string, string> = {
  sqft: "Sq ft",
  sqm: "Sq m",
  pieces: "Pieces",
};

type StepMaterialProps = {
  products: ProductOption[];
  categories: CategoryOption[];
};

/** Step 3 — which material, how much, in which unit. */
export function StepMaterial({ products, categories }: StepMaterialProps) {
  const {
    register,
    setValue,
    formState: { errors },
  } = useFormContext<QuoteFormInput>();

  const productsByCategory = categories
    .map((category) => ({
      category,
      items: products.filter((product) => product.categorySlug === category.slug),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <SelectField
        id="material.categorySlug"
        label="Product category"
        error={errors.material?.categorySlug?.message}
        {...register("material.categorySlug", {
          onChange: (event) => {
            // Changing the category invalidates any chosen product.
            const slug = event.target.value;
            const stillValid = products.some(
              (product) => product.slug === "" || product.categorySlug === slug,
            );
            if (!stillValid) setValue("material.productSlug", "", { shouldValidate: false });
          },
        })}
      >
        <option value="">Not sure yet</option>
        {categories.map((category) => (
          <option key={category.slug} value={category.slug}>
            {category.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="material.productSlug"
        label="Product"
        error={errors.material?.productSlug?.message}
        {...register("material.productSlug")}
      >
        <option value="">Undecided — advise me</option>
        {productsByCategory.map(({ category, items }) => (
          <optgroup key={category.slug} label={category.name}>
            {items.map((product) => (
              <option key={product.slug} value={product.slug}>
                {product.name}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectField>
      <TextField
        id="material.finish"
        label="Finish"
        placeholder="e.g. brushed, matte, gloss"
        error={errors.material?.finish?.message}
        {...register("material.finish")}
      />
      <TextField
        id="material.color"
        label="Colour"
        error={errors.material?.color?.message}
        {...register("material.color")}
      />
      <TextField
        id="material.quantity"
        label="Approximate quantity"
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        error={errors.material?.quantity?.message}
        {...register("material.quantity")}
      />
      <fieldset>
        <legend className="text-label text-ink/55">Unit</legend>
        <div className="mt-3 flex gap-2">
          {UNIT_OPTIONS.map((unit) => (
            <label
              key={unit}
              className="flex min-h-[44px] cursor-pointer items-center rounded-[2px] border border-stone px-4 text-[0.8125rem] uppercase tracking-[0.12em] transition-colors has-checked:border-brass has-checked:bg-brass/10"
            >
              <input type="radio" value={unit} className="sr-only" {...register("material.unit")} />
              {UNIT_LABELS[unit] ?? unit}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
