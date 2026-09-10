"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { type FieldPath, FormProvider, type Resolver, useForm } from "react-hook-form";
import { type CustomStudioActionState, submitCustomStudioRequest } from "@/actions/customStudio";
import { TurnstileWidget } from "@/components/quote/TurnstileWidget";
import { CUSTOM_STUDIO_STEPS } from "@/lib/customStudio";
import {
  type CustomStudioFormInput,
  customStudioRequestSchema,
} from "@/lib/validators/customStudio";
import { HoneypotField } from "./HoneypotField";
import { StepContact } from "./steps/StepContact";
import { StepDesign } from "./steps/StepDesign";
import { StepDimensions } from "./steps/StepDimensions";
import { StepMaterial } from "./steps/StepMaterial";
import { StepUpload } from "./steps/StepUpload";

const STEP_TITLES = [
  "Material & finish",
  "Reference upload",
  "Dimensions",
  "Design brief",
  "Contact & review",
];

/** Fields validated when leaving each step (index 1 = attachments guard). */
const STEP_FIELDS: FieldPath<CustomStudioFormInput>[][] = [
  ["baseMaterial", "finish"],
  [],
  ["width", "height", "quantity"],
  ["description"],
  ["firstName", "lastName", "email", "phone"],
];

const navBase =
  "inline-flex h-14 min-w-[10rem] select-none items-center justify-center rounded-[2px] px-8 " +
  "text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-colors duration-500";

const navSolid = `${navBase} bg-ink text-bone hover:bg-charcoal disabled:pointer-events-none disabled:opacity-50`;
const navGhost = `${navBase} border border-stone text-ink hover:border-ink`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={navSolid}>
      {pending ? "Sending…" : "Submit request"}
    </button>
  );
}

type CustomStudioWizardProps = {
  /** Distinct `material` values from published Products (fallback list when empty). */
  materials: string[];
  /** NEXT_PUBLIC_TURNSTILE_SITE_KEY — null = widget not rendered (dev mode). */
  turnstileSiteKey: string | null;
};

/**
 * Progressive-enhancement contract: this component always renders ONE
 * <form action={submitCustomStudioRequest}> containing every step as a
 * <fieldset>. Before hydration (or with JS disabled) the whole thing is a
 * plain long form with a native submit — the server action parses the full
 * FormData. After mount, the same DOM becomes a stepped wizard: non-active
 * fieldsets are hidden, per-step zod validation gates "Continue", and state
 * survives back/forward.
 */
export function CustomStudioWizard({ materials, turnstileSiteKey }: CustomStudioWizardProps) {
  const [state, formAction] = useActionState<CustomStudioActionState, FormData>(
    submitCustomStudioRequest,
    { status: "idle" },
  );
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const form = useForm<CustomStudioFormInput>({
    resolver: zodResolver(customStudioRequestSchema) as unknown as Resolver<CustomStudioFormInput>,
    mode: "onBlur",
    defaultValues: {
      baseMaterial: "",
      finish: "",
      width: "",
      height: "",
      quantity: "",
      description: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  // Surface server-side validation errors on the matching fields.
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [path, message] of Object.entries(state.errors)) {
      form.setError(path as FieldPath<CustomStudioFormInput>, { type: "server", message });
    }
  }, [state, form]);

  const goNext = async () => {
    if (step === 1 && attachmentError) return;
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((current) => Math.min(current + 1, CUSTOM_STUDIO_STEPS - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const fieldsetHidden = (index: number) => (mounted ? index !== step : false);

  return (
    <FormProvider {...form}>
      <form action={formAction} noValidate className="relative">
        <div className={mounted ? undefined : "sr-only"}>
          <WizardProgress step={step} />
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
          <legend className="sr-only">Step 1 — {STEP_TITLES[0]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">First, the material.</h2>
          )}
          <StepMaterial materials={materials} />
        </fieldset>

        <fieldset hidden={fieldsetHidden(1)} className="mt-10">
          <legend className="sr-only">Step 2 — {STEP_TITLES[1]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Show us what you see.</h2>
          )}
          <StepUpload onErrorChange={setAttachmentError} />
        </fieldset>

        <fieldset hidden={fieldsetHidden(2)} className="mt-10">
          <legend className="sr-only">Step 3 — {STEP_TITLES[2]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Now, the measurements.</h2>
          )}
          <StepDimensions />
        </fieldset>

        <fieldset hidden={fieldsetHidden(3)} className="mt-10">
          <legend className="sr-only">Step 4 — {STEP_TITLES[3]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Describe the design.</h2>
          )}
          <StepDesign />
        </fieldset>

        <fieldset hidden={fieldsetHidden(4)} className="mt-10">
          <legend className="sr-only">Step 5 — {STEP_TITLES[4]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Where do we reach you?</h2>
          )}
          <StepContact />
        </fieldset>

        <HoneypotField />
        {turnstileSiteKey ? (
          <div className="mt-10">
            <TurnstileWidget siteKey={turnstileSiteKey} />
          </div>
        ) : null}

        <div className="mt-12 flex flex-wrap items-center gap-4">
          {!mounted ? (
            // No-JS path: one long form, one native submit.
            <button type="submit" className={navSolid}>
              Submit request
            </button>
          ) : step > 0 ? (
            <button type="button" onClick={goBack} className={navGhost}>
              Back
            </button>
          ) : null}

          {mounted && step < CUSTOM_STUDIO_STEPS - 1 && (
            <button type="button" onClick={goNext} className={navSolid}>
              Continue
            </button>
          )}

          {mounted && step === CUSTOM_STUDIO_STEPS - 1 && <SubmitButton />}
        </div>
      </form>
    </FormProvider>
  );
}

/** Brass step counter + hairline progress rule (shared idiom with the other wizards). */
function WizardProgress({ step }: { step: number }) {
  const label = STEP_TITLES[step];
  return (
    <div aria-live="polite">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-label text-brass">
          {label ? `Step ${step + 1} — ${label}` : `Step ${step + 1}`}
        </p>
        <p className="text-label text-ink/45">
          {step + 1} / {CUSTOM_STUDIO_STEPS}
        </p>
      </div>
      <div className="mt-3 h-px w-full bg-ink/15">
        <div
          className="h-px origin-left bg-brass transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${(step + 1) / CUSTOM_STUDIO_STEPS})` }}
        />
      </div>
    </div>
  );
}
