import { Container } from "@/components/ui/Container";
import { CatalogCardSkeleton } from "@/components/ui/Skeleton";

/** Streaming fallback for /products: filters frame + card skeletons. */
export default function ProductsLoading() {
  return (
    <div className="flex-1">
      <Container className="py-16 md:py-24">
        <div className="rule border-b pb-8">
          <div className="h-3 w-24 bg-ink/5" />
          <div className="mt-6 h-12 w-full max-w-2xl bg-ink/5" />
        </div>
        <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12">
          <aside className="hidden space-y-8 lg:col-span-3 lg:block" aria-hidden>
            {Array.from({ length: 4 }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
              <div key={i}>
                <div className="mb-3 h-3 w-20 bg-ink/5" />
                <div className="space-y-2.5">
                  {Array.from({ length: 4 }, (_, j) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                    <div key={j} className="h-4 w-full bg-ink/5" />
                  ))}
                </div>
              </div>
            ))}
          </aside>
          <div className="lg:col-span-9">
            <ul className="grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }, (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
                <li key={i}>
                  <CatalogCardSkeleton />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </div>
  );
}
