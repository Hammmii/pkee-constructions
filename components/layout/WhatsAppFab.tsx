"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  useMounted,
  usePrefersReducedMotion,
} from "@/components/motion/use-prefers-reduced-motion";
import { site, whatsappLink } from "@/lib/site";
import { genericInquiryMessage } from "@/lib/whatsapp";

const ENTERED_KEY = "pkee-wa-fab-entered";
const DISMISSED_KEY = "pkee-wa-fab-dismissed";

const HREF = whatsappLink(genericInquiryMessage());

/**
 * Desktop-only floating WhatsApp action (R2.2a). The mobile conversion bar
 * stays the single mobile entry; this is the persistent desktop entry per
 * the motion spec §10: Micro tier only — spring-free reduced-motion path,
 * 1.2s delayed entrance animated at most once per session, tap scale 0.96,
 * 200ms label fade. Dismissible with Escape (persisted per session) and
 * reappears on route change. Sits above content (z-30) but below the mobile
 * bar (z-40, md:hidden) and lifts itself clear of the sticky per-product
 * quote panel on PDPs.
 */
export function WhatsAppFab() {
  const mounted = useMounted();
  const reduced = usePrefersReducedMotion();
  const pathname = usePathname();
  const firstPathname = useRef(pathname);
  const [shown, setShown] = useState(false);
  const [animate, setAnimate] = useState(false);

  // Session state: show unless dismissed this session; the spring entrance
  // fires at most once per session.
  useEffect(() => {
    if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;
    const entered = sessionStorage.getItem(ENTERED_KEY) === "1";
    setShown(true);
    setAnimate(!entered && !reduced);
    if (!entered) sessionStorage.setItem(ENTERED_KEY, "1");
  }, [reduced]);

  // Reappear on route change — a new page is a new context (guarded so the
  // mount run above doesn't resurrect a same-session dismissal).
  useEffect(() => {
    if (pathname === firstPathname.current) return;
    sessionStorage.removeItem(DISMISSED_KEY);
    setShown(true);
    setAnimate(false);
  }, [pathname]);

  // Escape dismisses the FAB for the session.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      sessionStorage.setItem(DISMISSED_KEY, "1");
      setShown(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!mounted || !shown) return null;

  // On PDPs the sticky "Request a quote" panel hugs the bottom — lift the
  // FAB clear of it so the two never overlap.
  const onProductPage = /^\/products\/[^/]+\/[^/]+/.test(pathname);

  return (
    <motion.a
      href={HREF}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${site.name} on WhatsApp at ${site.whatsapp.display}`}
      initial={animate ? { scale: 0.4, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      transition={animate ? { type: "spring", stiffness: 260, damping: 24, delay: 1.2 } : undefined}
      whileTap={reduced ? undefined : { scale: 0.96 }}
      className={`group fixed right-6 z-30 hidden h-14 w-14 items-center justify-center rounded-full border border-brass/60 bg-ink text-bone shadow-[0_8px_30px_rgb(0_0_0/0.18)] transition-colors duration-300 hover:text-brass focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brass md:flex ${
        onProductPage ? "bottom-44" : "bottom-6"
      }`}
    >
      <svg aria-hidden width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z" />
      </svg>
      <span className="pointer-events-none absolute right-full mr-4 whitespace-nowrap rounded-[2px] bg-ink px-4 py-2.5 text-[0.8125rem] font-medium uppercase tracking-[0.12em] text-bone opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
        Chat with us
      </span>
    </motion.a>
  );
}
