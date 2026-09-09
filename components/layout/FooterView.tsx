import Link from "next/link";
import { exploreLinks, site } from "@/lib/site";
import { StaggerColumn } from "./FooterStagger";

export type FooterCategory = {
  name: string;
  slug: string;
};

type FooterViewProps = {
  categories: FooterCategory[];
  year: number;
};

/**
 * Big-type footer on charcoal: giant display heading with the signature
 * serif-italic accent, then a hairline-divided grid of contact details,
 * explore links, top product categories, and the trade path. Presentational
 * — the async `Footer` wrapper supplies CMS data and the year, which keeps
 * this component renderable in unit tests.
 */
export function FooterView({ categories, year }: FooterViewProps) {
  return (
    <footer className="bg-charcoal text-bone">
      <div className="mx-auto w-full max-w-[90rem] px-6 pb-10 pt-20 md:px-10 md:pt-28">
        {/* Big type — the closing editorial gesture. */}
        <h2 className="max-w-[12ch] text-[clamp(2.75rem,9vw,8.5rem)] font-medium uppercase leading-[0.95] tracking-[-0.02em] text-[color:var(--bone-on-ink)]">
          Let&rsquo;s build{" "}
          <em className="font-accent font-normal normal-case text-brass">your</em> space
        </h2>

        <div className="mt-16 grid grid-cols-12 gap-x-6 gap-y-12 border-t rule-on-dark pt-12 md:mt-24 md:pt-16">
          {/* Contact */}
          <StaggerColumn index={0} className="col-span-12 md:col-span-5">
            <p className="text-label text-brass">Showroom</p>
            <p className="mt-4 leading-relaxed text-[color:var(--bone-on-ink)]">
              {site.address.street}
              <br />
              {site.address.city}, {site.address.province}
            </p>
            <p className="mt-4 text-[color:var(--bone-dim)]">
              {site.hours.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            <p className="mt-4">
              <a
                href={site.phone.href}
                className="block text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
              >
                {site.phone.display}
              </a>
              <a
                href={`mailto:${site.email}`}
                className="block text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
              >
                {site.email}
              </a>
            </p>
          </StaggerColumn>

          {/* Explore */}
          <StaggerColumn index={1} className="col-span-6 md:col-span-2">
            <p className="text-label text-brass">Explore</p>
            <ul className="mt-4 space-y-2.5">
              {exploreLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerColumn>

          {/* Products — top categories from the CMS. */}
          <StaggerColumn index={2} className="col-span-6 md:col-span-3">
            <p className="text-label text-brass">Products</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/products"
                  className="text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
                >
                  All Products
                </Link>
              </li>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/products/${category.slug}`}
                    className="text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerColumn>

          {/* For Trade */}
          <StaggerColumn index={3} className="col-span-12 md:col-span-2">
            <p className="text-label text-brass">For Trade</p>
            <ul className="mt-4 space-y-2.5">
              <li>
                <Link
                  href="/trade"
                  className="text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
                >
                  Become a Dealer
                </Link>
              </li>
              <li>
                <Link
                  href="/trade"
                  className="text-[color:var(--bone-on-ink)] transition-colors duration-300 hover:text-brass"
                >
                  Download Catalog
                </Link>
              </li>
            </ul>
          </StaggerColumn>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col gap-2 border-t rule-on-dark pt-6 text-sm text-[color:var(--bone-dim)] md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.legalName}
          </p>
          <p>
            {site.address.street}, {site.address.city}, {site.address.province}
          </p>
        </div>
      </div>
    </footer>
  );
}
