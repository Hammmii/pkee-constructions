import Link from "next/link";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Current query string (without page), preserved across navigation. */
  query: string;
  className?: string;
};

function href(query: string, page: number): string {
  const params = new URLSearchParams(query);
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

/** Hairline pagination preserving all active filters. */
export function Pagination({ page, totalPages, query, className }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const windowed =
    totalPages <= 7
      ? pages
      : pages.filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1);

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {page > 1 && (
        <Link
          href={href(query, page - 1)}
          className="flex h-11 items-center border border-stone px-4 text-xs uppercase tracking-[0.12em] text-ink/70 transition-colors duration-300 hover:border-brass hover:text-brass"
        >
          ← Prev
        </Link>
      )}
      {windowed.map((p, i) => {
        const gap = i > 0 && p - (windowed[i - 1] ?? 0) > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {gap && (
              <span aria-hidden className="text-ink/30">
                …
              </span>
            )}
            <Link
              href={href(query, p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex h-11 w-11 items-center justify-center border text-xs transition-colors duration-300",
                p === page
                  ? "border-brass text-brass"
                  : "border-stone text-ink/70 hover:border-brass hover:text-brass",
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages && (
        <Link
          href={href(query, page + 1)}
          className="flex h-11 items-center border border-stone px-4 text-xs uppercase tracking-[0.12em] text-ink/70 transition-colors duration-300 hover:border-brass hover:text-brass"
        >
          Next →
        </Link>
      )}
    </nav>
  );
}
