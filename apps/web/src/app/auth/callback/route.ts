import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@finlio/core/services";
import { createServerSupabase } from "@/lib/supabase/server";
import { serviceContextFor } from "@/lib/dal";

/**
 * Where every sign-in lands — OTP verification and OAuth both.
 *
 * A REST route handler, not a Server Action: the caller is an external redirect
 * from Supabase, and Server Actions cannot receive one (ADR-0002). It is also
 * the only place in the app allowed to write the session cookie, which is why
 * the code exchange happens here rather than in the browser.
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/app";

  // Never redirect to an absolute URL a caller supplied — that is an open
  // redirect, and this endpoint is reachable by anyone.
  const destination = next.startsWith("/") && !next.startsWith("//") ? next : "/app";

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_code", request.url));
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.redirect(new URL("/sign-in?error=not_configured", request.url));
  }

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return NextResponse.redirect(new URL("/sign-in?error=exchange_failed", request.url));
  }

  // First sign-in creates the profile row. Idempotent, so every later sign-in
  // is a no-op — and it runs through the service layer because mobile will hit
  // exactly this path in Phase 4.
  try {
    await ensureProfile(serviceContextFor(data.user.id));
  } catch (cause) {
    // A profile row is recoverable; blocking the sign-in over it is not.
    console.error("ensureProfile failed after sign-in:", cause);
  }

  return NextResponse.redirect(new URL(destination, request.url));
}
