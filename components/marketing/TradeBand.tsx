import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

/**
 * For Trade band — static pitch aimed at dealers, contractors, and
 * designers, wired to the trade application route.
 */
export function TradeBand() {
  return (
    <section className="bg-ink py-20 md:py-24">
      <Container>
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <Reveal
            as="h2"
            className="max-w-2xl text-3xl leading-[0.95] font-medium tracking-tight text-[color:var(--bone-on-ink)] md:text-5xl"
          >
            <span>
              For trade: <em className="font-accent italic">designers, contractors, dealers</em>
            </span>
          </Reveal>
          <div className="max-w-sm">
            <p className="text-sm leading-[1.6] text-[color:var(--bone-dim)]">
              Trade pricing, priority stock, samples on request, and territory support. Applications
              reviewed within 2–3 business days.
            </p>
            <Button href="/trade" variant="ghost" dark className="mt-8">
              Apply for trade pricing
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
