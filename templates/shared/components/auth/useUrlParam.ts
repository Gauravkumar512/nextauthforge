"use client";

import { useEffect, useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** Reads a query parameter on the client (null on the server and when absent). */
export function useSearchParam(name: string): string | null {
  const search = useSyncExternalStore(
    noopSubscribe,
    () => window.location.search,
    () => ""
  );
  return new URLSearchParams(search).get(name);
}

/**
 * Captures a query parameter once, then (optionally) removes it from the
 * address bar so a secret token doesn't linger in the URL, history or Referer
 * headers. Returns undefined until the browser has read it, then the value or
 * null. Create the store at module level and pass it to `useCapturedParam`.
 * (The value is kept for the life of the page load, which is what an emailed
 * link needs: React may render twice in development, and the URL is cleaned
 * after the first read.)
 */
export function createCapturedParam(name: string, options: { strip?: boolean } = {}) {
  let value: string | null | undefined;
  return {
    read(): string | null | undefined {
      if (value === undefined) value = new URLSearchParams(window.location.search).get(name);
      return value;
    },
    /** Removes the parameter from the address bar (after the page has loaded). */
    strip() {
      if (value && options.strip) window.history.replaceState(null, "", window.location.pathname);
    },
  };
}

export function useCapturedParam(store: ReturnType<typeof createCapturedParam>): string | null | undefined {
  const value = useSyncExternalStore(noopSubscribe, () => store.read(), () => undefined);
  // Strip from an effect, not while rendering: changing the URL during the
  // initial load can abort the page load in Firefox.
  useEffect(() => {
    if (value) store.strip();
  }, [value, store]);
  return value;
}
