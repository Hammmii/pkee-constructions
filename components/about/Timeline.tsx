import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "./Reveal";

export type TimelineEntry = {
  year: string;
  title: string;
  body: string;
};

type TimelineProps = {
  entries: TimelineEntry[];
};

/** Company timeline — numbered hairline rows with brass years. */
export function Timeline({ entries }: TimelineProps) {
  if (entries.length === 0) return null;

  return (
    <section className="border-t rule bg-bone">
      <Container className="py-16 md:py-24">
        <SectionHeading index="03" label="The Story So Far">
          From first delivery to <em className="font-accent italic">360 Keewatin</em>
        </SectionHeading>
        <ol className="mt-14">
          {entries.map((entry, i) => (
            <Reveal key={entry.year} delay={i * 0.06}>
              <li className="grid gap-x-10 gap-y-3 border-t rule py-8 sm:grid-cols-12">
                <p className="font-serif text-2xl italic text-brass sm:col-span-3">{entry.year}</p>
                <div className="sm:col-span-9">
                  <h3 className="text-xl font-medium tracking-tight text-ink">{entry.title}</h3>
                  <p className="mt-2 max-w-2xl leading-relaxed text-foreground/60">{entry.body}</p>
                </div>
              </li>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
