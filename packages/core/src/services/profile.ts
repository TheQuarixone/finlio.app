import type { Profile, ProfileUpdate } from "@finlio/schemas";
import type { ServiceContext } from "./context";

/**
 * Called on every sign-in, from the auth callback route handler.
 *
 * Deliberately here and not in a database trigger or a Server Action: mobile
 * hits the same path in Phase 4, and a trigger cannot be unit-tested with a
 * fake repository.
 */
export async function ensureProfile(
  ctx: ServiceContext
): Promise<{ profile: Profile; created: boolean }> {
  return ctx.profiles.ensure(ctx.userId);
}

export async function getProfile(ctx: ServiceContext): Promise<Profile | null> {
  return ctx.profiles.find(ctx.userId);
}

export async function updateProfile(
  ctx: ServiceContext,
  patch: ProfileUpdate
): Promise<Profile> {
  return ctx.profiles.update(ctx.userId, patch);
}
