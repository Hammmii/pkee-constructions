import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

/**
 * Next 16 global 404: served for URLs that match no route at all, bypassing
 * the root layout — so this file renders the full HTML document, its own
 * font, and imports global styles itself. Requires
 * `experimental.globalNotFound` in next.config.ts. Kept deliberately lean
 * (single system-ish font, no motion) per the Next docs' performance note.
 */

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Page not found — PKEE Constructions",
  description: "The page you are looking for does not exist.",
};

export default function GlobalNotFound() {
  return (
    <html lang="en-CA" className={`${inter.className} h-full antialiased`}>
      <body
        className="flex min-h-full flex-col items-center justify-center px-6 text-center"
        style={{ background: "var(--bone)", color: "var(--ink)" }}
      >
        <p
          aria-hidden
          style={{
            fontSize: "clamp(5rem, 18vw, 12rem)",
            lineHeight: 0.9,
            fontWeight: 500,
            color: "var(--brass)",
          }}
        >
          404
        </p>
        <h1
          style={{
            fontFamily: "Georgia, serif",
            fontStyle: "italic",
            fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
            maxWidth: "24ch",
          }}
        >
          This page went missing from the blueprint.
        </h1>
        <p style={{ maxWidth: "34rem", opacity: 0.7, lineHeight: 1.6 }}>
          PKEE Constructions — premium decorative building materials. 360 Keewatin St, Winnipeg, MB.
        </p>
        <nav aria-label="Not found" style={{ marginTop: "2.5rem", display: "flex", gap: "1rem" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              background: "var(--ink)",
              color: "var(--bone)",
              textDecoration: "none",
              fontSize: "0.8125rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Back to home
          </Link>
          <Link
            href="/products"
            style={{
              display: "inline-block",
              padding: "1rem 2rem",
              border: "1px solid var(--stone)",
              color: "var(--ink)",
              textDecoration: "none",
              fontSize: "0.8125rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Browse materials
          </Link>
        </nav>
      </body>
    </html>
  );
}
