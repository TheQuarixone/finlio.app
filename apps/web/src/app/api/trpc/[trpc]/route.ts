import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter, type Context } from "@finlio/api";
import { getCurrentUser, serviceContextFor } from "@/lib/dal";

/**
 * The tRPC endpoint (ADR-0002).
 *
 * Thin by design: resolve who is asking, hand the router a factory for the
 * service context, and get out of the way. Mobile will call this same URL in
 * Phase 4 with a bearer token instead of a cookie.
 */
async function handler(request: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext: async (): Promise<Context> => {
      const user = await getCurrentUser();
      return { userId: user?.id ?? null, services: serviceContextFor };
    },
  });
}

export { handler as GET, handler as POST };
