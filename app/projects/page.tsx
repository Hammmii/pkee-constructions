import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Chip } from "@/components/ui/Chip";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { getPayloadCached } from "@/lib/payload";
import { JsonLd } from "@/lib/seo/JsonLd";
import { buildMetadata } from "@/lib/seo/metadata";
import { PROJECT_TYPES, ROOM_OPTIONS } from "./filterOptions";

export const metadata = buildMetadata({
  title: "Projects",
  description:
    "Completed residential and commercial projects by PKEE Constructions — decorative building materials, fabrication, and installation across Winnipeg.",
  path: "/projects",
});

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Rebuild the query string for filter links (toggling a param off drops it). */
function filterQuery(type: string | undefined, room: string | undefined): string {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  if (room) params.set("room", room);
  return params.toString();
}

export default async function ProjectsPage({ searchParams }: PageProps<"/projects">) {
  const sp = await searchParams;
  const type = single(sp.type);
  const room = single(sp.room);
  const typeFilter = PROJECT_TYPES.some((t) => t.value === type) ? type : undefined;
  const roomFilter = ROOM_OPTIONS.some((r) => r.value === room) ? room : undefined;

  const payload = await getPayloadCached();
  const { docs: projects } = await payload.find({
    collection: "projects",
    where: {
      _status: { equals: "published" },
      ...(typeFilter ? { type: { equals: typeFilter } } : {}),
      ...(roomFilter ? { room: { contains: roomFilter } } : {}),
    },
    depth: 1,
    limit: 24,
    sort: "-completionDate",
  });

  const count = projects.length;

  return (
    <main className="flex-1">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: projects.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: p.title,
              url: `/projects/${p.slug}`,
            })),
          },
        ]}
      />
      <Container className="py-16 md:py-24">
        <div className="rule flex flex-wrap items-end justify-between gap-6 border-b pb-8">
          <SectionHeading index="03" label="Portfolio" as="h1">
            Our <em className="font-serif italic">projects</em>
          </SectionHeading>
          <p className="text-label text-ink/45" aria-live="polite">
            {count} {count === 1 ? "project" : "projects"}
          </p>
        </div>

        <nav className="mt-10 flex flex-wrap items-center gap-2" aria-label="Filter projects">
          <Link
            href={`/projects${filterQuery(undefined, roomFilter)}`}
            aria-current={typeFilter === undefined ? "true" : undefined}
          >
            <Chip active={typeFilter === undefined}>All</Chip>
          </Link>
          {PROJECT_TYPES.map((t) => {
            const active = typeFilter === t.value;
            return (
              <Link
                key={t.value}
                href={`/projects${filterQuery(active ? undefined : t.value, roomFilter)}`}
                aria-current={active ? "true" : undefined}
              >
                <Chip active={active}>{t.label}</Chip>
              </Link>
            );
          })}
          <span aria-hidden className="mx-2 hidden h-5 w-px bg-line sm:block" />
          {ROOM_OPTIONS.map((r) => {
            const active = roomFilter === r.value;
            return (
              <Link
                key={r.value}
                href={`/projects${filterQuery(typeFilter, active ? undefined : r.value)}`}
                aria-current={active ? "true" : undefined}
              >
                <Chip active={active}>{r.label}</Chip>
              </Link>
            );
          })}
        </nav>

        {count === 0 ? (
          <div className="mt-20 border border-line bg-ink/[0.03] px-8 py-16 text-center">
            <Reveal as="h2" className="font-serif text-3xl text-ink">
              No projects match <em className="font-serif italic">those filters</em> yet
            </Reveal>
            <p className="mt-4 text-ink/60">
              Try a different combination — or{" "}
              <Link href="/quote" className="text-brass underline underline-offset-4">
                start your own project
              </Link>
              .
            </p>
          </div>
        ) : (
          <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((p, i) => (
              <li key={p.id}>
                <ProjectCard project={p} priority={i < 3} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  );
}
