/**
 * Time as a dependency.
 *
 * Domain code never calls `new Date()` — goal deadlines, snapshot months, and
 * "is this quote stale" are all time-dependent, and a test that cannot pin the
 * clock is a test that fails in December.
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

export const fixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });
