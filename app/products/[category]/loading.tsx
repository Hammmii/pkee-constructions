import { Container } from "@/components/ui/Container";
import { CatalogCardSkeleton } from "@/components/ui/Skeleton";

/** Streaming fallback for /products/[category]. */
export default function CategoryLoading() {
  return (
    <main className="flex-1">
      <section className="flex min-h-[50svh] items-end bg-ink">
        <Container className="relative z-10 pb-14 pt-40">
          <div className="h-3 w-40 bg-bone/10" />
          <div className="mt-6 h-14 w-full max-w-xl bg-bone/10" />
        </Container>
      </section>
      <Container className="py-16">
        <div className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <CatalogCardSkeleton key={i} />
          ))}
        </div>
      </Container>
    </main>
  );
}
