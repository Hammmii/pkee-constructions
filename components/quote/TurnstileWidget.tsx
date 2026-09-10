"use client";

import { useEffect, useRef } from "react";

type TurnstileWidgetProps = {
  siteKey: string;
};

type TurnstileInstance = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback"?: () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileInstance;
  }
}

const SCRIPT_ID = "cf-turnstile-api";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/**
 * Cloudflare Turnstile widget — rendered only when the site key is configured
 * (env-gated; the server action skips verification when the secret is unset).
 * The token lands in a hidden input that rides along with the form post, so
 * the no-JS path still carries it.
 */
export function TurnstileWidget({ siteKey }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let widgetId: string | null = null;

    const renderWidget = () => {
      if (!containerRef.current || !window.turnstile) return;
      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => {
          if (inputRef.current) inputRef.current.value = token;
        },
        "expired-callback": () => {
          if (inputRef.current) inputRef.current.value = "";
        },
      });
    };

    if (window.turnstile) {
      renderWidget();
    } else if (!document.getElementById(SCRIPT_ID)) {
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
    } else {
      document.getElementById(SCRIPT_ID)?.addEventListener("load", renderWidget);
    }

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [siteKey]);

  return (
    <div>
      <div ref={containerRef} />
      <input ref={inputRef} type="hidden" name="cf-turnstile-response" />
    </div>
  );
}
