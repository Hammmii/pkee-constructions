import Image from "next/image";
import Link from "next/link";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Reveal } from "@/components/motion/Reveal";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/utils";
import type { FeaturedProduct } from "./home-types";

type FeaturedMaterialsProps = {
  products: FeaturedProduct[];
};

type CellVariant = "hero" | "tile" | "wide";

/**
 * R2.5 — asymmetric bento editorial grid for featured materials.
 *
 * One 2×2 hero cell, two 1×1 tiles, one 2×1 wide cell on a 12-col grid;
 * mobile collapses to a simplified 2-col stack. Every media box reserves its
 * space with a fixed aspect ratio (CLS 0) and hover is pure CSS
 * transform/opacity, so the section stays a server component: no-JS renders
 * the full grid, reduced-motion gets the static grid (`motion-safe:` gates
 * every transition). Cell count stays CMS-driven — missing cells collapse.
 */
export function FeaturedMaterials({ products }: FeaturedMaterialsProps) {
  const items = products.slice(0, 4);
  if (items.length === 0) return null;

  const loneHero = items.length === 1;

  return (
    <section className="bg-stone/40 py-20 md:py-28" aria-label="Featured materials">
      <Container className="mb-12 flex flex-wrap items-end justify-between gap-6 md:mb-16">
        <SectionHeading index="04" label="Featured Materials">
          This season&rsquo;s <em className="font-accent italic">edit</em>
        </SectionHeading>
        <Link
          href="/products"
          className="text-label text-ink/60 transition-colors duration-300 hover:text-brass"
        >
          Full catalog →
        </Link>
      </Container>
      <Container>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-12 md:gap-6">
          {items.map((product, i) => (
            <BentoCell
              key={product.slug}
              product={product}
              index={i}
              variant={cellVariant(i, items.length)}
              loneHero={loneHero}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

function cellVariant(index: number, count: number): CellVariant {
  if (index === 0) return "hero";
  if (index === 3 && count === 4) return "wide";
  return "tile";
}

function cellClass(variant: CellVariant, loneHero: boolean): string {
  switch (variant) {
    case "hero":
      return cn(
        "col-span-2 md:col-span-7 md:row-span-2",
        loneHero && "md:row-span-1 md:aspect-[16/9]",
      );
    case "tile":
      return "md:col-span-5";
    case "wide":
      return "col-span-2 md:col-span-12";
  }
}

function mediaClass(variant: CellVariant, loneHero: boolean): string {
  switch (variant) {
    case "hero":
      return loneHero ? "h-full" : "aspect-[4/5] md:h-full";
    case "tile":
      return "aspect-[4/5]";
    case "wide":
      return "aspect-[16/9] md:aspect-[21/9]";
  }
}

function sizes(variant: CellVariant): string {
  switch (variant) {
    case "hero":
      return "(min-width: 768px) 58vw, 100vw";
    case "tile":
      return "(min-width: 768px) 38vw, 50vw";
    case "wide":
      return "(min-width: 768px) 100vw, 100vw";
  }
}

type BentoCellProps = {
  product: FeaturedProduct;
  index: number;
  variant: CellVariant;
  loneHero: boolean;
};

function BentoCell({ product, index, variant, loneHero }: BentoCellProps) {
  const numeral = String(index + 1).padStart(2, "0");
  const headingClass =
    variant === "hero"
      ? "text-2xl md:text-4xl"
      : variant === "wide"
        ? "text-xl md:text-2xl"
        : "text-lg md:text-xl";

  return (
    <article className={cellClass(variant, loneHero)}>
      <Link
        href={product.href}
        className="group block h-full"
        aria-label={`${numeral} — ${product.name}`}
      >
        <div className="flex h-full flex-col">
          <ImageReveal
            className={cn("relative w-full overflow-hidden", mediaClass(variant, loneHero))}
          >
            {product.image?.url ? (
              <Image
                src={product.image.url}
                alt={product.image.alt}
                fill
                sizes={sizes(variant)}
                className="object-cover motion-safe:transition-transform motion-safe:duration-[1.1s] motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-stone/60" aria-hidden="true" />
            )}
            {variant !== "tile" ? (
              <span
                aria-hidden="true"
                className="absolute bottom-4 left-4 font-serif text-sm italic text-bone/90 md:bottom-6 md:left-6"
              >
                {numeral}
              </span>
            ) : null}
          </ImageReveal>

          <div className="mt-4 md:mt-5">
            <Reveal as="h3" className={cn("font-medium tracking-tight text-ink", headingClass)}>
              <span>
                {variant === "tile" ? (
                  <span aria-hidden="true" className="mr-3 font-serif text-sm italic text-brass">
                    {numeral}
                  </span>
                ) : null}
                {product.name}
              </span>
            </Reveal>
            <span
              aria-hidden="true"
              className="mt-3 block h-px w-12 bg-brass motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-[cubic-bezier(0.16,1,0.3,1)] motion-safe:group-hover:w-full"
            />
            {product.summary ? (
              <p className="mt-4 line-clamp-2 max-w-md text-sm leading-[1.6] text-ink/60 motion-safe:translate-y-1 motion-safe:opacity-80 motion-safe:transition-all motion-safe:duration-500 motion-safe:group-hover:translate-y-0 motion-safe:group-hover:opacity-100">
                {product.summary}
              </p>
            ) : null}
            <span className="text-label mt-4 inline-block text-ink/70 transition-colors duration-300 group-hover:text-brass">
              View material →
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
