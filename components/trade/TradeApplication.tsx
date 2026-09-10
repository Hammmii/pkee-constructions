"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { type FieldPath, FormProvider, type Resolver, useForm } from "react-hook-form";
import { submitTradeApplication, type TradeActionState } from "@/actions/trade";
import { TurnstileWidget } from "@/components/quote/TurnstileWidget";
import { TRADE_STEPS } from "@/lib/trade";
import { type TradeFormInput, tradeApplicationSchema } from "@/lib/validators/trade";
import { HoneypotField } from "./HoneypotField";
import { StepBusinessDetails, StepBusinessProfile } from "./steps/StepBusiness";
import { StepDocumentsReview } from "./steps/StepDocumentsReview";

const STEP_TITLES = ["Business details", "Business profile", "Documents & review"];

/** Fields validated when leaving each step (index 2 = attachments + review). */
const STEP_FIELDS: FieldPath<TradeFormInput>[][] = [
  [
    "firstName",
    "lastName",
    "companyName",
    "companyAddress",
    "email",
    "phone",
    "city",
    "province",
    "postalCode",
  ],
  ["businessType", "yearsInBusiness", "annualTurnover", "otherBrandNames"],
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
      {pending ? "Sending…" : "Submit application"}
    </button>
  );
}

type TradeApplicationProps = {
  /** NEXT_PUBLIC_TURNSTILE_SITE_KEY — null = widget not rendered (dev mode). */
  turnstileSiteKey: string | null;
};

/**
 * Progressive-enhancement contract: this component always renders ONE
 * <form action={submitTradeApplication}> containing every step as a
 * <fieldset>. Before hydration (or with JS disabled) the whole thing is a
 * plain long form with a native submit — the server action parses the full
 * FormData. After mount, the same DOM becomes a stepped wizard: non-active
 * fieldsets are hidden, per-step zod validation gates "Continue", and state
 * survives back/forward.
 */
export function TradeApplication({ turnstileSiteKey }: TradeApplicationProps) {
  const [state, formAction] = useActionState<TradeActionState, FormData>(submitTradeApplication, {
    status: "idle",
  });
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const form = useForm<TradeFormInput>({
    resolver: zodResolver(tradeApplicationSchema) as unknown as Resolver<TradeFormInput>,
    mode: "onBlur",
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      companyAddress: "",
      email: "",
      phone: "",
      city: "",
      province: "",
      postalCode: "",
      gstNumber: "",
      businessType: "",
      yearsInBusiness: "",
      annualTurnover: "",
      otherBrands: false,
      otherBrandNames: "",
      moreInfo: "",
    },
  });

  // Surface server-side validation errors on the matching fields.
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [path, message] of Object.entries(state.errors)) {
      form.setError(path as FieldPath<TradeFormInput>, { type: "server", message });
    }
  }, [state, form]);

  const goNext = async () => {
    if (step === TRADE_STEPS - 1 && attachmentError) return;
    const fields = STEP_FIELDS[step] ?? [];
    const valid = fields.length === 0 || (await form.trigger(fields));
    if (valid) setStep((current) => Math.min(current + 1, TRADE_STEPS - 1));
  };

  const goBack = () => setStep((current) => Math.max(current - 1, 0));

  const fieldsetHidden = (index: number) => (mounted ? index !== step : false);

  return (
    <FormProvider {...form}>
      <form action={formAction} noValidate className="relative">
        <div className={mounted ? undefined : "sr-only"}>
          <TradeProgress step={step} />
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
            <h2 className="mb-8 font-serif text-3xl italic text-ink">First, the business.</h2>
          )}
          <StepBusinessDetails />
        </fieldset>

        <fieldset hidden={fieldsetHidden(1)} className="mt-10">
          <legend className="sr-only">Step 2 — {STEP_TITLES[1]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Now, the profile.</h2>
          )}
          <StepBusinessProfile />
        </fieldset>

        <fieldset hidden={fieldsetHidden(2)} className="mt-10">
          <legend className="sr-only">Step 3 — {STEP_TITLES[2]}</legend>
          {mounted && (
            <h2 className="mb-8 font-serif text-3xl italic text-ink">Documents and review.</h2>
          )}
          <StepDocumentsReview onErrorChange={setAttachmentError} />
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
              Submit application
            </button>
          ) : step > 0 ? (
            <button type="button" onClick={goBack} className={navGhost}>
              Back
            </button>
          ) : null}

          {mounted && step < TRADE_STEPS - 1 && (
            <button type="button" onClick={goNext} className={navSolid}>
              Continue
            </button>
          )}

          {mounted && step === TRADE_STEPS - 1 && <SubmitButton />}
        </div>
      </form>
    </FormProvider>
  );
}

/** Brass step counter + hairline progress rule (shared idiom with the quote wizard). */
function TradeProgress({ step }: { step: number }) {
  const label = STEP_TITLES[step];
  return (
    <div aria-live="polite">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-label text-brass">
          {label ? `Step ${step + 1} — ${label}` : `Step ${step + 1}`}
        </p>
        <p className="text-label text-ink/45">
          {step + 1} / {TRADE_STEPS}
        </p>
      </div>
      <div className="mt-3 h-px w-full bg-ink/15">
        <div
          className="h-px origin-left bg-brass transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${(step + 1) / TRADE_STEPS})` }}
        />
      </div>
    </div>
  );
}
