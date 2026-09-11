import Image from "next/image";
import Link from "next/link";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

type BeforeAfterMedia = { url?: string | null; alt?: string | null } | null | undefined;

type ProjectBeforeAfterProps = {
  project: {
    title: string;
    slug: string;
    location?: string | null;
    beforeImage?: BeforeAfterMedia;
    afterImage?: BeforeAfterMedia;
  };
};

/**
 * "Raw wall → finished feature wall" section for interior pages
 * (/custom-studio, /solutions/[slug]). Renders nothing when the project
 * has no before/after pair (graceful skip). The slider itself is
 * user-driven drag/keyboard only, so reduced-motion users get the
 * identical interaction and no-JS users see the fully-revealed
 * "after" layer.
 */
export function ProjectBeforeAfter({ project }: ProjectBeforeAfterProps) {
  const before = project.beforeImage?.url;
  const after = project.afterImage?.url;
  if (!before || !after) return null;

  return (
    <section className="border-t rule">
      <Container className="py-16 md:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6 md:mb-14">
          <SectionHeading label="Before & After">
            Drag the <em className="font-accent italic">transformation</em>
          </SectionHeading>
          <p className="max-w-xs text-sm leading-[1.6] text-ink/60">
            {project.title}
            {project.location ? ` — ${project.location}` : ""}. Supplied, fabricated, and installed
            by one team.
          </p>
        </div>
        <BeforeAfterSlider
          label={`${project.title} — before and after comparison`}
          className="aspect-[16/10] md:aspect-[21/9]"
          before={
            <Image
              src={before}
              alt={`${project.title} — before`}
              fill
              sizes="(min-width: 768px) 80rem, 100vw"
              className="object-cover"
            />
          }
          after={
            <Image
              src={after}
              alt={`${project.title} — after`}
              fill
              sizes="(min-width: 768px) 80rem, 100vw"
              className="object-cover"
            />
          }
        />
        <div className="mt-6 flex justify-end">
          <Link
            href={`/projects/${project.slug}`}
            className="text-label text-ink/60 transition-colors duration-300 hover:text-brass"
          >
            See the full project →
          </Link>
        </div>
      </Container>
    </section>
  );
}
