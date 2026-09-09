/**
 * Central site constants — the single source of truth for brand facts,
 * navigation structure, and contact details.
 *
 * Placeholder contract: entries marked TODO-CLIENT are stand-ins until the
 * client confirms real contact details (see "Known Risks" in the execution
 * plan). Never replace them with invented "real-looking" values — only with
 * confirmed client data.
 */

export const site = {
  name: "PKEE Constructions",
  legalName: "PKEE Constructions",
  tagline: "Premium decorative building materials",
  address: {
    street: "360 Keewatin St",
    city: "Winnipeg",
    province: "MB",
    country: "Canada",
  },
  /** TODO-CLIENT: placeholder phone — replace with the confirmed number before launch. */
  phone: {
    display: "(204) 555-0136",
    href: "tel:+12045550136",
  },
  /** TODO-CLIENT: placeholder email — replace with the confirmed address before launch. */
  email: "hello@pkeeconstructions.ca",
  /** TODO-CLIENT: placeholder showroom hours — confirm with client before launch. */
  hours: ["Mon–Fri · 9:00 – 17:00", "Sat · By appointment"],
} as const;

export type NavLink = {
  label: string;
  href: string;
};

/** Primary navigation, in display order. Products carries the mega-menu. */
export const navLinks: readonly NavLink[] = [
  { label: "Products", href: "/products" },
  { label: "Solutions", href: "/solutions" },
  { label: "Projects", href: "/projects" },
  { label: "Custom Studio", href: "/custom-studio" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** The one persistent conversion CTA in the header. */
export const quoteCta = { label: "Request a Quote", href: "/quote" } as const;

/**
 * Routes whose first section is a full-screen hero that sits *under* the
 * transparent header. Every other route renders the header solid from the
 * start and must add `pt-[var(--header-h)]` (or an equivalent band) to its
 * first section so content clears the fixed bar.
 */
export const transparentHeaderRoutes: readonly string[] = ["/"];

/** Footer quick links — "Explore" column. */
export const exploreLinks: readonly NavLink[] = navLinks;

/** Mega-menu footer row — quick paths for buyers who know what they want. */
export const megaQuickLinks: readonly NavLink[] = [
  { label: "All Products", href: "/products" },
  { label: "For Trade", href: "/trade" },
  { label: "Download Catalog", href: "/trade" },
];
