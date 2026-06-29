import { useCallback, useEffect, useRef, useState } from "react";

export const AUTH_SESSION_CHANGE_KEY = "engage7_auth_session_change";
export const AUTH_SESSION_CHANGE_EVENT = "engage7:auth-session-change";
const AUTH_SESSION_CHANNEL = "engage7-auth-session";

export type AuthSessionChangeReason =
  | "login"
  | "logout"
  | "user_switch"
  | "account_deleted"
  | "session_refresh"
  | "changed";

interface AuthSessionChangePayload {
  id: string;
  at: number;
  reason: AuthSessionChangeReason;
}

export interface AuthSessionSnapshot {
  authenticated: true;
  email: string;
  role: "user" | "admin";
  mode?: "admin_view";
  read_only: boolean;
  view_as_user_id?: string;
}

type SessionGuardStatus = "checking" | "ready" | "refreshing";

function randomEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function parseChangePayload(value: string | null): AuthSessionChangePayload | null {
  if (!value) return null;
  try {
    const payload = JSON.parse(value) as Partial<AuthSessionChangePayload>;
    if (
      typeof payload.id === "string" &&
      typeof payload.at === "number" &&
      typeof payload.reason === "string"
    ) {
      return payload as AuthSessionChangePayload;
    }
  } catch {
    return null;
  }
  return null;
}

export function publishAuthSessionChanged(
  reason: AuthSessionChangeReason = "changed"
): void {
  if (typeof window === "undefined") return;

  const payload: AuthSessionChangePayload = {
    id: randomEventId(),
    at: Date.now(),
    reason,
  };

  window.dispatchEvent(
    new CustomEvent(AUTH_SESSION_CHANGE_EVENT, { detail: payload })
  );

  try {
    const channel = new BroadcastChannel(AUTH_SESSION_CHANNEL);
    channel.postMessage(payload);
    channel.close();
  } catch {
    // BroadcastChannel is best-effort; storage event below is the fallback.
  }

  try {
    window.localStorage.setItem(AUTH_SESSION_CHANGE_KEY, JSON.stringify(payload));
  } catch {
    // Auth state is still protected by no-store revalidation on focus/visibility.
  }
}

export function subscribeAuthSessionChanges(
  callback: (payload: AuthSessionChangePayload) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let channel: BroadcastChannel | null = null;

  const handleCustomEvent = (event: Event) => {
    const payload = (event as CustomEvent<AuthSessionChangePayload>).detail;
    if (payload?.id) callback(payload);
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key !== AUTH_SESSION_CHANGE_KEY) return;
    const payload = parseChangePayload(event.newValue);
    if (payload) callback(payload);
  };

  window.addEventListener(AUTH_SESSION_CHANGE_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  try {
    channel = new BroadcastChannel(AUTH_SESSION_CHANNEL);
    channel.onmessage = (event) => {
      const payload = event.data as AuthSessionChangePayload | null;
      if (payload?.id) callback(payload);
    };
  } catch {
    channel = null;
  }

  return () => {
    window.removeEventListener(AUTH_SESSION_CHANGE_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
    channel?.close();
  };
}

export async function fetchAuthSessionSnapshot(): Promise<AuthSessionSnapshot | null> {
  const response = await fetch("/api/auth/session", {
    cache: "no-store",
    headers: { "Cache-Control": "no-store" },
  });

  if (!response.ok) return null;
  const data = (await response.json().catch(() => null)) as
    | {
        authenticated?: boolean;
        email?: unknown;
        sub?: unknown;
        role?: unknown;
        mode?: unknown;
        read_only?: unknown;
        view_as_user_id?: unknown;
      }
    | null;

  const email =
    typeof data?.email === "string"
      ? data.email.trim().toLowerCase()
      : typeof data?.sub === "string"
        ? data.sub.trim().toLowerCase()
        : "";
  const role = data?.role === "admin" ? "admin" : data?.role === "user" ? "user" : null;

  if (data?.authenticated !== true || !email || !role) return null;

  return {
    authenticated: true,
    email,
    role,
    mode: data.mode === "admin_view" ? "admin_view" : undefined,
    read_only: data.read_only === true,
    view_as_user_id:
      typeof data.view_as_user_id === "string" ? data.view_as_user_id : undefined,
  };
}

function authSessionFingerprint(session: AuthSessionSnapshot): string {
  return [
    session.email,
    session.role,
    session.mode ?? "",
    session.read_only ? "1" : "0",
    session.view_as_user_id ?? "",
  ].join("|");
}

function redirectToLogin(loginPath: string) {
  const url = new URL(loginPath, window.location.origin);
  url.searchParams.set("unauth", "1");
  url.searchParams.set("next", `${window.location.pathname}${window.location.search}`);
  window.location.assign(url.toString());
}

export function useSessionSafetyGuard(options: {
  loginPath?: string;
  requiredRole?: "admin";
}) {
  const loginPath = options.loginPath ?? "/login";
  const [status, setStatus] = useState<SessionGuardStatus>("checking");
  const baselineRef = useRef<string | null>(null);
  const revalidatingRef = useRef(false);

  const revalidate = useCallback(
    async (reason: string) => {
      if (revalidatingRef.current || typeof window === "undefined") return;
      revalidatingRef.current = true;

      try {
        const session = await fetchAuthSessionSnapshot();
        if (!session) {
          setStatus("refreshing");
          redirectToLogin(loginPath);
          return;
        }

        if (options.requiredRole && session.role !== options.requiredRole) {
          setStatus("refreshing");
          redirectToLogin(loginPath);
          return;
        }

        const fingerprint = authSessionFingerprint(session);
        if (!baselineRef.current) {
          baselineRef.current = fingerprint;
          setStatus("ready");
          return;
        }

        if (baselineRef.current !== fingerprint) {
          setStatus("refreshing");
          window.location.replace(window.location.href);
          return;
        }

        setStatus("ready");
      } catch {
        if (!baselineRef.current) {
          setStatus("ready");
        }
      } finally {
        revalidatingRef.current = false;
      }
    },
    [loginPath, options.requiredRole]
  );

  useEffect(() => {
    void revalidate("mount");

    const unsubscribeSession = subscribeAuthSessionChanges(() => {
      void revalidate("session-change");
    });

    const handleFocus = () => {
      void revalidate("focus");
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void revalidate("visibility");
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      unsubscribeSession();
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [revalidate]);

  return {
    status,
    ready: status === "ready",
  };
}
