import type {
  Clock, EntitlementRepository, GoalRepository, ProfileRepository, SnapshotRepository,
} from "../ports";

/**
 * Everything a service needs, injected.
 *
 * Services never construct their own dependencies, so a test supplies plain
 * objects and no database, network, or clock is involved. This is also what
 * lets the same services run under React Native in Phase 4 — nothing here
 * knows what a request is.
 */
export interface ServiceContext {
  userId: string;
  profiles: ProfileRepository;
  goals: GoalRepository;
  snapshots: SnapshotRepository;
  entitlements: EntitlementRepository;
  clock: Clock;
}

/** Thrown when a rule says no. Transports map it to their own status codes. */
export class ServiceError extends Error {
  constructor(
    readonly code: "forbidden" | "not_found" | "limit_reached" | "invalid",
    message: string
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
