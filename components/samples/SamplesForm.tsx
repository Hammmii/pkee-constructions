"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactElement, useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  type FieldPath,
  FormProvider,
  type Resolver,
  useForm,
  useFormContext,
} from "react-hook-form";
import { type SamplesActionState, submitSampleRequest } from "@/actions/samples";
import { ProgressIndicator } from "@/components/quote/ProgressIndicator";
import { TurnstileWidget } from "@/components/quote/TurnstileWidget";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextField } from "@/components/ui/field/TextField";
import {
  SAMPLE_COLOR_OPTIONS,
  SAMPLE_FINISH_OPTIONS,
  SAMPLE_MAX_QUANTITY,
  SAMPLES_STEPS,
} from "@/lib/samples";
import { samplesSchema } from "@/lib/validators/samples";
import {
  CANADIAN_PROVINCES,
  SAMPLES_STEP_FIELDS,
  SAMPLES_STEP_TITLES,
  type SampleProductOption,
  type SamplesFormInput,
} from "./types";

const navBase =
  "inline-flex min-h-12 items-center justify-center px-8 text-label uppercase tracking-[0.14em] transition-colors";
const navSolid = `${navBase} bg-ink text-bone hover:bg-charcoal disabled:pointer-events-none disabled:opacity-50`;
const navGhost = `${navBase} border border-stone text-ink hover:border-ink`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={navSolid}>
      {pending ? "Sending…" : "Request samples"}
    </button>
  );
}

/**
 * Invisible honeypot trap — bots that fill `website` get a silent fake
 * success from the server action; humans never see this field.
 */
function SamplesHoneypot() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-auto left-[-10000px] h-px w-px overflow-hidden"
    >
      <label htmlFor="samples-website">
        Website
        <input id="samples-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

function StepSamples({ products }: { products: SampleProductOption[] }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<SamplesFormInput>();
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <SelectField
        id="samples-product"
        label="Product"
        error={errors.productId?.message}
        className="sm:col-span-2"
        autoComplete="off"
        {...register("productId")}
      >
        <option value="">Select a product</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="samples-color"
        label="Colour"
        error={errors.color?.message}
        autoComplete="off"
        {...register("color")}
      >
        <option value="">Select a colour</option>
        {SAMPLE_COLOR_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <SelectField
        id="samples-finish"
        label="Finish"
        error={errors.finish?.message}
        autoComplete="off"
        {...register("finish")}
      >
        <option value="">Select a finish</option>
        {SAMPLE_FINISH_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </SelectField>
      <TextField
        id="samples-quantity"
        label={`Quantity (max ${SAMPLE_MAX_QUANTITY})`}
        type="number"
        inputMode="numeric"
        min={1}
        max={SAMPLE_MAX_QUANTITY}
        error={errors.quantity?.message}
        {...register("quantity")}
      />
    </div>
  );
}

function StepContact() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SamplesFormInput>();
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <TextField
        id="samples-firstName"
        label="First name"
        autoComplete="given-name"
        error={errors.firstName?.message}
        {...register("firstName")}
      />
      <TextField
        id="samples-lastName"
        label="Last name"
        autoComplete="family-name"
        error={errors.lastName?.message}
        {...register("lastName")}
      />
      <TextField
        id="samples-email"
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <TextField
        id="samples-phone"
        label="Phone"
        type="tel"
        autoComplete="tel"
        error={errors.phone?.message}
        {...register("phone")}
      />
    </div>
  );
}

function StepDelivery() {
  const {
    register,
    formState: { errors },
  } = useFormContext<SamplesFormInput>();
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <TextField
        id="samples-address"
        label="Street address"
        autoComplete="street-address"
        error={errors.address?.message}
        className="sm:col-span-2"
        {...register("address")}
      />
      <TextField
        id="samples-city"
        label="City"
        autoComplete="address-level2"
        error={errors.city?.message}
        {...register("city")}
      />
      <SelectField
        id="samples-province"
        label="Province / territory"
        autoComplete="address-level1"
        error={errors.province?.message}
        {...register("province")}
      >
        <option value="">Select</option>
        {CANADIAN_PROVINCES.map((province) => (
          <option key={province.value} value={province.value}>
            {province.label}
          </option>
        ))}
      </SelectField>
      <TextField
        id="samples-postalCode"
        label="Postal code"
        autoComplete="postal-code"
        error={errors.postalCode?.message}
        {...register("postalCode")}
      />
    </div>
  );
}

