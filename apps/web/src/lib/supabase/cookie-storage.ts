import type { SessionStorage } from "@finlio/data/auth";

/**
 * A `SessionStorage` backed by cookies.
 *
 * This is the web half of the injectable-storage seam (architecture §4.3). It
 * is the only file in the auth path that knows what a cookie is; React Native
 * will supply an Expo SecureStore adapter of the same shape in Phase 4 and
 * nothing in `@finlio/data` changes.
 *
 * **Chunking.** A Supabase session with a large JWT can exceed the ~4KB
 * per-cookie limit, so values are split across numbered cookies. Without this
 * the browser silently truncates and the user is signed out at random.
 *
 * **Writes can fail, legitimately.** Next.js forbids setting cookies while
 * rendering a Server Component; only route handlers, Server Actions, and the
 * proxy may. Writes are therefore best-effort — the proxy is what actually
 * persists a refreshed session, and an RSC read that cannot write should render
 * rather than crash.
 */

const MAX_CHUNK = 3200;

export interface CookieAdapter {
  get(name: string): string | undefined;
  getAllNames(): string[];
  set(name: string, value: string): void;
  remove(name: string): void;
}

export function createCookieSessionStorage(cookies: CookieAdapter): SessionStorage {
  const chunkNames = (key: string) =>
    cookies.getAllNames().filter((name) => name === key || name.startsWith(`${key}.`));

  return {
    getItem(key) {
      const whole = cookies.get(key);
      if (whole !== undefined) return whole;

      const parts: string[] = [];
      for (let i = 0; ; i += 1) {
        const chunk = cookies.get(`${key}.${i}`);
        if (chunk === undefined) break;
        parts.push(chunk);
      }
      return parts.length > 0 ? parts.join("") : null;
    },

    setItem(key, value) {
      try {
        // Clear any previous layout first: a shorter session leaving stale
        // higher-numbered chunks behind would be read back as corrupt.
        for (const name of chunkNames(key)) cookies.remove(name);

        if (value.length <= MAX_CHUNK) {
          cookies.set(key, value);
          return;
        }
        for (let i = 0; i * MAX_CHUNK < value.length; i += 1) {
          cookies.set(`${key}.${i}`, value.slice(i * MAX_CHUNK, (i + 1) * MAX_CHUNK));
        }
      } catch {
        // Rendering a Server Component — the proxy will persist it instead.
      }
    },

    removeItem(key) {
      try {
        for (const name of chunkNames(key)) cookies.remove(name);
      } catch {
        // Same as above.
      }
    },
  };
}
