import type { Metadata } from "next";
import { AboutHero } from "@/components/about/AboutHero";
import { type Principal, PrincipalsGrid } from "@/components/about/PrincipalsGrid";
import { RichTextBlock } from "@/components/about/RichTextBlock";
import { ShowroomCallout } from "@/components/about/ShowroomCallout";
import { type AboutStat, StatsBand } from "@/components/about/StatsBand";
import { Timeline, type TimelineEntry } from "@/components/about/Timeline";
import { type ValueItem, ValuesGrid } from "@/components/about/ValuesGrid";
import { FinalCta } from "@/components/marketing/FinalCta";
import { getPayloadCached } from "@/lib/payload";
import type { Media, Page } from "@/payload-types";

export const metadata: Metadata = {
  title: "About",
  description:
    "PKEE Constructions — premium decorative building materials supplier, fabricator, and installer in Winnipeg, MB. Our story, our people, and the showroom at 360 Keewatin St.",
};

// ---------------------------------------------------------------------------
// Placeholder editorial content (TODO-CLIENT): principals, milestones, and
// values are brand copy, not catalog data — they live here as clearly
// flagged stand-ins until the client supplies confirmed bios and dates.
// Never swap these for invented "real-looking" facts without sign-off.
// ---------------------------------------------------------------------------

const PRINCIPALS: Principal[] = [
  {
    name: "Founder, PKEE Constructions",
    role: "Principal — Supply & Fabrication",
    bio: "TODO-CLIENT: confirmed bio pending. Runs sourcing and in-house fabrication — CNC carving, book-matching, and 3D relief.",
  },
  {
    name: "Principal, PKEE Constructions",
    role: "Principal — Installation & Showroom",
    bio: "TODO-CLIENT: confirmed bio pending. Leads the install crews and the 360 Keewatin St showroom displays.",
  },
  {
    name: "Showroom Lead",
    role: "Client Consultations",
    bio: "TODO-CLIENT: confirmed bio pending. Runs consultations, samples, and quote follow-ups for homeowners and trade.",
  },
];

const TIMELINE: TimelineEntry[] = [
  {
    year: "Founding",
    title: "PKEE Constructions opens in Winnipeg",
    body: "TODO-CLIENT: confirmed date pending. The company starts as a supplier of decorative wall and ceiling materials for Manitoba builders.",
  },
  {
    year: "Growth",
    title: "Fabrication moves in-house",
    body: "TODO-CLIENT: confirmed date pending. CNC carving, custom louvres, and made-to-measure panels join the supply business.",
  },
  {
    year: "Today",
    title: "The Keewatin St showroom",
    body: "Full-size installed displays of PVC wall panels, WPC, SPC, faux stone, and custom studio work at 360 Keewatin St, Winnipeg.",
  },
];

const VALUES: ValueItem[] = [
  {
    title: "Materials first",
    body: "We stock what we would put in our own walls — waterproof, fire-rated options graded for Manitoba basements and bathrooms.",
  },
  {
    title: "One team, start to finish",
    body: "Supply, fabrication, and installation under one roof. No handoffs, no finger-pointing, one accountable quote.",
  },
  {
    title: "Showroom honesty",
    body: "Everything we sell is installed at 360 Keewatin St. Judge the real finish in person before you commit a dollar.",
  },
];

function toMedia(media: number | Media | null | undefined): { url: string; alt: string } | null {
  if (!media || typeof media === "number") return null;
  return media.url ? { url: media.url, alt: media.alt ?? "" } : null;
}

async function findAboutPage(): Promise<Page | null> {
  try {
    const payload = await getPayloadCached();
    const res = await payload.find({
      collection: "pages",
      where: { slug: { equals: "about" } },
      limit: 1,
      depth: 1,
      overrideAccess: false,
    });
    return res.docs[0] ?? null;
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const about = await findAboutPage();

  const heroBlock = about?.blocks?.find((block) => block.blockType === "hero");
  const statsBlock = about?.blocks?.find((block) => block.blockType === "statsBand");
  const richTextBlocks = about?.blocks?.filter((block) => block.blockType === "richText") ?? [];

  const stats: AboutStat[] =
    statsBlock?.blockType === "statsBand"
      ? (statsBlock.stats ?? []).flatMap((stat) =>
          stat.label && stat.value ? [{ label: stat.label, value: stat.value }] : [],
        )
      : [];

  return (
    <div className="flex-1 bg-background">
      <AboutHero
        heading={
          heroBlock && heroBlock.blockType === "hero" && heroBlock.heading
            ? heroBlock.heading
            : "Premium materials, installed with pride."
        }
        subheading={
          heroBlock && heroBlock.blockType === "hero" ? (heroBlock.subheading ?? null) : null
        }
        image={heroBlock && heroBlock.blockType === "hero" ? toMedia(heroBlock.image) : null}
      />

      {richTextBlocks.length > 0 ? (
        richTextBlocks.map((block, i) =>
          block.blockType === "richText" ? (
            <RichTextBlock key={block.id ?? i} content={block.content} kicker={`01 — Our Story`} />
          ) : null,
        )
      ) : (
        // Graceful empty state — no Pages doc / no richText blocks yet.
        <RichTextBlock
          kicker="01 — Our Story"
          content={{
            root: {
              children: [
                {
                  type: "paragraph",
                  text: "PKEE Constructions supplies, fabricates, and installs premium decorative building materials from 360 Keewatin St, Winnipeg. Led by our PVC wall panel program, the catalog spans WPC and SPC flooring, louvres, decor sheets, faux stone, and custom fabrication.",
                },
              ],
            },
          }}
        />
      )}

      <PrincipalsGrid principals={PRINCIPALS} />
      <StatsBand stats={stats} />
      <Timeline entries={TIMELINE} />
      <ValuesGrid values={VALUES} />
      <ShowroomCallout />
      <FinalCta />
    </div>
  );
}
