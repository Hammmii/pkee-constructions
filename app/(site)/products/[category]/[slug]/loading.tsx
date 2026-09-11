import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming fallback for /products/[category]/[slug]. */
export default function ProductLoading() {
  return (
    <div className="flex-1">
      <Container className="py-28 md:py-32">
        <div className="h-3 w-64 bg-ink/5" />
        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-4">
            <div className="h-3 w-24 bg-ink/5" />
            <div className="h-12 w-3/4 bg-ink/5" />
            <div className="h-4 w-full bg-ink/5" />
            <div className="h-4 w-2/3 bg-ink/5" />
            <div className="mt-8 space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <div key={i} className="h-10 w-full bg-ink/5" />
              ))}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
