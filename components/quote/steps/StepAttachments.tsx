"use client";

import { QUOTE_ATTACHMENT_RULES } from "@/lib/quote";

type StepAttachmentsProps = {
  /** Staged files, owned by the wizard (the <input> lives outside the fieldsets). */
  files: File[];
  /** Wizard-owned: blocks "Continue" while a client-side error is present. */
  error: string | null;
  onClear: () => void;
};

const MAX_MB = QUOTE_ATTACHMENT_RULES.maxBytesPerFile / (1024 * 1024);

/**
 * Step 6 — room photos, floor plans, inspiration. The actual <input
 * name="attachments"> is rendered by QuoteWizard OUTSIDE the stepped
 * fieldsets: a control inside a `hidden` fieldset is excluded from the
 * FormData the server action receives, which silently dropped staged files
 * on submit. This component is the visible UI (drop label, staged list,
 * clear) and targets the always-mounted input via htmlFor. Without JS the
 * wizard renders a plain visible file input inside the native form post.
 */
export function StepAttachments({ files, error, onClear }: StepAttachmentsProps) {
  return (
    <div>
      <p className="mb-8 max-w-xl text-ink/60">
        Room photos, floor plans, or inspiration images help us quote faster. Up to{" "}
        {QUOTE_ATTACHMENT_RULES.maxFiles} files, {MAX_MB} MB each — images or PDF.
      </p>
      <label
        htmlFor="attachments"
        className="flex min-h-[44px] cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-stone px-6 py-10 text-center transition-colors hover:border-brass"
      >
        <span className="text-label text-ink/55">Choose files</span>
        <span className="text-sm text-ink/45">or drag and drop — they ride along on submit</span>
      </label>

      {error && (
        <p role="alert" className="mt-4 text-[0.8125rem] leading-snug text-clay">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="mt-6 space-y-2">
          {files.map((file) => (
            <li
              key={`${file.name}-${file.size}`}
              className="flex items-baseline justify-between gap-6 border-t py-3 rule"
            >
              <span className="text-ink">{file.name}</span>
              <span className="text-label text-ink/45">
                {(file.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <button
          type="button"
          onClick={onClear}
          className="mt-4 text-[0.8125rem] uppercase tracking-[0.12em] text-clay underline-offset-4 hover:underline"
        >
          Remove all
        </button>
      )}
    </div>
  );
}
