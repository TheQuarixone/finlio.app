"use client";

import { createFinlioAuthClient } from "@finlio/data/auth";

/**
 * The browser client, used only to *start* a sign-in (send an OTP, open the
 * Google consent screen). The session itself is written by the callback route
 * as an httpOnly cookie, which script cannot read — so this client
 * deliberately has no storage worth the name.
 */
const memory = new Map<string, string>();

let client: ReturnType<typeof createFinlioAuthClient> | null = null;

export function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;

  client ??= createFinlioAuthClient(
    { url, publishableKey, persistSession: false, autoRefreshToken: false },
    {
      getItem: (key) => memory.get(key) ?? null,
      setItem: (key, value) => void memory.set(key, value),
      removeItem: (key) => void memory.delete(key),
    }
  );
  return client;
}
