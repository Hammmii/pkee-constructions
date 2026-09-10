"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { type FieldPath, FormProvider, type Resolver, useForm } from "react-hook-form";
import { type QuoteActionState, submitQuote } from "@/actions/quote";
import { QUOTE_STEPS } from "@/lib/quote";
import { type QuoteFormInput, quoteSchema } from "@/lib/validators/quote";
import { HoneypotField } from "./HoneypotField";
import { ProgressIndicator } from "./ProgressIndicator";
import { StepAttachments } from "./steps/StepAttachments";
import { StepCustomer } from "./steps/StepCustomer";
import { StepCustomization } from "./steps/StepCustomization";
import { StepDimensions } from "./steps/StepDimensions";
import { StepMaterial } from "./steps/StepMaterial";
import { StepProject } from "./steps/StepProject";
import { StepReview } from "./steps/StepReview";
import { TurnstileWidget } from "./TurnstileWidget";
import type { CategoryOption, PreselectedProduct, ProductOption } from "./types";

const STEP_TITLES = [
  "Your details",
  "Project",
  "Material",
  "Dimensions",
  "Customization",
  "Attachments",
  "Review",
];

/** Fields validated when leaving each step (index 5 = attachments, index 6 = review). */
const STEP_FIELDS: FieldPath<QuoteFormInput>[][] = [
  [
    "customer.name",
    "customer.email",
    "customer.phone",
    "customer.preferredContact",
    "customer.city",
    "customer.postalCode",
  ],
  ["project.projectType", "project.buildType", "project.roomType", "project.timeline"],
  [
    "material.categorySlug",
    "material.productSlug",
    "material.finish",
    "material.color",
    "material.quantity",
    "material.unit",
  ],
  [
    "dimensions.width",
    "dimensions.height",
    "dimensions.floorArea",
    "dimensions.wallCount",
    "dimensions.doorCount",
  ],
  [
    "customization.designRequirements",
    "customization.lighting",
    "customization.fabrication",
    "customization.installationRequired",
    "customization.deliveryRequired",
  ],
  [],
  [],
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

type QuoteWizardProps = {
  products: ProductOption[];
  categories: CategoryOption[];
  preselected: PreselectedProduct | null;
  /** NEXT_PUBLIC_TURNSTILE_SITE_KEY — null = widget not rendered (dev mode). */
  turnstileSiteKey: string | null;
};

/**
 * Progressive-enhancement contract: this component always renders ONE
 * <form action={submitQuote}> containing every step as a <fieldset>. Before
 * hydration (or with JS disabled) the whole thing is a plain long form with a
 * native submit — the server action parses the full FormData. After mount,
 * the same DOM becomes a stepped wizard: non-active fieldsets are hidden,
 * per-step zod validation gates "Continue", and state survives back/forward.
 */
export function QuoteWizard({
  products,
  categories,
  preselected,
  turnstileSiteKey,
}: QuoteWizardProps) {
  const [state, formAction] = useActionState<QuoteActionState, FormData>(submitQuote, {
    status: "idle",
  });
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const landingPageRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Capture the entry page client-side; the no-JS path simply sends nothing.
  useEffect(() => {
    const input = landingPageRef.current;
    if (input && !input.value) input.value = document.referrer;
  }, []);

  const form = useForm<QuoteFormInput>({
    resolver: zodResolver(quoteSchema) as unknown as Resolver<QuoteFormInput>,
    mode: "onBlur",
    defaultValues: {
      customer: { name: "", email: "", phone: "", preferredContact: "", city: "", postalCode: "" },
      project: { projectType: "", buildType: "", roomType: "", timeline: "" },
      material: {
        categorySlug: preselected?.categorySlug ?? "",
        productSlug: preselected?.slug ?? "",
        finish: "",
        color: "",
        quantity: "",
        unit: "",
      },
      dimensions: { width: "", height: "", floorArea: "", wallCount: "", doorCount: "" },
      customization: {
        designRequirements: "",
        lighting: "",
        fabrication: "",
        installationRequired: false,
        deliveryRequired: false,
      },
      hp: "",
    },
  });

  // Surface server-side validation errors on the matching fields.
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [path, message] of Object.entries(state.errors)) {
      form.setError(path as FieldPath<QuoteFormInput>, { type: "server", message });
    }
  }, [state, form]);

  const goNext = async () => {
    if (step === QUOTE_STEPS - 2 && attachmentError) return;
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((current) => Math.min(current + 1, QUOTE_STEPS - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));
  const goTo = (target: number) => setStep(Math.max(0, Math.min(target, QUOTE_STEPS - 1)));

  const fieldsetHidden = (index: number) => (mounted ? index !== step : false);

  return (
    <FormProvider {...form}>
      <form action={formAction} noValidate className="relative">
        <div className={mounted ? undefined : "sr-only"}>
          <ProgressIndicator step={step} total={QUOTE_STEPS} labels={STEP_TITLES} />
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
            <h2 className="mb-8 font-serif text-3xl italic text-ink">
              First, how do we reach you?
            </h2>
          )}
          <StepCustomer />
        </fieldset>

        <fieldset hidden={fieldsetHidden(1)} className="mt-10">
          <legend className="sr-only">Step 2 — {STEP_TITLES[1]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Tell us about the project.</h2>
          )}
          <StepProject />
        </fieldset>

        <fieldset hidden={fieldsetHidden(2)} className="mt-10">
          <legend className="sr-only">Step 3 — {STEP_TITLES[2]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">
              Which material are you drawn to?
            </h2>
          )}
          <StepMaterial products={products} categories={categories} />
        </fieldset>

        <fieldset hidden={fieldsetHidden(3)} className="mt-10">
          <legend className="sr-only">Step 4 — {STEP_TITLES[3]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Rough dimensions.</h2>
          )}
          <StepDimensions />
        </fieldset>

        <fieldset hidden={fieldsetHidden(4)} className="mt-10">
          <legend className="sr-only">Step 5 — {STEP_TITLES[4]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">
              Anything we should design around?
            </h2>
          )}
          <StepCustomization />
        </fieldset>

        <fieldset hidden={fieldsetHidden(5)} className="mt-10">
          <legend className="sr-only">Step 6 — {STEP_TITLES[5]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">
              Photos or plans? Attach them here.
            </h2>
          )}
          <StepAttachments onErrorChange={setAttachmentError} />
        </fieldset>

        <fieldset hidden={fieldsetHidden(6)} className="mt-10">
          <legend className="sr-only">Step 7 — {STEP_TITLES[6]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Review and send.</h2>
          )}
          <StepReview products={products} onEdit={goTo} />
        </fieldset>

        <HoneypotField />
        <input ref={landingPageRef} type="hidden" name="landingPage" />
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

          {mounted && step < QUOTE_STEPS - 1 && (
            <button type="button" onClick={goNext} className={navSolid}>
              {step === QUOTE_STEPS - 2 ? "Review request" : "Continue"}
            </button>
          )}

          {mounted && step === QUOTE_STEPS - 1 && <SubmitButton />}
        </div>
      </form>
    </FormProvider>
  );
}
