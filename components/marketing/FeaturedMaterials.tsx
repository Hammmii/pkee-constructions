import Image from "next/image";
import Link from "next/link";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Reveal } from "@/components/motion/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Grid } from "@/components/ui/Grid";
import type { FeaturedProduct } from "./home-types";

type FeaturedMaterialsProps = {
  products: FeaturedProduct[];
};

/**
 * Editorial product cards (featured=true) on a stone-tinted band between
 * bone sections. 4:5 media, slow hover zoom, brass rule under the title —
 * pure CSS motion so the section stays a server component.
 */
export function FeaturedMaterials({ products }: FeaturedMaterialsProps) {
  if (products.length === 0) return null;

  const spans =
    products.length === 4
      ? "col-span-6 md:col-span-3"
      : products.length === 3
        ? "col-span-12 md:col-span-4"
        : "col-span-12 md:col-span-6";

  return (
    <section className="bg-stone/40 py-20 md:py-28">
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
        <Grid>
          {products.map((product, i) => (
            <article key={product.slug} className={spans}>
              <Link href={product.href} className="group block">
                <ImageReveal className="aspect-[4/5]">
                  {product.image?.url ? (
                    <Image
                      src={product.image.url}
                      alt={product.image.alt}
                      fill
                      sizes="(min-width: 768px) 25vw, 50vw"
                      className="object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-stone/60" aria-hidden="true" />
                  )}
                </ImageReveal>
                <div className="mt-5">
                  <Reveal
                    as="h3"
                    className="text-xl font-medium tracking-tight text-ink md:text-2xl"
                  >
                    <span>
                      <span
                        aria-hidden="true"
                        className="mr-3 font-serif text-sm italic text-brass"
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {product.name}
                    </span>
                  </Reveal>
                  <span
                    aria-hidden="true"
                    className="mt-3 block h-px w-12 bg-brass transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
                  />
                  {product.summary ? (
                    <p className="mt-4 line-clamp-2 max-w-md text-sm leading-[1.6] text-ink/60">
                      {product.summary}
                    </p>
                  ) : null}
                  <span className="text-label mt-4 inline-block text-ink/70 transition-colors duration-300 group-hover:text-brass">
                    View material →
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </Grid>
      </Container>
    </section>
  );
}
