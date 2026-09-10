import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "./Reveal";

export type ValueItem = { title: string; body: string };

type ValuesGridProps = {
  values: ValueItem[];
};

/** What we optimize for — three-column editorial grid on an ink band. */
export function ValuesGrid({ values }: ValuesGridProps) {
  if (values.length === 0) return null;

  return (
    <section className="bg-ink">
      <Container className="py-16 md:py-24">
        <SectionHeading index="04" label="What We Optimize For" dark>
          Values, kept <em className="font-accent italic">short</em>
        </SectionHeading>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {values.map((value, i) => (
            <Reveal key={value.title} delay={i * 0.08}>
              <article className="border-t border-bone/15 pt-6">
                <h3 className="text-xl font-medium tracking-tight text-bone/90">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-bone/60">{value.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
