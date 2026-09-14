import type { TestimonialItem } from "@/components/marketing/home-types";
import { Container } from "@/components/ui/Container";

function Stars({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="text-sm tracking-[0.3em] text-brass"
    >
      {"★".repeat(rating)}
      <span className="text-[color:var(--line)]">{"★".repeat(Math.max(0, 5 - rating))}</span>
    </span>
  );
}

/**
 * Static social-proof strip for product pages (server component, no JS).
 * Same visual language as the home TestimonialsSection; renders nothing
 * when the CMS has no published testimonials.
 */
export function TestimonialsStrip({ testimonials }: { testimonials: TestimonialItem[] }) {
  if (testimonials.length === 0) return null;

  return (
    <section className="border-t rule bg-bone">
      <Container className="py-16 md:py-20">
        <p className="text-label text-brass">What customers say</p>
        <h2 className="mt-3 text-3xl font-medium tracking-tight text-ink md:text-4xl">
          In their <em className="font-serif italic">words.</em>
        </h2>
        <ul className="mt-12 grid grid-cols-1 gap-x-8 gap-y-12 md:grid-cols-3">
          {testimonials.map((t) => (
            <li key={`${t.name}-${t.text.slice(0, 24)}`}>
              <blockquote>
                <Stars rating={t.rating} />
                <p className="mt-5 leading-relaxed text-ink/75">&ldquo;{t.text}&rdquo;</p>
                <footer className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <cite className="text-label not-italic text-ink">{t.name}</cite>
                  {t.location ? <span className="text-label text-ink/55">{t.location}</span> : null}
                  {t.verified ? (
                    <span className="text-label text-brass">✓ Verified project</span>
                  ) : null}
                </footer>
              </blockquote>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
