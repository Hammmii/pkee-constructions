import { cn } from "@/lib/utils";

type SkeletonProps = {
  className?: string;
};

/**
 * Branded shimmer: a faint brass-tinted sweep crosses the block on
 * `transform | opacity` only (a translated gradient veil at 8% opacity).
 * Self-contained keyframes — no global CSS edit needed. Reduced motion
 * renders the static block (previous behavior). The veil rides on
 * ::after, so any bg utility composes underneath it.
 */
const SHIMMER_CSS = `
.pkee-skeleton{position:relative;overflow:hidden}
.pkee-skeleton::after{content:"";position:absolute;inset:0;pointer-events:none;
background:linear-gradient(105deg,transparent 40%,rgba(176,141,87,.08) 50%,transparent 60%);
transform:translateX(-100%);animation:pkee-shimmer 2.4s cubic-bezier(.65,0,.35,1) infinite}
@keyframes pkee-shimmer{to{transform:translateX(100%)}}
@media (prefers-reduced-motion:reduce){.pkee-skeleton::after{animation:none;display:none}}
`;

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn("pkee-skeleton bg-ink/5", className)}>
      <style>{SHIMMER_CSS}</style>
    </div>
  );
}

/** Catalog card placeholder: 4:5 media block + two text rules. */
export function CatalogCardSkeleton({ className }: SkeletonProps) {
  return (
    <div aria-hidden="true" className={cn("pkee-skeleton", className)}>
      <style>{SHIMMER_CSS}</style>
      <div className="aspect-[4/5] w-full bg-ink/5" />
      <div className="mt-5 h-3 w-2/3 bg-ink/5" />
      <div className="mt-2.5 h-3 w-1/3 bg-ink/5" />
    </div>
  );
}
