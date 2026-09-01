import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** POST, not GET: a link prefetch must never be able to sign somebody out. */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  await supabase?.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
