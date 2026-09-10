"use client";

import { useEffect, useRef, useState } from "react";
import { CUSTOM_STUDIO_ATTACHMENT_RULES } from "@/lib/customStudio";

const MAX_MB = CUSTOM_STUDIO_ATTACHMENT_RULES.maxBytesPerFile / (1024 * 1024);

function PreviewThumb({ file }: { file: File }) {
  const url = URL.createObjectURL(file);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  if (!file.type.startsWith("image/")) {
    return <span className="text-label text-ink/45">PDF</span>;
  }
  // biome-ignore lint/performance/noImgElement: client-only object-URL preview; next/image cannot optimize a blob URL.
  return <img src={url} alt="" className="size-12 border border-stone object-cover" />;
}

type StepUploadProps = {
  /** Wizard-owned: blocks "Continue" while a client-side error is present. */
  onErrorChange: (message: string | null) => void;
};

/**
 * Step 2 — reference files: a sketch, a photo of the space, an inspiration
 * image, or a PDF. Client-side guardrails (≤5 files, ≤10 MB each, images +
 * PDF only) are re-checked server-side in the action. Without JS this
 * degrades to a plain file input inside the native form post. Optional.
 */
export function StepUpload({ onErrorChange }: StepUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validate = (list: File[]): string | null => {
    if (list.length > CUSTOM_STUDIO_ATTACHMENT_RULES.maxFiles) {
      return `Please attach at most ${CUSTOM_STUDIO_ATTACHMENT_RULES.maxFiles} files.`;
    }
    for (const file of list) {
      const isImage = file.type.startsWith("image/");
      const isPdf = file.type === "application/pdf";
      if (!isImage && !isPdf) return `"${file.name}" isn't an image or PDF.`;
      if (file.size > CUSTOM_STUDIO_ATTACHMENT_RULES.maxBytesPerFile) {
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
        A sketch, a photo of the space, an inspiration image, or a spec sheet — anything that helps
        our designers see what you see. Up to {CUSTOM_STUDIO_ATTACHMENT_RULES.maxFiles} files,{" "}
        {MAX_MB} MB each — images or PDF. Optional.
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
          accept={CUSTOM_STUDIO_ATTACHMENT_RULES.accept}
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
              className="flex items-center gap-4 border-t py-3 rule"
            >
              <PreviewThumb file={file} />
              <span className="min-w-0 flex-1 truncate text-ink">{file.name}</span>
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
