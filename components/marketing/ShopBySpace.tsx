import Image from "next/image";
import Link from "next/link";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { SpaceTile } from "./home-types";

type ShopBySpaceProps = {
  spaces: SpaceTile[];
};

/**
 * Room tiles → /solutions/[slug]. Each tile enters with the signature
 * clip-path ImageReveal; the tile link itself is a plain anchor (progressive
 * enhancement only, fully keyboard-accessible).
 */
export function ShopBySpace({ spaces }: ShopBySpaceProps) {
  if (spaces.length === 0) return null;

  return (
    <section className="bg-bone py-20 md:py-28">
      <Container className="mb-12 md:mb-16">
        <SectionHeading index="03" label="Shop by Space">
          Where will your <em className="font-accent italic">statement</em> live?
        </SectionHeading>
      </Container>
      <Container>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {spaces.map((space) => (
            <Link key={space.slug} href={`/solutions/${space.slug}`} className="group block">
              <ImageReveal className="aspect-[4/5]">
                {space.image?.url ? (
                  <Image
                    src={space.image.url}
                    alt={space.image.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-[1.1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-stone/50" aria-hidden="true" />
                )}
                <span className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ink/70 to-transparent" />
                <span className="absolute bottom-4 left-4 text-label text-[color:var(--bone-on-ink)]">
                  {space.name}
                </span>
              </ImageReveal>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
