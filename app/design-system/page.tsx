import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ImageReveal } from "@/components/motion/ImageReveal";
import { Reveal } from "@/components/motion/Reveal";
import { BeforeAfterSlider } from "@/components/ui/BeforeAfterSlider";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SelectField } from "@/components/ui/field/SelectField";
import { TextAreaField } from "@/components/ui/field/TextAreaField";
import { TextField } from "@/components/ui/field/TextField";
import { Grid } from "@/components/ui/Grid";
import { Magnetic } from "@/components/ui/Magnetic";
import { Marquee } from "@/components/ui/Marquee";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CatalogCardSkeleton, Skeleton } from "@/components/ui/Skeleton";
import { SpecRow } from "@/components/ui/SpecRow";
import { ChipToggleDemo } from "./_components/ChipToggleDemo";

export const metadata: Metadata = {
  robots: { index: false },
};

/* INTERNAL PREVIEW ROUTE — every M1 primitive demoed on bone → ink → bone.
   REMOVE or gate behind auth before launch. */

function PrimitiveLabel({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p className={`text-label mb-6 ${dark ? "text-[color:var(--bone-dim)]" : "text-ink/50"}`}>
      {children}
    </p>
  );
}

function PlaceholderBlock({ label, tone }: { label: string; tone: "stone" | "charcoal" }) {
  return (
    <div
      className={`flex h-full w-full items-end p-6 ${tone === "stone" ? "bg-stone" : "bg-charcoal"}`}
    >
      <span
        className={`text-label ${tone === "charcoal" ? "text-[color:var(--bone-dim)]" : "text-ink/50"}`}
      >
        {label}
      </span>
    </div>
  );
}

export default function DesignSystemPage() {
  return (
    <main id="main">
      {/* ------------------------------------------------ bone section */}
      <section className="bg-bone py-24 md:py-32">
        <Container>
          <SectionHeading index="00" label="Design System — M1 Foundation" as="h1">
            Primitives on <em className="font-accent">bone</em>
          </SectionHeading>

          <Grid className="mt-20">
            <div className="col-span-12 md:col-span-6">
              <PrimitiveLabel>Button — components/ui/Button</PrimitiveLabel>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="solid">Request a Quote</Button>
                <Button variant="ghost">Browse Materials</Button>
                <Button variant="solid" href="/design-system">
                  As Link
                </Button>
                <Button variant="ghost" disabled>
                  Disabled
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-4">
                <PrimitiveLabel>Magnetic — components/ui/Magnetic</PrimitiveLabel>
              </div>
              <Magnetic>
                <Button variant="solid">Magnetic CTA</Button>
              </Magnetic>
            </div>
            <div className="col-span-12 md:col-span-6">
              <PrimitiveLabel>SectionHeading — components/ui/SectionHeading</PrimitiveLabel>
              <SectionHeading index="01" label="Material Library">
                Walls that read like <em className="font-accent">architecture</em>
              </SectionHeading>
            </div>
          </Grid>
        </Container>
      </section>

      {/* ------------------------------------------------- ink section */}
      <section className="bg-ink py-24 md:py-32">
        <Container>
          <SectionHeading index="02" label="Design System — M1 Foundation" dark>
            Primitives on <em className="font-accent">ink</em>
          </SectionHeading>

          <Grid className="mt-20">
            <div className="col-span-12 md:col-span-6">
              <PrimitiveLabel dark>Button (dark) — components/ui/Button</PrimitiveLabel>
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="solid" dark>
                  Request a Quote
                </Button>
                <Button variant="ghost" dark>
                  Browse Materials
                </Button>
              </div>

              <div className="mt-16">
                <PrimitiveLabel dark>Chip — components/ui/Chip + ChipToggleDemo</PrimitiveLabel>
                <ChipToggleDemo dark />
              </div>

              <div className="mt-16">
                <PrimitiveLabel dark>Skeleton — components/ui/Skeleton</PrimitiveLabel>
                <CatalogCardSkeleton />
              </div>
            </div>

            <div className="col-span-12 md:col-span-6">
              <PrimitiveLabel dark>SpecRow — components/ui/SpecRow</PrimitiveLabel>
              <dl className="mb-16">
                <SpecRow dark label="SKU" value="PK-PVC-2440-1220" />
                <SpecRow dark label="Dimensions" value="2440 × 1220 × 8 mm" />
                <SpecRow dark label="Applications" value="Feature walls, ceilings" />
                <SpecRow dark label="Care" value="Damp cloth, no solvents" />
              </dl>

              <PrimitiveLabel dark>FormField family — components/ui/field/*</PrimitiveLabel>
              <form className="space-y-10" aria-label="Design system field demo">
                <TextField dark id="ds-name" label="Full name" autoComplete="name" />
                <TextField
                  dark
                  id="ds-email"
                  label="Email"
                  type="email"
                  autoComplete="email"
                  error="Enter a valid email address."
                />
                <SelectField dark id="ds-space" label="Project type" defaultValue="">
                  <option value="" disabled>
                    Select…
                  </option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </SelectField>
                <TextAreaField dark id="ds-brief" label="Project brief" autoComplete="off" />
              </form>
            </div>
          </Grid>
        </Container>
      </section>

      {/* ------------------------------------------------ bone section */}
      <section className="bg-bone py-24 md:py-32">
        <Container>
          <SectionHeading index="03" label="Design System — M1 Foundation">
            Motion <em className="font-accent">primitives</em>
          </SectionHeading>

          <Grid className="mt-20">
            <div className="col-span-12 md:col-span-6">
              <PrimitiveLabel>Reveal — components/motion/Reveal</PrimitiveLabel>
              <Reveal as="h3" className="text-4xl leading-[0.95] font-medium tracking-tight">
                <span>Every line rises</span>
                <span>
                  from a <em className="font-accent">hairline clip</em>
                </span>
              </Reveal>

              <div className="mt-16">
                <PrimitiveLabel>ImageReveal — components/motion/ImageReveal</PrimitiveLabel>
                <ImageReveal className="aspect-[4/5] max-w-sm">
                  <PlaceholderBlock label="4:5 media" tone="stone" />
                </ImageReveal>
              </div>
            </div>

            <div className="col-span-12 md:col-span-6">
              <PrimitiveLabel>BeforeAfterSlider — components/ui/BeforeAfterSlider</PrimitiveLabel>
              <BeforeAfterSlider
                label="Demo comparison — raw wall vs finished feature wall"
                before={<PlaceholderBlock label="Before — raw wall" tone="stone" />}
                after={<PlaceholderBlock label="After — finished wall" tone="charcoal" />}
              />
            </div>
          </Grid>

          <div className="mt-20">
            <PrimitiveLabel>Marquee — components/ui/Marquee</PrimitiveLabel>
            <Marquee>
              {[
                "PVC Wall Panels",
                "Decorative Sheets",
                "Faux Stone",
                "Louver Panels",
                "Winnipeg — 360 Keewatin St",
              ].map((item) => (
                <span
                  key={item}
                  className="mx-8 flex items-center gap-8 text-sm tracking-[0.2em] uppercase"
                >
                  {item}
                  <span aria-hidden className="text-brass">
                    —
                  </span>
                </span>
              ))}
            </Marquee>
          </div>

          <div className="mt-16">
            <PrimitiveLabel>Skeleton (bare block) — components/ui/Skeleton</PrimitiveLabel>
            <Skeleton className="h-4 w-1/3" />
          </div>
        </Container>
      </section>
    </main>
  );
}
