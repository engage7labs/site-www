export const COOKIE_CONSENT_KEY = "engage7_cookie_consent";
export const COOKIE_CONSENT_EVENT = "engage7:cookie-consent";

export type CookieConsent = "accepted" | "essential" | null;

export function getCookieConsent(): CookieConsent {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(COOKIE_CONSENT_KEY);
  if (value === "accepted" || value === "essential") return value;
  return null;
}

export function setCookieConsent(consent: Exclude<CookieConsent, null>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(COOKIE_CONSENT_KEY, consent);
  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, { detail: { consent } })
  );
}

export function subscribeCookieConsent(
  callback: (consent: CookieConsent) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const handleCustomEvent = (event: Event) => {
    const detail = (event as CustomEvent<{ consent?: CookieConsent }>).detail;
    callback(detail?.consent ?? getCookieConsent());
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (event.key === COOKIE_CONSENT_KEY) {
      callback(getCookieConsent());
    }
  };

  window.addEventListener(COOKIE_CONSENT_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorageEvent);

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorageEvent);
  };
}
