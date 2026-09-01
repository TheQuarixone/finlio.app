import { NextResponse, type NextRequest } from "next/server";

/**
 * Next 16 renamed `middleware.ts` to `proxy.ts` and moved it to the Node
 * runtime by default.
 *
 * Scope is deliberately narrow. The Next docs are explicit that proxy is not a
 * session-management or authorization solution — it runs on every request
 * including prefetches, so a database call here would be paid for constantly.
 * It does one thing: if there is no session cookie at all, skip rendering a
 * private page and send the visitor to sign-in.
 *
 * The real check is `requireUser()` in the DAL, which revalidates the token.
 * A forged cookie gets past this and is refused there.
 */
const SESSION_COOKIE = /^sb-.*-auth-token/;

/**
 * Local development without Supabase.
 *
 * Auth cannot work at all when the project is not configured, so gating would
 * just make the app unreachable on a fresh checkout. This opens it up in that
 * one case — and is impossible in production twice over: `NODE_ENV` is checked,
 * and a deployed environment always has the Supabase URL set.
 */
function authUnavailable(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function proxy(request: NextRequest) {
  if (authUnavailable()) return NextResponse.next();

  const hasSession = request.cookies
    .getAll()
    .some((cookie) => SESSION_COOKIE.test(cookie.name) && cookie.value.length > 0);

  if (hasSession) return NextResponse.next();

  const signIn = new URL("/sign-in", request.url);
  // Preserve intent so the user lands where they were headed.
  signIn.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(signIn);
}

export const config = {
  matcher: ["/app/:path*"],
};
