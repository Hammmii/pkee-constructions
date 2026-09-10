import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "./Reveal";

export type Principal = {
  name: string;
  role: string;
  bio: string;
};

type PrincipalsGridProps = {
  principals: Principal[];
};

/** Leadership grid — hairline cards, brass rule idiom, no lift/shadow. */
export function PrincipalsGrid({ principals }: PrincipalsGridProps) {
  if (principals.length === 0) return null;

  return (
    <section className="border-t rule bg-background">
      <Container className="py-16 md:py-24">
        <SectionHeading index="02" label="The People">
          The principals behind <em className="font-accent italic">the panels</em>
        </SectionHeading>
        <div className="mt-14 grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {principals.map((principal, i) => (
            <Reveal key={principal.name} delay={i * 0.08}>
              <article className="border-t rule pt-6">
                <h3 className="font-serif text-2xl italic text-ink">{principal.name}</h3>
                <p className="text-label mt-2 text-brass">{principal.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-foreground/60">{principal.bio}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
