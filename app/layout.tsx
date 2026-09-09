import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
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
          <PageTransition>{children}</PageTransition>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
