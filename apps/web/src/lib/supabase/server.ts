import { cookies } from "next/headers";
import { createFinlioAuthClient } from "@finlio/data/auth";
import { createCookieSessionStorage } from "./cookie-storage";

const COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 365,
} as const;

export function supabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

/**
 * A request-scoped Supabase client.
 *
 * `persistSession` and `autoRefreshToken` are off: there is no session for a
 * server instance to own between requests, and a background refresh timer in a
 * serverless function is a leak. The proxy handles refresh.
 */
export async function createServerSupabase() {
  const config = supabaseConfig();
  if (!config) return null;

  const store = await cookies();

  return createFinlioAuthClient(
    { ...config, persistSession: false, autoRefreshToken: false },
    createCookieSessionStorage({
      get: (name) => store.get(name)?.value,
      getAllNames: () => store.getAll().map((c) => c.name),
      set: (name, value) => store.set(name, value, COOKIE_OPTIONS),
      remove: (name) => store.set(name, "", { ...COOKIE_OPTIONS, maxAge: 0 }),
    })
  );
}
