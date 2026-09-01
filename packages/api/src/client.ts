import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "./root";

/**
 * The typed client, shared by web and (in Phase 4) React Native.
 *
 * It takes a URL and a header factory rather than reading cookies or storage
 * itself: the browser attaches its session cookie automatically, while React
 * Native will pass an Authorization header from SecureStore. Same client, one
 * argument different.
 */
export interface ClientOptions {
  url: string;
  headers?: () => Record<string, string> | Promise<Record<string, string>>;
}

export function createFinlioClient({ url, headers }: ClientOptions) {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url,
        headers,
        fetch: (input, init) =>
          fetch(input, { ...init, credentials: "include" }),
      }),
    ],
  });
}

export type { AppRouter };
