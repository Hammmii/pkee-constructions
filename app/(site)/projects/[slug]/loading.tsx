import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="flex-1">
      <Container className="py-16 md:py-24">
        <div className="border-b border-line pb-10">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-6 h-10 w-2/3" />
        </div>
        <Skeleton className="mt-12 aspect-[16/9] w-full" />
        <div className="mt-14 grid grid-cols-1 gap-px bg-line sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list
            <Skeleton key={i} className="h-24 w-full bg-background" />
          ))}
        </div>
        <div className="mt-16 space-y-4">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-5/6" />
        </div>
      </Container>
    </div>
  );
}
