"use client";

import { useFormContext } from "react-hook-form";
import { TextField } from "@/components/ui/field/TextField";
import type { CustomStudioFormInput } from "@/lib/validators/customStudio";

/** Step 5 — who to call back, plus a final review of the brief. */
export function StepContact() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<CustomStudioFormInput>();
  const values = watch();

  const reviewRows: Array<[string, string | undefined]> = [
    ["Base material", values.baseMaterial || undefined],
    ["Finish", values.finish || undefined],
    ["Dimensions", [values.width, values.height].filter(Boolean).join(" × ") || undefined],
    ["Quantity / area", values.quantity || undefined],
    [
      "Brief",
      values.description
        ? values.description.length > 80
          ? `${values.description.slice(0, 80)}…`
          : values.description
        : undefined,
    ],
    ["Contact", [values.firstName, values.lastName].filter(Boolean).join(" ") || undefined],
    ["Email", values.email || undefined],
    ["Phone", values.phone || undefined],
  ];

  return (
    <div>
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <TextField
          id="firstName"
          label="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <TextField
          id="lastName"
          label="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          id="phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>

      <h3 className="mt-14 text-label text-ink/55">Review your request</h3>
      <dl className="mt-4">
        {reviewRows.map(([label, value]) =>
          value ? (
            <div
              key={label}
              className="flex items-baseline justify-between gap-6 border-t py-3.5 rule"
            >
              <dt className="text-label shrink-0 text-ink/55">{label}</dt>
              <dd className="text-right text-ink">{value}</dd>
            </div>
          ) : null,
        )}
      </dl>
      <p className="mt-4 text-sm text-ink/45">Use Back to change anything before submitting.</p>
    </div>
  );
}
