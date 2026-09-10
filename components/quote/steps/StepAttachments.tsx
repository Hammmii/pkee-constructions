"use client";

import { useRef, useState } from "react";
import { QUOTE_ATTACHMENT_RULES } from "@/lib/quote";

type StepAttachmentsProps = {
  /** Wizard-owned: blocks "Continue" while a client-side error is present. */
  onErrorChange: (message: string | null) => void;
};

const MAX_MB = QUOTE_ATTACHMENT_RULES.maxBytesPerFile / (1024 * 1024);

/**
 * Step 6 — room photos, floor plans, inspiration. Client-side guardrails
 * (≤5 files, ≤10 MB each, images + PDF only) are re-checked server-side in
 * the action. Without JS this degrades to a plain file input inside the
 * native form post.
 */
export function StepAttachments({ onErrorChange }: StepAttachmentsProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validate = (list: File[]): string | null => {
    if (list.length > QUOTE_ATTACHMENT_RULES.maxFiles) {
      return `Please attach at most ${QUOTE_ATTACHMENT_RULES.maxFiles} files.`;
    }
    for (const file of list) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) return `"${file.name}" isn't an image or PDF.`;
      if (file.size > QUOTE_ATTACHMENT_RULES.maxBytesPerFile) {
        return `"${file.name}" is over ${MAX_MB} MB.`;
      }
    }
    return null;
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const list = Array.from(event.target.files ?? []);
    const message = validate(list);
    setError(message);
    onErrorChange(message);
    setFiles(message ? [] : list);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setFiles([]);
    setError(null);
    onErrorChange(null);
  };

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
        <input
          ref={inputRef}
          id="attachments"
          name="attachments"
          type="file"
          multiple
          accept={QUOTE_ATTACHMENT_RULES.accept}
          className="sr-only"
          onChange={handleChange}
        />
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
          onClick={clear}
          className="mt-4 text-[0.8125rem] uppercase tracking-[0.12em] text-clay underline-offset-4 hover:underline"
        >
          Remove all
        </button>
      )}
    </div>
  );
}
