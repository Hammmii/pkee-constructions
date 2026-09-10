"use client";

import { useFormContext } from "react-hook-form";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextAreaField } from "@/components/ui/field/TextAreaField";
import { TextField } from "@/components/ui/field/TextField";
import {
  ANNUAL_TURNOVER_BRACKETS,
  BUSINESS_TYPE_LABELS,
  BUSINESS_TYPES,
  type TradeFormInput,
  TURNOVER_LABELS,
} from "@/lib/validators/trade";

/** Step 1 — who is applying and how the business reaches them. */
export function StepBusinessDetails() {
  const {
    register,
    formState: { errors },
  } = useFormContext<TradeFormInput>();

  return (
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
        id="companyName"
        label="Company name"
        autoComplete="organization"
        error={errors.companyName?.message}
        {...register("companyName")}
      />
      <TextField
        id="gstNumber"
        label="GST / business number"
        autoComplete="off"
        placeholder="Optional"
        error={errors.gstNumber?.message}
        {...register("gstNumber")}
      />
      <div className="sm:col-span-2">
        <TextField
          id="companyAddress"
          label="Business address"
          autoComplete="street-address"
          error={errors.companyAddress?.message}
          {...register("companyAddress")}
        />
      </div>
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
      <TextField
        id="city"
        label="City"
        autoComplete="address-level2"
        error={errors.city?.message}
        {...register("city")}
      />
      <TextField
        id="province"
        label="Province / territory"
        autoComplete="address-level1"
        error={errors.province?.message}
        {...register("province")}
      />
      <TextField
        id="postalCode"
        label="Postal code"
        autoComplete="postal-code"
        error={errors.postalCode?.message}
        {...register("postalCode")}
      />
    </div>
  );
}

/** Step 2 — what the business is and the shape of its trade. */
export function StepBusinessProfile() {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<TradeFormInput>();
  const carriesOtherBrands = watch("otherBrands");

  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <SelectField
        id="businessType"
        label="Business type"
        autoComplete="off"
        error={errors.businessType?.message}
        {...register("businessType")}
      >
        <option value="">Select…</option>
        {BUSINESS_TYPES.map((option) => (
          <option key={option} value={option}>
            {BUSINESS_TYPE_LABELS[option] ?? option}
          </option>
        ))}
      </SelectField>
      <TextField
        id="yearsInBusiness"
        label="Years in business"
        type="number"
        min={0}
        max={150}
        step={1}
        inputMode="numeric"
        autoComplete="off"
        error={errors.yearsInBusiness?.message}
        {...register("yearsInBusiness")}
      />
      <SelectField
        id="annualTurnover"
        label="Annual turnover"
        autoComplete="off"
        error={errors.annualTurnover?.message}
        {...register("annualTurnover")}
      >
        <option value="">Select…</option>
        {ANNUAL_TURNOVER_BRACKETS.map((option) => (
          <option key={option} value={option}>
            {TURNOVER_LABELS[option] ?? option}
          </option>
        ))}
      </SelectField>
      <div>
        <span className="text-label text-ink/55">Carry other brands?</span>
        <label className="mt-3 flex min-h-[44px] w-fit cursor-pointer items-center gap-3 text-sm text-ink">
          <input type="checkbox" className="size-4 accent-brass" {...register("otherBrands")} />
          Yes, we currently carry other brands
        </label>
      </div>
      {carriesOtherBrands && (
        <TextField
          id="otherBrandNames"
          label="Brands you carry"
          autoComplete="off"
          error={errors.otherBrandNames?.message}
          {...register("otherBrandNames")}
        />
      )}
      <div className="sm:col-span-2">
        <TextAreaField
          id="moreInfo"
          label="Anything else we should know"
          rows={4}
          placeholder="Territory you serve, showroom size, the categories you want to carry…"
          error={errors.moreInfo?.message}
          {...register("moreInfo")}
        />
      </div>
    </div>
  );
}
