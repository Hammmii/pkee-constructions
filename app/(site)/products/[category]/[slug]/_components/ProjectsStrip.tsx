import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import type { Media, Project } from "@/payload-types";

function cover(project: Project): { src: string; alt: string } | null {
  const candidates = [project.afterImage, project.gallery?.[0], project.beforeImage];
  for (const value of candidates) {
    if (typeof value === "object" && value !== null && value.url) {
      const media = value as Media;
      return { src: media.sizes?.card?.url ?? media.url ?? "", alt: media.alt || project.title };
    }
  }
  return null;
}

/** Cross-sell strip: projects installed with this product. */
export function ProjectsStrip({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return null;

  return (
    <section className="border-t rule">
      <Container className="py-16 md:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-label text-brass">In the field</p>
            <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
              Projects using <em className="font-serif italic">this material.</em>
            </h2>
          </div>
        </div>
        <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project) => {
            const image = cover(project);
            return (
              <li key={project.id}>
                <Link href={`/projects/${project.slug}`} className="group block">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone/40">
                    {image && (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover transition-transform duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-medium tracking-tight text-ink">
                    <span className="relative">
                      {project.title}
                      <span
                        aria-hidden
                        className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-brass transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
                      />
                    </span>
                  </h3>
                  <p className="mt-1 text-sm text-ink/50">
                    {[project.location, project.type].filter(Boolean).join(" · ")}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}
