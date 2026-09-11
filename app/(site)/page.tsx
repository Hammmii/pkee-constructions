import type { Metadata } from "next";
import { BeforeAfterTeaser } from "@/components/marketing/BeforeAfterTeaser";
import { CollectionsExplorer } from "@/components/marketing/CollectionsExplorer";
import { CraftProcess } from "@/components/marketing/CraftProcess";
import { CustomStudioTeaser } from "@/components/marketing/CustomStudioTeaser";
import { FeaturedMaterials } from "@/components/marketing/FeaturedMaterials";
import { FeaturedProjects } from "@/components/marketing/FeaturedProjects";
import { FinalCta } from "@/components/marketing/FinalCta";
import { HomeHero } from "@/components/marketing/HomeHero";
import type {
  CapabilityCard,
  CategoryCard,
  FeaturedProduct,
  HomeMedia,
  ProjectItem,
  SpaceTile,
  StatItem,
  TestimonialItem,
} from "@/components/marketing/home-types";
import { Preloader } from "@/components/marketing/Preloader";
import { ShopBySpace } from "@/components/marketing/ShopBySpace";
import { TestimonialsSection } from "@/components/marketing/TestimonialsSection";
import { Ticker } from "@/components/marketing/Ticker";
import { TradeBand } from "@/components/marketing/TradeBand";
import { VisualizerPromo } from "@/components/marketing/VisualizerPromo";
import { WhyChooseUs } from "@/components/marketing/WhyChooseUs";
import { TypeFillSection } from "@/components/motion/TypeFillSection";
import { getPayloadCached } from "@/lib/payload";
import { absoluteUrl } from "@/lib/seo/metadata";
import { site } from "@/lib/site";
import type { Media, Page } from "@/payload-types";

