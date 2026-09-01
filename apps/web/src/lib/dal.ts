import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { systemClock } from "@finlio/core/ports";
import type { ServiceContext } from "@finlio/core/services";
import { db } from "@finlio/data/db";
import {
  createEntitlementRepository, createGoalRepository,
  createProfileRepository, createSnapshotRepository,
} from "@finlio/data/repositories";
import { createServerSupabase } from "./supabase/server";

/**
 * The Data Access Layer — where a request is actually authorised.
 *
 * `proxy.ts` does a cheap cookie check to avoid rendering a page nobody may
 * see; it is an optimisation, not a security boundary (the Next 16 docs are
 * explicit that proxy is not a session-management or authorization solution).
 * Every read of the current user goes through here.
 *
 * `getUser()` and not `getSession()`: the latter trusts whatever is in the
 * cookie, while `getUser()` revalidates the token with Supabase. On a server,
 * only the second one is a check.
 *
 * `React.cache` keeps it to one round trip per request no matter how many
 * components ask.
 */
/**
 * The same development-only escape as `proxy.ts`: with no Supabase project
 * configured there is nobody to authenticate, so a fresh checkout would show a
 * sign-in page that cannot work. Impossible in production — `NODE_ENV` is
 * checked and a deployment always has the URL set.
 */
const DEV_USER_ID = "00000000-0000-4000-8000-000000000001";

export const getCurrentUser = cache(async () => {
  const supabase = await createServerSupabase();
  if (!supabase) {
    return process.env.NODE_ENV !== "production"
      ? { id: DEV_USER_ID, email: "dev@localhost" }
      : null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email ?? null };
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  return user;
}

/** Builds the injected context services run against. */
export function serviceContextFor(userId: string): ServiceContext {
  return {
    userId,
    profiles: createProfileRepository(db),
    goals: createGoalRepository(db),
    snapshots: createSnapshotRepository(db),
    entitlements: createEntitlementRepository(db),
    clock: systemClock,
  };
}
