"use client";

import { Analytics } from "@vercel/analytics/next";
import {
  getCookieConsent,
  subscribeCookieConsent,
} from "@/lib/cookie-consent";
import { useEffect, useState } from "react";

export function ConsentAwareAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(getCookieConsent() === "accepted");
    return subscribeCookieConsent((consent) => {
      setEnabled(consent === "accepted");
    });
  }, []);

  return enabled ? <Analytics /> : null;
}
