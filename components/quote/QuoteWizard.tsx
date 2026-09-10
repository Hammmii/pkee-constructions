"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "motion/react";
import { type ReactNode, useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { type FieldPath, FormProvider, type Resolver, useForm } from "react-hook-form";
import { type QuoteActionState, submitQuote } from "@/actions/quote";
import { usePrefersReducedMotion } from "@/components/motion/use-prefers-reduced-motion";
import { QUOTE_STEPS } from "@/lib/quote";
import { cn } from "@/lib/utils";
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

const EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1]; // --ease-out-expo
const STEP_S = 0.35; // motion spec §2: standard tier

const STEP_TITLES = [
  "Your details",
  "Project",
  "Material",
  "Dimensions",
  "Customization",
  "Attachments",
  "Review",
];

const STEP_HEADINGS = [
  <>First, how do we reach you?</>,
  <>Tell us about the project.</>,
  <>Which material are you drawn to?</>,
  <>Rough dimensions.</>,
  <>Anything we should design around?</>,
  <>Photos or plans? Attach them here.</>,
  <>Review and send.</>,
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

function SubmitButton({ reduced }: { reduced: boolean }) {
  const { pending } = useFormStatus();
  return (
    <motion.button
      type="submit"
      disabled={pending}
      className={navSolid}
      whileTap={reduced ? undefined : { scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      {pending ? "Sending…" : "Submit request"}
    </motion.button>
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
 *
 * Every fieldset STAYS MOUNTED at all times (hidden inputs must remain in
 * the FormData for the server action) — so the step transition animates the
 * active fieldset in (x: 24 → 0) while the outgoing one, parked absolutely
 * for one transition duration (x → −24, opacity → 0), is then hidden. That
 * keeps one layout footprint and full progressive enhancement. Reduced
 * motion swaps steps instantly, exactly like the pre-hydration behavior.
 * Presentation only — no form logic changes.
 */
export function QuoteWizard({
  products,
  categories,
  preselected,
  turnstileSiteKey,
}: QuoteWizardProps) {
  const reduced = usePrefersReducedMotion();
  const [state, formAction] = useActionState<QuoteActionState, FormData>(submitQuote, {
    status: "idle",
  });
  const [step, setStep] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const leavingTimer = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const landingPageRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(
    () => () => {
      window.clearTimeout(leavingTimer.current);
    },
    [],
  );

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

  const transitionTo = (next: number) => {
    if (next === step) return;
    if (!reduced) {
      // Park the outgoing step absolutely while it exits, then hide it.
      setLeaving(step);
      window.clearTimeout(leavingTimer.current);
      leavingTimer.current = window.setTimeout(() => setLeaving(null), STEP_S * 1000);
    }
    setStep(next);
  };

  const goNext = async () => {
    if (step === QUOTE_STEPS - 2 && attachmentError) return;
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) transitionTo(Math.min(step + 1, QUOTE_STEPS - 1));
  };

  const goBack = () => transitionTo(Math.max(step - 1, 0));
  const goTo = (target: number) => transitionTo(Math.max(0, Math.min(target, QUOTE_STEPS - 1)));

  const fieldsetHidden = (index: number) => (mounted ? index !== step && index !== leaving : false);

  const stepBodies: ReactNode[] = [
    <StepCustomer key="customer" />,
    <StepProject key="project" />,
    <StepMaterial key="material" products={products} categories={categories} />,
    <StepDimensions key="dimensions" />,
    <StepCustomization key="customization" />,
    <StepAttachments key="attachments" onErrorChange={setAttachmentError} />,
    <StepReview key="review" products={products} onEdit={goTo} />,
  ];

  const renderStep = (index: number) => {
    const body = (
      <>
        {mounted && (
          <h2 className="mb-8 font-serif text-3xl italic text-ink">{STEP_HEADINGS[index]}</h2>
        )}
        {stepBodies[index]}
      </>
    );
    const isLeaving = mounted && leaving === index;
    const isActive = !mounted || index === step;
    const inner = reduced ? (
      body
    ) : isLeaving ? (
      <motion.div
        key="leaving"
        initial={{ opacity: 1, x: 0 }}
        animate={{ opacity: 0, x: -24 }}
        transition={{ duration: STEP_S, ease: EXPO }}
      >
        {body}
      </motion.div>
    ) : isActive ? (
      <motion.div
        key={`active-${index}`}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: STEP_S, ease: EXPO }}
      >
        {body}
      </motion.div>
    ) : (
      body
    );
    return (
      <fieldset
        key={index}
        hidden={fieldsetHidden(index)}
        className={cn("mt-10", isLeaving && "absolute inset-x-0")}
      >
        <legend className="sr-only">
          Step {index + 1} — {STEP_TITLES[index]}
        </legend>
        {inner}
      </fieldset>
    );
  };

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

        {STEP_TITLES.map((_, index) => renderStep(index))}

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
            <motion.button
              type="button"
              onClick={goBack}
              className={navGhost}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              Back
            </motion.button>
          ) : null}

          {mounted && step < QUOTE_STEPS - 1 && (
            <motion.button
              type="button"
              onClick={goNext}
              className={navSolid}
              whileTap={reduced ? undefined : { scale: 0.97 }}
              transition={{ duration: 0.15 }}
            >
              {step === QUOTE_STEPS - 2 ? "Review request" : "Continue"}
            </motion.button>
          )}

          {mounted && step === QUOTE_STEPS - 1 && <SubmitButton reduced={reduced} />}
        </div>
      </form>
    </FormProvider>
  );
}
