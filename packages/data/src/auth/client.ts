import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase auth, with storage injected.
 *
 * This is the "don't redo for mobile" decision in one file (architecture §4.3,
 * §5). The client itself has no idea where a session lives: the web passes a
 * cookie-backed adapter, React Native will pass Expo SecureStore, and tests
 * pass a Map. Nothing in this package imports `next/*`, so the same code runs
 * in both apps.
 *
 * If swapping the adapter ever requires editing this file, the seam is wrong.
 */
export interface SessionStorage {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

export interface SupabaseAuthConfig {
  url: string;
  publishableKey: string;
  /** Server-side clients must not persist or auto-refresh: there is no session
   *  to own between requests, and a background refresh timer in a serverless
   *  function is a leak. */
  persistSession?: boolean;
  autoRefreshToken?: boolean;
  detectSessionInUrl?: boolean;
}

export function createFinlioAuthClient(
  config: SupabaseAuthConfig,
  storage: SessionStorage
): SupabaseClient {
  return createClient(config.url, config.publishableKey, {
    auth: {
      storage,
      persistSession: config.persistSession ?? true,
      autoRefreshToken: config.autoRefreshToken ?? true,
      // Finlio handles the OAuth code exchange in a route handler, so the
      // client must not race it by parsing the URL itself.
      detectSessionInUrl: config.detectSessionInUrl ?? false,
      flowType: "pkce",
    },
  });
}

/** For tests, and the conformance target for every real adapter. */
export function createMemorySessionStorage(
  seed: Record<string, string> = {}
): SessionStorage {
  const store = new Map(Object.entries(seed));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
  };
}
