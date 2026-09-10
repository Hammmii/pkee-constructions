import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Media, Product, ProductCategory } from "@/payload-types";

export type ProductCardProduct = Pick<Product, "name" | "slug" | "summary" | "featured"> & {
  category: number | ProductCategory;
  heroImage: number | Media;
};

type ProductCardProps = {
  product: ProductCardProduct;
  /** Category slug override (used when the relation is unpopulated). */
  categorySlug?: string;
  priority?: boolean;
  className?: string;
};

function resolveCategory(
  category: ProductCardProduct["category"],
): { slug: string; name: string } | null {
  if (typeof category === "object" && category !== null) {
    return { slug: category.slug, name: category.name };
  }
  return null;
}

/**
 * Catalog card recipe (design system §6): 4:5 image, slow hover zoom 1.05
 * over 1s, brass rule under the title, category label, "View material →"
 * on hover. Cards never lift or shadow. Server component — pure CSS hover.
 */
export function ProductCard({ product, categorySlug, priority, className }: ProductCardProps) {
  const category = resolveCategory(product.category);
  const href = `/products/${categorySlug ?? category?.slug ?? ""}/${product.slug}`;
  const image = typeof product.heroImage === "object" ? product.heroImage : null;
  const src = image?.sizes?.card?.url ?? image?.url;
  const alt = image?.alt || `${product.name} — ${category?.name ?? "decorative material"}`;

  return (
    <Link
      href={href}
      className={cn("group block", className)}
      aria-label={`${product.name} — view material`}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-stone/40">
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1s] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <span className="text-label text-ink/40">{product.name}</span>
          </div>
        )}
        <span
          className={cn(
            "absolute inset-x-0 bottom-0 flex items-center justify-between px-5 pb-4",
            "text-[0.8125rem] uppercase tracking-[0.12em] text-bone opacity-0",
            "transition-opacity duration-500 group-hover:opacity-100",
            "bg-gradient-to-t from-ink/60 to-transparent pt-10",
          )}
          aria-hidden
        >
          View material
          <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
        </span>
      </div>
      <div className="mt-5">
        {category && <p className="text-label text-ink/45">{category.name}</p>}
        <h3 className="mt-1.5 text-lg font-medium tracking-tight text-ink">
          <span className="relative">
            {product.name}
            <span
              aria-hidden
              className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-brass transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
            />
          </span>
        </h3>
      </div>
    </Link>
  );
}
