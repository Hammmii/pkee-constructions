import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Magnetic } from "@/components/ui/Magnetic";

/**
 * Closing beat before the layout footer: oversized type with the serif
 * italic accent, and a magnetic solid CTA into the quote flow. Magnetic is
 * self-gating (coarse pointers and reduced motion pass children through).
 */
export function FinalCta() {
  return (
    <section className="bg-charcoal py-24 md:py-36">
      <Container className="flex flex-col items-center text-center">
        <Reveal
          as="h2"
          className="text-[clamp(2.75rem,9vw,8rem)] leading-[0.95] font-medium tracking-tight text-[color:var(--bone-on-ink)]"
        >
          <span>
            Have a <em className="font-accent italic">project</em>
          </span>
          <span>in mind?</span>
        </Reveal>
        <p className="mt-8 max-w-md text-sm leading-[1.6] text-[color:var(--bone-dim)]">
          Tell us about your space and we&rsquo;ll come back with a detailed quote within one
          business day — no pressure, no obligation.
        </p>
        <Magnetic className="mt-12">
          <Button href="/quote" variant="solid" dark>
            Start Your Project <span aria-hidden="true">→</span>
          </Button>
        </Magnetic>
        <p className="text-label mt-16 text-[color:var(--bone-dim)]">
          360 Keewatin St, Winnipeg, MB — Showroom consultations by appointment
        </p>
      </Container>
    </section>
  );
}
