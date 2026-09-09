import { Button } from "@/components/ui/Button";

/** Catalog empty state: reset filters, or fall through to the quote flow. */
export function CatalogEmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="flex flex-col items-start gap-6 border border-stone px-8 py-16">
      <p className="text-label text-brass">No results</p>
      <h2 className="m-0 text-3xl font-medium tracking-tight text-ink">
        No materials match those filters.
      </h2>
      <p className="max-w-md text-ink/60">
        Try widening a filter or two — or tell us what you&apos;re looking for and we&apos;ll
        source it.
      </p>
      <div className="flex flex-wrap gap-4">
        {hasFilters && (
          <Button href="/products" variant="ghost">
            Clear all filters
          </Button>
        )}
        <Button href="/quote">Can&apos;t find it? Request it</Button>
      </div>
    </div>
  );
}
