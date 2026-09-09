import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

/** Bare shimmer block (opacity-only animation). */
export function Skeleton({ className }: SkeletonProps) {
  return <div aria-hidden="true" className={cn("animate-pulse bg-ink/5", className)} />;
}

/** Catalog card placeholder: 4:5 media block + two text rules. */
export function CatalogCardSkeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn("animate-pulse", className)}>
      <div className="aspect-[4/5] w-full bg-ink/5" />
      <div className="mt-5 h-3 w-2/3 bg-ink/5" />
      <div className="mt-2.5 h-3 w-1/3 bg-ink/5" />
    </div>
  );
}
