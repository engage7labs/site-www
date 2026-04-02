"use client";

import { trackPdfDownloadClicked } from "@/lib/telemetry";

const SESSION_KEY = "engage7_session_id";
const EVENTS_PROXY_PATH = "/api/proxy/events";

export type UserEventType =
  | "analysis_completed"
  | "pdf_downloaded"
  | "feedback_given"
  | "email_submitted"
  | "share_clicked"
  | "premium_unlock";

export interface UserEventPayload {
  job_id?: string;
  metadata?: Record<string, unknown>;
}

function createFallbackId(): string {
  const now = Date.now().toString(36);
  const uaLen =
    typeof navigator !== "undefined"
      ? navigator.userAgent.length.toString(36)
      : "0";
  return `sess_${now}_${uaLen}`;
}

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = window.localStorage.getItem(SESSION_KEY);
  if (existing) return existing;

  const generated =
    typeof window.crypto !== "undefined" &&
    typeof window.crypto.randomUUID === "function"
      ? window.crypto.randomUUID()
      : createFallbackId();

  window.localStorage.setItem(SESSION_KEY, generated);
  return generated;
}

export async function sendUserEvent(
  eventType: UserEventType,
  payload: UserEventPayload = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  const body = {
    event_type: eventType,
    session_id: getOrCreateSessionId(),
    job_id: payload.job_id,
    metadata: payload.metadata,
  };

  try {
    const response = await fetch(EVENTS_PROXY_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn("[events] failed", eventType, response.status);
    }
  } catch (error) {
    console.warn("[events] network error", eventType, error);
  }
}

export function trackPdfDownloaded(jobId: string, ctaLocation: string): void {
  trackPdfDownloadClicked(jobId, ctaLocation);
  void sendUserEvent("pdf_downloaded", {
    job_id: jobId,
    metadata: { cta_location: ctaLocation },
  });
}
