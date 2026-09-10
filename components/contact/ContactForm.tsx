"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { type FieldPath, FormProvider, type Resolver, useForm } from "react-hook-form";
import { type ContactActionState, submitContactMessage } from "@/actions/contact";
import { TurnstileWidget } from "@/components/quote/TurnstileWidget";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextAreaField } from "@/components/ui/field/TextAreaField";
import { TextField } from "@/components/ui/field/TextField";
import { CONTACT_SUBJECT_LABELS, CONTACT_SUBJECTS } from "@/lib/contact";
import { type ContactFormInput, contactMessageSchema } from "@/lib/validators/contact";
import { HoneypotField } from "./HoneypotField";

const submitBase =
  "inline-flex h-14 min-w-[10rem] select-none items-center justify-center rounded-[2px] px-8 " +
  "text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-colors duration-500";
const submitSolid = `${submitBase} bg-ink text-bone hover:bg-charcoal disabled:pointer-events-none disabled:opacity-50`;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={submitSolid}>
      {pending ? "Sending…" : "Send message"}
    </button>
  );
}

type ContactFormProps = {
  /** NEXT_PUBLIC_TURNSTILE_SITE_KEY — null = widget not rendered (dev mode). */
  turnstileSiteKey: string | null;
};

/**
 * Progressive-enhancement contract (same as the trade application): one
 * <form action={submitContactMessage}> that works as a plain no-JS form;
 * after hydration RHF adds inline zod validation. Server-side errors are
 * surfaced onto the matching fields.
 */
export function ContactForm({ turnstileSiteKey }: ContactFormProps) {
  const [state, formAction] = useActionState<ContactActionState, FormData>(submitContactMessage, {
    status: "idle",
  });

  const form = useForm<ContactFormInput>({
    resolver: zodResolver(contactMessageSchema) as unknown as Resolver<ContactFormInput>,
    mode: "onBlur",
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  // Surface server-side validation errors on the matching fields.
  useEffect(() => {
    if (state.status !== "error") return;
    for (const [path, message] of Object.entries(state.errors)) {
      form.setError(path as FieldPath<ContactFormInput>, { type: "server", message });
    }
  }, [state, form]);

  return (
    <FormProvider {...form}>
      <form action={formAction} noValidate className="relative">
        {state.status === "error" && state.formError && (
          <p role="alert" className="border border-clay/40 px-4 py-3 text-[0.8125rem] text-clay">
            {state.formError}
          </p>
        )}

        <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2">
          <TextField
            id="name"
            label="Name"
            autoComplete="name"
            error={form.formState.errors.name?.message}
            {...form.register("name")}
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            error={form.formState.errors.email?.message}
            {...form.register("email")}
          />
          <TextField
            id="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            placeholder="Optional"
            error={form.formState.errors.phone?.message}
            {...form.register("phone")}
          />
          <SelectField
            id="subject"
            label="Topic"
            autoComplete="off"
            error={form.formState.errors.subject?.message}
            {...form.register("subject")}
          >
            <option value="">Select…</option>
            {CONTACT_SUBJECTS.map((option) => (
              <option key={option} value={option}>
                {CONTACT_SUBJECT_LABELS[option] ?? option}
              </option>
            ))}
          </SelectField>
          <div className="sm:col-span-2">
            <TextAreaField
              id="message"
              label="Message"
              rows={6}
              autoComplete="off"
              placeholder="What are you planning, and how can we help?"
              error={form.formState.errors.message?.message}
              {...form.register("message")}
            />
          </div>
        </div>

        <HoneypotField />
        {turnstileSiteKey ? (
          <div className="mt-10">
            <TurnstileWidget siteKey={turnstileSiteKey} />
          </div>
        ) : null}

        <div className="mt-12">
          <SubmitButton />
        </div>
      </form>
    </FormProvider>
  );
}
