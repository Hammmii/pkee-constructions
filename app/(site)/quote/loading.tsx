import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming fallback for /quote: heading + wizard chrome in branded skeleton. */
export default function QuoteLoading() {
  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-4 h-10 w-full max-w-md md:h-12" />
        <div className="mt-4 space-y-2.5">
          <Skeleton className="h-4 w-full max-w-xl" />
          <Skeleton className="h-4 w-2/3 max-w-lg" />
        </div>

        <div className="mt-12" aria-hidden>
          {/* Progress indicator chrome: label row + hairline with brass fill. */}
          <div className="flex items-baseline justify-between gap-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-10" />
          </div>
          <div className="mt-3 h-px w-full bg-ink/15">
            <div
              className="h-px w-full origin-left bg-brass"
              style={{ transform: "scaleX(0.1429)" }}
            />
          </div>

          {/* Step heading */}
          <Skeleton className="mt-10 h-8 w-72" />

          {/* Field rows: floating-label + bottom-border input region */}
          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <div key={i}>
                <Skeleton className="h-3 w-20" />
                <Skeleton className="mt-2 h-4 w-full" />
                <div className="mt-2 border-b border-ink/15" />
              </div>
            ))}
          </div>

          {/* Nav buttons */}
          <div className="mt-12 flex gap-4">
            <Skeleton className="h-14 w-40" />
            <Skeleton className="h-14 w-40" />
          </div>
        </div>
      </div>
    </main>
  );
}
