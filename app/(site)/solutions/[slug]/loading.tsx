import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

/** Streaming fallback for /solutions/[slug]: hero block + card grid skeletons. */
export default function SolutionLoading() {
  return (
    <>
      <section className="bg-ink">
        <Container className="py-24 md:py-36">
          <Skeleton className="h-4 w-24 bg-bone/20" />
          <Skeleton className="mt-6 h-12 w-2/3 bg-bone/20 md:h-16" />
          <Skeleton className="mt-6 h-5 w-full max-w-2xl bg-bone/20" />
          <Skeleton className="mt-2 h-5 w-3/4 max-w-2xl bg-bone/20" />
        </Container>
      </section>
      <Container className="py-16 md:py-24">
        <Skeleton className="h-9 w-72" />
        <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 md:mt-14">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <div key={i}>
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="mt-4 h-4 w-24" />
              <Skeleton className="mt-2 h-5 w-40" />
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