export default async function Home() {
  const {
    heroImage,
    heroSubtext,
    stats,
    categories,
    tickerNames,
    spaces,
    products,
    projects,
    testimonials,
  } = await fetchHomeData();

  const beforeAfterProject = projects.find((p) => p.beforeImage?.url && p.afterImage?.url) ?? null;
  const craftPrimary = projects[0]?.image ?? null;
  const craftSecondary =
    projects[0]?.afterImage?.url && projects[0]?.afterImage?.url !== projects[0]?.image?.url
      ? projects[0]?.afterImage
      : (projects[0]?.detailImage ?? null);

  return (
    <div className="flex-1">
      <Preloader />
      <HomeHero image={heroImage} subtext={heroSubtext} />
      <TypeFillSection image={craftSecondary ?? craftPrimary} />
      {tickerNames.length > 0 ? <Ticker items={tickerNames} /> : null}
      {categories.length > 0 ? <CollectionsExplorer categories={categories} /> : null}
      <ShopBySpace spaces={spaces} />
      <FeaturedMaterials products={products} />
      <VisualizerPromo />
      <WhyChooseUs stats={stats} />
      <CraftProcess primary={craftPrimary} secondary={craftSecondary} />
      <FeaturedProjects projects={projects} />
      {beforeAfterProject ? <BeforeAfterTeaser project={beforeAfterProject} /> : null}
      <CustomStudioTeaser capabilities={studioCapabilities(categories)} />
      <TestimonialsSection testimonials={testimonials} />
      <TradeBand />
      <FinalCta />
      <LocalBusinessJsonLd />
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const home = await findHomePage();

  // Brand-level fallbacks (lib/site.ts) keep <title>/description/OG valid even
  // when the CMS `home` doc or its SEO group is missing. `absolute` opts out
  // of the root "%s — PKEE Constructions" template because both the CMS
  // metaTitle and the fallback already carry the brand name.
  const title = home?.seo?.metaTitle ?? HOME_SEO.title;
  const description = home?.seo?.metaDescription ?? site.description;
  const heroImage = (() => {
    const hero = home?.blocks?.find((b) => b.blockType === "hero");
    const img = hero && "image" in hero ? hero.image : null;
    return typeof img === "object" ? (img?.url ?? null) : null;
  })();
  const ogImage =
    (typeof home?.seo?.ogImage === "object" ? (home.seo.ogImage?.url ?? null) : null) ?? heroImage;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl("/") },
    openGraph: {
      title,
      description,
      url: absoluteUrl("/"),
      siteName: site.name,
      type: "website",
      locale: "en_CA",
      ...(ogImage ? { images: [{ url: absoluteUrl(ogImage) }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage ? { images: [absoluteUrl(ogImage)] } : {}),
    },
  };
}

/** Fallback home SEO when the CMS doc has none — mirrors the seed copy. */
const HOME_SEO = {
  title: "PKEE Constructions — Decorative Wall Panels & Custom Interiors, Winnipeg",
} as const;

// ---------------------------------------------------------------------------
// data
// ---------------------------------------------------------------------------

function toMedia(media: number | Media | null | undefined): HomeMedia {
  if (!media || typeof media === "number") return null;
  return { url: media.url ?? null, alt: media.alt ?? "" };
}

async function safe<T>(query: () => Promise<T>, fallback?: T): Promise<T | undefined> {
  try {
    return await query();
  } catch {
    return fallback;
  }
}

async function findHomePage(): Promise<Page | null> {
  const home = await safe(async () => {
    const payload = await getPayloadCached();
    const res = await payload.find({
      collection: "pages",
      where: { slug: { equals: "home" } },
      limit: 1,
      depth: 1,
      // Server-only local API call — the Pages collection locks public read
      // to staff, so the frontend must bypass access control here (same
      // pattern the collection comment documents).
      overrideAccess: true,
    });
    const doc = res.docs[0];
    return doc ?? null;
  });
  return home ?? null;
}

type HomeData = {
  heroImage: HomeMedia;
  heroSubtext: string | null;
  stats: StatItem[];
  categories: CategoryCard[];
  tickerNames: string[];
  spaces: SpaceTile[];
  products: FeaturedProduct[];
  projects: ProjectItem[];
  testimonials: TestimonialItem[];
};

async function fetchHomeData(): Promise<HomeData> {
  const home = await findHomePage();
  const heroBlock = home?.blocks?.find((block) => block.blockType === "hero");
  const statsBlock = home?.blocks?.find((block) => block.blockType === "statsBand");

  const payload = await safe(() => getPayloadCached(), null);
  if (!payload) {
    return {
      heroImage: toMedia(heroBlock && "image" in heroBlock ? heroBlock.image : null),
      heroSubtext: heroBlock && "subheading" in heroBlock ? (heroBlock.subheading ?? null) : null,
      stats: [],
      categories: [],
      tickerNames: [],
      spaces: [],
      products: [],
      projects: [],
      testimonials: [],
    };
  }

  const [categoryRes, solutionRes, productRes, projectRes, testimonialRes] = await Promise.all([
    safe(() =>
      payload.find({
        collection: "product-categories",
        where: { _status: { equals: "published" } },
        limit: 50,
        depth: 1,
        overrideAccess: false,
      }),
    ),
    safe(() =>
      payload.find({
        collection: "solutions",
        where: { _status: { equals: "published" } },
        limit: 50,
        depth: 1,
        overrideAccess: false,
      }),
    ),
    safe(() =>
      payload.find({
        collection: "products",
        where: {
          and: [{ featured: { equals: true } }, { _status: { equals: "published" } }],
        },
        limit: 4,
        depth: 1,
        overrideAccess: false,
      }),
    ),
    safe(() =>
      payload.find({
        collection: "projects",
        where: {
          and: [{ featured: { equals: true } }, { _status: { equals: "published" } }],
        },
        limit: 4,
        depth: 1,
        overrideAccess: false,
      }),
    ),
    safe(() =>
      payload.find({
        collection: "testimonials",
        where: {
          and: [{ featured: { equals: true } }, { _status: { equals: "published" } }],
        },
        limit: 6,
        depth: 0,
        overrideAccess: false,
      }),
    ),
  ]);

  const allCategories: CategoryCard[] = (categoryRes?.docs ?? []).map((category) => ({
    name: category.name,
    slug: category.slug,
    intro: category.intro ?? null,
    image: toMedia(category.heroImage),
  }));

  const mappedProjects: ProjectItem[] = (projectRes?.docs ?? []).map((project) => ({
    title: project.title,
    slug: project.slug,
    location: project.location ?? null,
    type: project.type ?? null,
    href: `/projects/${project.slug}`,
    image:
      toMedia(project.heroImage) ??
      toMedia(project.gallery?.[0]) ??
      toMedia(project.afterImage) ??
      toMedia(project.beforeImage),
    beforeImage: toMedia(project.beforeImage),
    afterImage: toMedia(project.afterImage),
    detailImage: toMedia(project.gallery?.[0]),
  }));
  const mappedProducts: FeaturedProduct[] = (productRes?.docs ?? []).flatMap((product) => {
    const categorySlug = typeof product.category === "object" ? product.category.slug : null;
    if (!categorySlug) return [];
    return [
      {
        name: product.name,
        slug: product.slug,
        summary: product.summary ?? null,
        href: `/products/${categorySlug}/${product.slug}`,
        image: toMedia(product.heroImage),
      },
    ];
  });

  const heroImage =
    toMedia(heroBlock && "image" in heroBlock ? heroBlock.image : null) ??
    mappedProjects[0]?.image ??
    mappedProducts[0]?.image ??
    null;

  const stats: StatItem[] =
    statsBlock?.blockType === "statsBand"
      ? (statsBlock.stats ?? []).flatMap((stat) =>
          stat.label && stat.value ? [{ label: stat.label, value: stat.value }] : [],
        )
      : [];

  const testimonials: TestimonialItem[] = (testimonialRes?.docs ?? [])
    .map((t) => ({
      name: t.name,
      rating: t.rating,
      text: t.text,
      location: t.location ?? null,
      verified: t.verified ?? false,
    }))
    .sort((a, b) => Number(b.verified) - Number(a.verified));

  return {
    heroImage,
    heroSubtext: heroBlock && "subheading" in heroBlock ? (heroBlock.subheading ?? null) : null,
    stats,
    categories: allCategories.slice(0, 10),
    tickerNames: allCategories.map((c) => c.name),
    spaces: (solutionRes?.docs ?? []).map((solution) => ({
      name: solution.name,
      slug: solution.slug,
      image: toMedia(solution.heroImage),
    })),
    products: mappedProducts,
    projects: mappedProjects,
    testimonials,
  };
}

const STUDIO_CAPABILITIES: Array<{ slug: string; title: string; description: string }> = [
  {
    slug: "feature-walls",
    title: "Feature Walls",
    description: "Panels, stone, and lighting composed as one system — designed and installed.",
  },
  {
    slug: "custom-doors",
    title: "Custom Doors",
    description:
      "Existing frames transformed in stone, louver, or 3D faces, matched to your walls.",
  },
  {
    slug: "mandir-darbar",
    title: "Mandir & Darbar",
    description: "Handcrafted carved stone with integrated lighting and built-in storage.",
  },
  {
    slug: "3d-parametric",
    title: "3D Parametric",
    description: "CNC-cut computational relief, scaled precisely to your wall dimensions.",
  },
];

function studioCapabilities(categories: CategoryCard[]): CapabilityCard[] {
  return STUDIO_CAPABILITIES.map((capability) => ({
    title: capability.title,
    description: capability.description,
    image: categories.find((c) => c.slug === capability.slug)?.image ?? null,
  }));
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

function LocalBusinessJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: "PKEE Constructions",
    description:
      "Premium decorative building materials — supplier, fabricator, and installer. PVC wall panels, decor sheets, faux stone, and custom fabrication.",
    url: "https://www.pkeeconstructions.ca",
    address: {
      "@type": "PostalAddress",
      streetAddress: "360 Keewatin St",
      addressLocality: "Winnipeg",
      addressRegion: "MB",
      addressCountry: "CA",
    },
  };
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static in-repo JSON-LD, no user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
