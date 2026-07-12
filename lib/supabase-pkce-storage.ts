const PKCE_VERIFIER_SUFFIX = "-code-verifier";

interface BrowserStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createPkceVerifierStorage(storage: BrowserStorage) {
  return {
    getItem(key: string): string | null {
      return key.endsWith(PKCE_VERIFIER_SUFFIX) ? storage.getItem(key) : null;
    },
    setItem(key: string, value: string): void {
      if (key.endsWith(PKCE_VERIFIER_SUFFIX)) storage.setItem(key, value);
    },
    removeItem(key: string): void {
      if (key.endsWith(PKCE_VERIFIER_SUFFIX)) storage.removeItem(key);
    },
  };
}
