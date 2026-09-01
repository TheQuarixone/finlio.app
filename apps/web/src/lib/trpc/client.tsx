"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { createFinlioClient, type AppRouter } from "@finlio/api/client";

/**
 * The tRPC client for the web app.
 *
 * The browser sends its session cookie automatically, so there are no headers
 * to build here. React Native will construct the same client in Phase 4 with a
 * bearer token from SecureStore — one argument different, same router.
 */
export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

export function TrpcProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: { networkMode: "always" },
          queries: {
            // Financial data is not a feed. Refetching on every window focus
            // costs requests and buys nothing the user asked for.
            refetchOnWindowFocus: false,
            staleTime: 30_000,
            retry: 1,
            /**
             * React Query's default (`"online"`) *pauses* a query when it
             * believes the browser is offline, and a paused query reports
             * `status: "pending"` forever. The screen then shows a loading
             * skeleton with no error and no way out — the worst failure mode
             * available, because it looks like the app is working.
             *
             * Finlio is already offline-capable where it matters: holdings
             * live on the device. What comes over the network is goal metadata,
             * and for that we would much rather attempt the request and show a
             * real error than hang silently.
             */
            networkMode: "always",
          },
        },
      })
  );

  const [trpcClient] = useState(() => createFinlioClient({ url: "/api/trpc" }));

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
