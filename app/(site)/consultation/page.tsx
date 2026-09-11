import type { Metadata } from "next";
import { ConsultationForm } from "@/components/consultation/ConsultationForm";
import { CONSULTATION_HOURS_DISPLAY, CONSULTATION_TYPE_LABELS } from "@/lib/consultation";
import { CONSULTATION_TYPES } from "@/lib/validators/consultation";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Book a Consultation",
    description:
      "Book a phone, video, showroom, or site-visit consultation with a PKEE materials specialist — we confirm every booking within 1 business day.",
  };
}

function todayLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Resolves the ?type= prefill (from CTAs elsewhere on the site) and renders
 * the booking form. Earliest bookable date is computed server-side so the
 * native date input's `min` never hydrates differently on the client.
 */
export default async function ConsultationPage({ searchParams }: PageProps<"/consultation">) {
  const { type } = await searchParams;
  const requested = typeof type === "string" ? type : undefined;
  const preselectedType =
    requested && (CONSULTATION_TYPES as readonly string[]).includes(requested) ? requested : "";

  return (
    <main className="flex-1 bg-background">
      <div className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="text-label text-brass">Consultation</p>
        <h1 className="mt-4 font-serif text-4xl italic text-ink md:text-5xl">
          Talk to a specialist.
        </h1>
        <p className="mt-4 max-w-xl text-foreground/60">
          Fifteen minutes with someone who knows the material library beats hours of browsing. Pick
          a format and a time — we confirm every booking personally within 1 business day.
        </p>

        {preselectedType && (
          <p className="mt-6 inline-block border border-brass/50 px-4 py-2 text-[0.8125rem] uppercase tracking-[0.12em] text-ink">
            Prefilled — {CONSULTATION_TYPE_LABELS[preselectedType] ?? preselectedType}
          </p>
        )}

        <div className="mt-12">
          <ConsultationForm
            minDate={todayLocal()}
            preselectedType={preselectedType}
            turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
          />
        </div>

        <div className="mt-16 border-t pt-8 rule">
          <h2 className="text-label text-ink/55">Showroom hours</h2>
          <ul className="mt-4 space-y-1 text-foreground/80">
            {CONSULTATION_HOURS_DISPLAY.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-4 text-[0.8125rem] text-ink/50">
            360 Keewatin St, Winnipeg, MB — consultations are always by booking, inside or outside
            these hours.
          </p>
        </div>
      </div>
    </main>
  );
}
