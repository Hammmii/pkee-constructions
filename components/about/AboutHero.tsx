import Image from "next/image";
import { Container } from "@/components/ui/Container";

type AboutHeroProps = {
  heading: string;
  subheading?: string | null;
  image?: { url: string; alt: string } | null;
};

/** Story hero — first section on /about clears the solid header. */
export function AboutHero({ heading, subheading, image }: AboutHeroProps) {
  return (
    <section className="bg-background pt-[var(--header-h)]">
      <Container className="py-16 md:py-24">
        <p className="text-label text-brass">About PKEE Constructions</p>
        <h1 className="mt-6 max-w-4xl text-balance text-4xl leading-[0.95] font-medium tracking-tight text-ink md:text-6xl lg:text-7xl">
          {heading}
        </h1>
        {subheading ? (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground/60">{subheading}</p>
        ) : null}
      </Container>
      {image?.url ? (
        <div className="relative mx-auto aspect-[16/9] w-full max-w-[90rem] overflow-hidden md:aspect-[21/9]">
          <Image
            src={image.url}
            alt={image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
      ) : null}
    </section>
  );
}
