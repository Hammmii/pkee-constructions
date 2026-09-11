"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Route-segment error boundary (Next 16: `{ error, retry }`). On-brand
 * fallback with a retry action and a way home; the error itself goes to the
 * console (Sentry wiring lands in M11).
 */
export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: error telemetry placeholder until M11 monitoring
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex min-h-[80svh] w-full max-w-[90rem] flex-col justify-center px-6 py-24 md:px-10">
      <p className="text-label text-brass">Something went wrong</p>
      <h1 className="mt-6 max-w-[20ch] font-accent text-4xl leading-[1.1] text-foreground md:text-6xl">
        This wall didn&rsquo;t line up.
      </h1>
      <p className="mt-6 max-w-md leading-relaxed text-foreground/70">
        An unexpected error stopped this page from rendering. Trying again usually settles it —
        otherwise, the showroom doors are still open.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        {/* Button primitives live outside this error boundary's assumptions —
            plain styled actions keep the fallback self-sufficient. */}
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-14 select-none items-center justify-center rounded-[2px] bg-ink px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone transition-colors duration-500 hover:text-brass"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-14 select-none items-center justify-center rounded-[2px] border border-stone px-8 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-ink transition-colors duration-500 hover:border-brass hover:text-brass"
        >
          Back to home
        </Link>
      </div>
    </section>
  );
}
