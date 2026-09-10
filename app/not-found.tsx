import { Button } from "@/components/ui/Button";

/**
 * Designed 404 — brass numeral, serif-italic line, recovery CTAs.
 * Synchronous server component (no data fetching) so it renders in any
 * segment and stays unit-testable with renderToString.
 */
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[80svh] w-full max-w-[90rem] flex-col justify-center px-6 py-24 md:px-10">
      <p aria-hidden className="text-[clamp(5rem,18vw,12rem)] font-medium leading-[0.9] text-brass">
        404
      </p>
      <h1 className="mt-6 max-w-[22ch] font-accent text-3xl leading-[1.15] text-foreground md:text-5xl">
        This page went missing from the blueprint.
      </h1>
      <p className="mt-6 max-w-md leading-relaxed text-foreground/70">
        The material you were after is still in the showroom. Head back home or browse the full
        product library.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Button href="/">Back to home</Button>
        <Button href="/products" variant="ghost">
          Browse materials
        </Button>
      </div>
    </section>
  );
}
