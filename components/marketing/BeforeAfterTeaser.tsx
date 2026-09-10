import Image from "next/image";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { ProjectItem } from "./home-types";

type BeforeAfterTeaserProps = {
  project: ProjectItem;
};

/**
 * "Raw wall → finished feature wall": one seeded project with both
 * beforeImage and afterImage, rendered through the shared drag/keyboard
 * BeforeAfterSlider (which is already reduced-motion safe by design).
 */
export function BeforeAfterTeaser({ project }: BeforeAfterTeaserProps) {
  if (!project.beforeImage?.url || !project.afterImage?.url) return null;

  return (
    <section className="bg-stone/40 py-20 md:py-28">
      <Container>
        <div className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
          <SectionHeading index="08" label="Before & After">
            Drag the <em className="font-accent italic">transformation</em>
          </SectionHeading>
          <p className="max-w-xs text-sm leading-[1.6] text-ink/60">
            {project.title}
            {project.location ? ` — ${project.location}` : ""}. Real install, three days on site.
          </p>
        </div>
        <BeforeAfterSlider
          label={`${project.title} — before and after comparison`}
          className="aspect-[16/10] md:aspect-[21/9]"
          before={
            <Image
              src={project.beforeImage.url}
              alt={`${project.title} — before`}
              fill
              sizes="(min-width: 768px) 84rem, 100vw"
              className="object-cover"
            />
          }
          after={
            <Image
              src={project.afterImage.url}
              alt={`${project.title} — after`}
              fill
              sizes="(min-width: 768px) 84rem, 100vw"
              className="object-cover"
            />
          }
        />
        <div className="mt-6 flex justify-end">
          <Link
            href={project.href}
            className="text-label text-ink/60 transition-colors duration-300 hover:text-brass"
          >
            See the full project →
          </Link>
        </div>
      </Container>
    </section>
  );
}
