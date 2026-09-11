import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProjectsLoading() {
  return (
    <div className="flex-1">
      <Container className="py-16 md:py-24">
        <div className="border-b border-line pb-8">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-6 h-12 w-1/2" />
        </div>
        <div className="mt-10 flex flex-wrap gap-2">
          {Array.from({ length: 6 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Skeleton key={i} className="h-9 w-28" />
          ))}
        </div>
        <ul className="mt-14 grid grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <li key={i}>
              <Skeleton className="aspect-[4/5] w-full" />
              <Skeleton className="mt-5 h-3 w-24" />
              <Skeleton className="mt-2 h-6 w-3/4" />
            </li>
          ))}
        </ul>
      </Container>
    </div>
  );
}
