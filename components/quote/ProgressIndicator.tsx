type ProgressIndicatorProps = {
  step: number;
  total: number;
  labels: string[];
};

/**
 * Brass step counter + hairline progress rule. The fill animates with
 * scaleX only (never a layout property) and the rule is motion-safe under
 * the global reduced-motion override.
 */
export function ProgressIndicator({ step, total, labels }: ProgressIndicatorProps) {
  const label = labels[step];
  return (
    <div aria-live="polite">
      <div className="flex items-baseline justify-between gap-4">
        <p className="text-label text-brass">
          {label ? `Step ${step + 1} — ${label}` : `Step ${step + 1}`}
        </p>
        <p className="text-label text-ink/45">
          {step + 1} / {total}
        </p>
      </div>
      <div className="mt-3 h-px w-full bg-ink/15">
        <div
          className="h-px origin-left bg-brass transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ transform: `scaleX(${(step + 1) / total})` }}
        />
      </div>
    </div>
  );
}
