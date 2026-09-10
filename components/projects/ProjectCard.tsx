import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Media, Project } from "@/payload-types";

export type ProjectCardProject = Pick<Project, "title" | "slug" | "location" | "type" | "room"> & {
  heroImage?: (number | null) | Media;
};

type ProjectCardProps = {
  project: ProjectCardProject;
  priority?: boolean;
  className?: string;
};

const ROOM_LABELS: Record<NonNullable<ProjectCardProject["room"]>[number], string> = {
  "living-room": "Living room",
  kitchen: "Kitchen",
  bathroom: "Bathroom",
  bedroom: "Bedroom",
  office: "Office",
  restaurant: "Restaurant",
  retail: "Retail",
  hotel: "Hotel",
  outdoor: "Outdoor",
  "feature-wall": "Feature wall",
  fireplace: "Fireplace",
  "prayer-room": "Prayer room",
  basement: "Basement",
};

/**
 * Projects grid card — mirrors the catalog card recipe (4:5 image, slow
 * hover zoom, brass rule under the title) but is a plain article: project
 * detail pages don't exist yet, so the card links nowhere.
 */
export function ProjectCard({ project, priority, className }: ProjectCardProps) {
  const image = typeof project.heroImage === "object" && project.heroImage !== null ? project.heroImage : null;
  const src = image?.sizes?.card?.url ?? image?.url;
  const alt = image?.alt || `${project.title} — PKEE Constructions project`;

  const meta = [
    project.location,
    project.type === "residential" ? "Residential" : project.type === "commercial" ? "Commercial" : null,
    ...(project.room ?? []).map((r) => ROOM_LABELS[r]).slice(0, 2),
  ].filter(Boolean) as string[];

  return (
    <article className={cn("group", className)}>
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone/40">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <span className="text-label text-ink/40">{project.title}</span>
          </div>
        )}
      </div>
      <div className="mt-5">
        {meta.length > 0 && <p className="text-label text-ink/45">{meta.join(" · ")}</p>}
        <h3 className="mt-1.5 text-lg font-medium tracking-tight text-ink">
          <span className="relative">
            {project.title}
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brass transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
            />
          </span>
        </h3>
      </div>
    </article>
  );
}
