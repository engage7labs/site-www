"use client";

import { config } from "@/lib/config";
import { useEffect, useRef } from "react";

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export function Turnstile({ onVerify }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    // Skip Turnstile in dev mode or if no site key
    if (config.appEnv === "dev" || !siteKey) {
      onVerify("dev-bypass");
      return;
    }

    const renderWidget = () => {
      if (containerRef.current && window.turnstile && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          theme: "auto",
        });
      }
    };

    // If turnstile script is already loaded
    if (window.turnstile) {
      renderWidget();
      return;
    }

    // Load the script
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = renderWidget;
    document.head.appendChild(script);

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify]);

  if (config.appEnv === "dev" || !siteKey) {
    return null;
  }

  return <div ref={containerRef} />;
}

declare global {
  interface Window {
    turnstile: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      remove: (widgetId: string) => void;
    };
  }
}
