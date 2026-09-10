import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageTransition } from "@/components/motion/PageTransition";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";
import "./globals.css";

/* Stand-ins until PP Neue Montreal / Editorial New licenses are purchased
   (M11). Variable names match the token contracts in globals.css so the
   swap is config-only. */
const display = Inter({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const accent = Fraunces({
  variable: "--font-accent",
  subsets: ["latin"],
  style: ["italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PKEE Constructions — Premium Decorative Building Materials, Winnipeg",
    template: "%s — PKEE Constructions",
  },
  description:
    "PVC wall panels, decorative sheets, faux stone, louver panels and custom interior fabrication for residential and commercial spaces. 360 Keewatin St, Winnipeg, MB.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${display.variable} ${accent.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SmoothScrollProvider>
          {/* Keyboard-first skip past the header + mega-menu. */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:bg-ink focus:px-4 focus:py-2 focus:text-label focus:text-bone"
          >
            Skip to content
          </a>
          <Header />
          <PageTransition>
            {/* Pages render their sections inside this landmark — they must
                not render a second <main>. */}
            <main id="main" className="flex-1">
              {children}
            </main>
          </PageTransition>
          <Footer />
          {/* Spacer keeps the mobile floating bar from obscuring the footer. */}
          <div aria-hidden className="h-16 md:hidden" />
          <FloatingActions />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
