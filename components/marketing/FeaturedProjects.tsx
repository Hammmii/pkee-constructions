"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { useMounted, usePrefersReducedMotion } from "../motion/use-prefers-reduced-motion";
import type { ProjectItem } from "./home-types";

/**
 * Editorial featured-projects list. Desktop (pointer: fine) rows spawn a
 * cursor-follow preview image that crossfades between projects; mobile and
 * reduced-motion users get tap-through cards only. Every row is a real
 * link — the preview is pointer-decoration, never required to navigate.
 */
export function FeaturedProjects({ projects }: { projects: ProjectItem[] }) {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const [finePointer, setFinePointer] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    setFinePointer(mq.matches);
    const onChange = (event: MediaQueryListEvent) => setFinePointer(event.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });
  const preview = mounted && !reduced && finePointer;
  const activeProject = active !== null ? projects[active] : undefined;

  if (projects.length === 0) return null;

  return (
    <section
      className="relative bg-bone py-20 md:py-28"
      onPointerMove={
        preview
          ? (event) => {
              x.set(event.clientX);
              y.set(event.clientY);
            }
          : undefined
      }
    >
      <Container className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <SectionHeading index="07" label="Projects">
          Installed in <em className="font-accent italic">Winnipeg</em>
        </SectionHeading>
        <Link
          href="/projects"
          className="text-label text-ink/60 transition-colors duration-300 hover:text-brass"
        >
          All projects →
        </Link>
      </Container>

      <Container>
        <ul className="border-t">
          {projects.map((project, i) => (
            <li key={project.slug} className="rule border-b">
              <Link
                href={project.href}
                onPointerEnter={preview ? () => setActive(i) : undefined}
                onPointerLeave={preview ? () => setActive(null) : undefined}
                className="group grid grid-cols-12 items-baseline gap-x-4 gap-y-3 py-7 md:py-9"
              >
                <span
                  aria-hidden="true"
                  className="col-span-2 font-serif text-sm italic text-brass md:col-span-1"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="col-span-10 text-2xl font-medium tracking-tight text-ink transition-colors duration-300 group-hover:text-brass md:col-span-6 md:text-4xl">
                  {project.title}
                </span>
                <span className="col-span-10 col-start-3 text-label text-ink/55 md:col-span-3 md:col-start-8">
                  {project.location ?? "Winnipeg, MB"}
                  {project.type ? ` — ${project.type}` : ""}
                </span>
                <span
                  aria-hidden="true"
                  className="col-span-12 text-right text-lg text-ink/40 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 group-hover:text-brass md:col-span-2 md:col-start-11"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>

      {/* cursor-follow preview (desktop, motion-safe only) */}
      {preview ? (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none fixed top-0 left-0 z-30 hidden aspect-[4/5] w-72 md:block"
          style={{ x: springX, y: springY, translateX: "-50%", translateY: "-55%" }}
          animate={{ opacity: activeProject ? 1 : 0, scale: activeProject ? 1 : 0.92 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence mode="popLayout">
            {activeProject?.image?.url ? (
              <motion.div
                key={activeProject.slug}
                className="absolute inset-0 overflow-hidden"
                initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
                animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <Image
                  src={activeProject.image.url}
                  alt=""
                  fill
                  sizes="18rem"
                  className="object-cover"
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </section>
  );
}
