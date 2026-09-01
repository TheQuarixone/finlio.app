import { TRPCError, initTRPC } from "@trpc/server";
import { ServiceError, type ServiceContext } from "@finlio/core/services";

/**
 * The tRPC boundary (ADR-0002).
 *
 * One typed router, consumed by the web client today and the React Native
 * client in Phase 4. The router's whole job is: validate input, check auth,
 * call `packages/core`. Business rules never live here — if a procedure grows
 * past a few lines, the logic belongs in a service.
 */

export interface Context {
  /** Null when the request carries no valid session. */
  userId: string | null;
  /** Built per request by the host app, which owns the database connection. */
  services: (userId: string) => ServiceContext;
}

const t = initTRPC.context<Context>().create({
  errorFormatter: ({ shape }) => shape,
});

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * `ServiceError` carries a domain code; tRPC wants an HTTP-ish one. Mapping
 * happens once, here, so no service has to know what a 403 is.
 */
const SERVICE_ERROR_CODES = {
  forbidden: "FORBIDDEN",
  not_found: "NOT_FOUND",
  limit_reached: "FORBIDDEN",
  invalid: "BAD_REQUEST",
} as const;

const translateServiceErrors = t.middleware(async ({ next }) => {
  // tRPC middlewares do not see a throw: `next()` resolves to a result object
  // carrying the error, with the original exception on `.cause`. A try/catch
  // here silently never fires, which is how an untranslated ServiceError
  // reaches the client as a 500.
  const result = await next();
  if (result.ok) return result;

  const cause = result.error.cause;
  if (cause instanceof ServiceError) {
    throw new TRPCError({ code: SERVICE_ERROR_CODES[cause.code], message: cause.message });
  }
  return result;
});

/**
 * Authorisation, in one place.
 *
 * The proxy's cookie check is an optimistic redirect and nothing more; this is
 * where a request is actually refused. Procedures receive a non-null `userId`
 * and a service context already scoped to it, so a procedure cannot forget to
 * filter by user.
 */
export const protectedProcedure = t.procedure
  .use(translateServiceErrors)
  .use(async ({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
    }
    return next({ ctx: { ...ctx, userId: ctx.userId, ctx: ctx.services(ctx.userId) } });
  });