type SamplesFormProps = {
  products: SampleProductOption[];
  /** Preselected product id (from ?product=slug on the server page). */
  preselectedProductId: string;
  /** NEXT_PUBLIC_TURNSTILE_SITE_KEY — null = widget not rendered (dev mode). */
  turnstileSiteKey: string | null;
};

/**
 * Progressive-enhancement contract: this component always renders ONE
 * <form action={submitSampleRequest}> containing every step as a
 * <fieldset>. Before hydration (or with JS disabled) the whole thing is a
 * plain long form with a native submit — the server action parses the full
 * FormData. After mount, the same DOM becomes a stepped form: non-active
 * fieldsets are hidden, per-step zod validation gates "Continue", and state
 * survives back/forward.
 */
export function SamplesForm({
  products,
  preselectedProductId,
  turnstileSiteKey,
}: SamplesFormProps): ReactElement {
  const [state, formAction] = useActionState<SamplesActionState, FormData>(submitSampleRequest, {
    status: "idle",
  });
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const form = useForm<SamplesFormInput>({
    resolver: zodResolver(samplesSchema) as unknown as Resolver<SamplesFormInput>,
    mode: "onBlur",
    defaultValues: {
      productId: preselectedProductId,
      color: "",
      finish: "",
      quantity: "1",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      province: "",
      postalCode: "",
      honeypot: "",
    },
  });

  // Surface server-side validation errors on the matching fields.
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [path, message] of Object.entries(state.errors)) {
      form.setError(path as FieldPath<SamplesFormInput>, { type: "server", message });
    }
  }, [state, form]);

  const goNext = async () => {
    const fields = SAMPLES_STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((current) => Math.min(current + 1, SAMPLES_STEPS - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));
  const fieldsetHidden = (index: number) => (mounted ? index !== step : false);

  return (
    <FormProvider {...form}>
      <form action={formAction} noValidate className="relative">
        <div className={mounted ? undefined : "sr-only"}>
          <ProgressIndicator step={step} total={SAMPLES_STEPS} labels={[...SAMPLES_STEP_TITLES]} />
        </div>

        {state.status === "error" && state.formError && (
          <p
            role="alert"
            className="mt-6 border border-clay/40 px-4 py-3 text-[0.8125rem] text-clay"
          >
            {state.formError}
          </p>
        )}

        <fieldset hidden={fieldsetHidden(0)} className="mt-10">
          <legend className="sr-only">Step 1 — {SAMPLES_STEP_TITLES[0]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Which samples can we send?</h2>
          )}
          <StepSamples products={products} />
        </fieldset>

        <fieldset hidden={fieldsetHidden(1)} className="mt-10">
          <legend className="sr-only">Step 2 — {SAMPLES_STEP_TITLES[1]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">How do we reach you?</h2>
          )}
          <StepContact />
        </fieldset>

        <fieldset hidden={fieldsetHidden(2)} className="mt-10">
          <legend className="sr-only">Step 3 — {SAMPLES_STEP_TITLES[2]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Where should we send them?</h2>
          )}
          <StepDelivery />
        </fieldset>

        <SamplesHoneypot />
        {turnstileSiteKey ? (
          <div className="mt-10">
            <TurnstileWidget siteKey={turnstileSiteKey} />
          </div>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center gap-4">
          {!mounted ? (
            // No-JS path: one long form, one native submit.
            <button type="submit" className={navSolid}>
              Request samples
            </button>
          ) : step > 0 ? (
            <button type="button" onClick={goBack} className={navGhost}>
              Back
            </button>
          ) : null}

          {mounted && step < SAMPLES_STEPS - 1 && (
            <button type="button" onClick={goNext} className={navSolid}>
              Continue
            </button>
          )}

          {mounted && step === SAMPLES_STEPS - 1 && <SubmitButton />}
        </div>
      </form>
    </FormProvider>
  );
}
