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
import { type ConsultationActionState, submitConsultation } from "@/actions/consultation";
import { ProgressIndicator } from "@/components/quote/ProgressIndicator";
import { TurnstileWidget } from "@/components/quote/TurnstileWidget";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextAreaField } from "@/components/ui/field/TextAreaField";
import { TextField } from "@/components/ui/field/TextField";
import { CONSULTATION_SLOT_LABELS, CONSULTATION_STEPS } from "@/lib/consultation";
import { consultationSchema } from "@/lib/validators/consultation";
import {
  CONSULTATION_STEP_FIELDS,
  CONSULTATION_STEP_TITLES,
  CONSULTATION_TYPE_OPTIONS,
  type ConsultationFormInput,
} from "./types";

const navBase =
  "inline-flex min-h-12 items-center justify-center px-8 text-label uppercase tracking-[0.14em] transition-colors";
const navSolid = `${navBase} bg-ink text-bone hover:bg-charcoal disabled:pointer-events-none disabled:opacity-50`;
const navGhost = `${navBase} border border-stone text-ink hover:border-ink`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={navSolid}>
      {pending ? "Booking…" : "Book consultation"}
    </button>
  );
}

/**
 * Invisible honeypot trap — bots that fill `website` get a silent fake
 * success from the server action; humans never see this field.
 */
function ConsultationHoneypot() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-auto left-[-10000px] h-px w-px overflow-hidden"
    >
      <label htmlFor="consultation-website">
        Website
        <input
          id="consultation-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </label>
    </div>
  );
}

function StepConsultation() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ConsultationFormInput>();
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <SelectField
          id="consultation-type"
          label="Consultation type"
          error={errors.type?.message}
          autoComplete="off"
          {...register("type")}
        >
          <option value="">Select a type</option>
          {CONSULTATION_TYPE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label} — {option.description}
            </option>
          ))}
        </SelectField>
      </div>
      <SelectField
        id="consultation-projectType"
        label="Project type"
        error={errors.projectType?.message}
        autoComplete="off"
        {...register("projectType")}
      >
        <option value="">Select a project type</option>
        <option value="residential">Residential</option>
        <option value="commercial">Commercial</option>
      </SelectField>
      <TextField
        id="consultation-productInterest"
        label="Product of interest (optional)"
        autoComplete="off"
        error={errors.productInterest?.message}
        {...register("productInterest")}
      />
    </div>
  );
}

function StepSchedule({ minDate }: { minDate: string }) {
  const {
    register,
    formState: { errors },
  } = useFormContext<ConsultationFormInput>();
  return (
    <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
      <TextField
        id="consultation-date"
        label="Preferred date"
        type="date"
        min={minDate}
        autoComplete="off"
        error={errors.date?.message}
        {...register("date")}
      />
      <SelectField
        id="consultation-time"
        label="Preferred time"
        error={errors.time?.message}
        autoComplete="off"
        {...register("time")}
      >
        <option value="">Select a time</option>
        {CONSULTATION_SLOT_LABELS.map((slot) => (
          <option key={slot.value} value={slot.value}>
            {slot.label}
          </option>
        ))}
      </SelectField>
      <p className="text-[0.8125rem] leading-snug text-ink/50 sm:col-span-2">
        Hourly slots, Monday to Saturday. Every booking is confirmed personally within 1 business
        day before it is final.
      </p>
    </div>
  );
}

function StepContact() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ConsultationFormInput>();
  return (
    <div className="grid gap-x-10 gap-y-8">
      <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
        <TextField
          id="consultation-firstName"
          label="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...register("firstName")}
        />
        <TextField
          id="consultation-lastName"
          label="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...register("lastName")}
        />
        <TextField
          id="consultation-email"
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register("email")}
        />
        <TextField
          id="consultation-phone"
          label="Phone"
          type="tel"
          autoComplete="tel"
          error={errors.phone?.message}
          {...register("phone")}
        />
      </div>
      <TextAreaField
        id="consultation-notes"
        label="Anything we should know? (optional)"
        rows={4}
        error={errors.notes?.message}
        {...register("notes")}
      />
    </div>
  );
}

type ConsultationFormProps = {
  /** Earliest bookable date (YYYY-MM-DD), computed on the server. */
  minDate: string;
  /** Preselected consultation type (from ?type=), validated server-side. */
  preselectedType: string;
  /** NEXT_PUBLIC_TURNSTILE_SITE_KEY — null = widget not rendered (dev mode). */
  turnstileSiteKey: string | null;
};

/**
 * Progressive-enhancement contract: this component always renders ONE
 * <form action={submitConsultation}> containing every step as a
 * <fieldset>. Before hydration (or with JS disabled) the whole thing is a
 * plain long form with a native submit. After mount, the same DOM becomes a
 * stepped form: per-step zod validation gates "Continue".
 */
export function ConsultationForm({
  minDate,
  preselectedType,
  turnstileSiteKey,
}: ConsultationFormProps): ReactElement {
  const [state, formAction] = useActionState<ConsultationActionState, FormData>(
    submitConsultation,
    { status: "idle" },
  );
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const form = useForm<ConsultationFormInput>({
    resolver: zodResolver(consultationSchema) as unknown as Resolver<ConsultationFormInput>,
    mode: "onBlur",
    defaultValues: {
      type: preselectedType,
      projectType: "",
      productInterest: "",
      date: "",
      time: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      notes: "",
      honeypot: "",
    },
  });

  // Surface server-side validation errors on the matching fields.
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [path, message] of Object.entries(state.errors)) {
      form.setError(path as FieldPath<ConsultationFormInput>, { type: "server", message });
    }
  }, [state, form]);

  const goNext = async () => {
    const fields = CONSULTATION_STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((current) => Math.min(current + 1, CONSULTATION_STEPS - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));
  const fieldsetHidden = (index: number) => (mounted ? index !== step : false);

  return (
    <FormProvider {...form}>
      <form action={formAction} noValidate className="relative">
        <div className={mounted ? undefined : "sr-only"}>
          <ProgressIndicator
            step={step}
            total={CONSULTATION_STEPS}
            labels={[...CONSULTATION_STEP_TITLES]}
          />
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
          <legend className="sr-only">Step 1 — {CONSULTATION_STEP_TITLES[0]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">What kind of consultation?</h2>
          )}
          <StepConsultation />
        </fieldset>

        <fieldset hidden={fieldsetHidden(1)} className="mt-10">
          <legend className="sr-only">Step 2 — {CONSULTATION_STEP_TITLES[1]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Pick a date and time.</h2>
          )}
          <StepSchedule minDate={minDate} />
        </fieldset>

        <fieldset hidden={fieldsetHidden(2)} className="mt-10">
          <legend className="sr-only">Step 3 — {CONSULTATION_STEP_TITLES[2]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">How do we reach you?</h2>
          )}
          <StepContact />
        </fieldset>

        <ConsultationHoneypot />
        {turnstileSiteKey ? (
          <div className="mt-10">
            <TurnstileWidget siteKey={turnstileSiteKey} />
          </div>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center gap-4">
          {!mounted ? (
            // No-JS path: one long form, one native submit.
            <button type="submit" className={navSolid}>
              Book consultation
            </button>
          ) : step > 0 ? (
            <button type="button" onClick={goBack} className={navGhost}>
              Back
            </button>
          ) : null}

          {mounted && step < CONSULTATION_STEPS - 1 && (
            <button type="button" onClick={goNext} className={navSolid}>
              Continue
            </button>
          )}

          {mounted && step === CONSULTATION_STEPS - 1 && <SubmitButton />}
        </div>
      </form>
    </FormProvider>
  );
}
