import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Static band for the Phase 3 room visualizer. Deliberately type-led and
 * motion-free in Phase 1; the CTA routes to the quote flow ("Start with a
 * consultation") because /visualizer does not exist yet.
 */
export function VisualizerPromo() {
  return (
    <section className="bg-ink py-24 md:py-32">
      <Container>
        <div className="flex flex-col items-start gap-10 md:flex-row md:items-end md:justify-between">
          <Reveal
            as="h2"
            className="max-w-3xl text-4xl leading-[0.95] font-medium tracking-tight text-[color:var(--bone-on-ink)] md:text-6xl"
          >
            <span>Upload your room.</span>
            <span>
              Explore the <em className="font-accent italic">possibilities</em>.
            </span>
          </Reveal>
          <div className="max-w-sm">
            <p className="text-sm leading-[1.6] text-[color:var(--bone-dim)]">
              Our digital room visualizer arrives in Phase 3 — see your walls in any panel, stone,
              or finish before you commit. Until then, start with a consultation and we&rsquo;ll
              mock up your space the old-fashioned way: carefully.
            </p>
            <Button href="/quote" dark className="mt-8">
              Start with a consultation
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
