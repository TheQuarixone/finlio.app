/**
 * @vitest-environment jsdom
 *
 * This module is browser-only — it guards on `window` before touching
 * PostHog — so it has to be exercised in a DOM environment.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The rule worth protecting: nothing is loaded or captured until the visitor
 * has actually turned analytics on. A regression here is a privacy and
 * compliance problem, not just a bug.
 */

const init = vi.fn();
const capture = vi.fn();
const optOut = vi.fn();
const optIn = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    init,
    capture,
    opt_out_capturing: optOut,
    opt_in_capturing: optIn,
  },
}));

const hasConsent = vi.fn();
vi.mock("@/lib/consent", () => ({ hasConsent }));

const KEY = "phc_test";
const HOST = "https://eu.i.posthog.com";

function setHost(hostname: string) {
  Object.defineProperty(window, "location", {
    value: { ...window.location, hostname },
    writable: true,
    configurable: true,
  });
}

async function load({ configured = true, hostname = "finlio.app" } = {}) {
  vi.resetModules();
  setHost(hostname);
  if (configured) {
    process.env.NEXT_PUBLIC_POSTHOG_KEY = KEY;
    process.env.NEXT_PUBLIC_POSTHOG_HOST = HOST;
  } else {
    delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
    delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
  }
  return import("@/lib/analytics");
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
  delete process.env.NEXT_PUBLIC_POSTHOG_HOST;
});

describe("consent gating", () => {
  it("does not initialise before consent is given", async () => {
    hasConsent.mockReturnValue(false);
    const a = await load();
    a.startAnalytics();
    expect(init).not.toHaveBeenCalled();
  });

  it("captures nothing before consent is given", async () => {
    hasConsent.mockReturnValue(false);
    const a = await load();
    a.startAnalytics();
    a.track("waitlist_submitted");
    expect(capture).not.toHaveBeenCalled();
  });

  it("initialises once consent is given", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load();
    a.startAnalytics();
    expect(init).toHaveBeenCalledWith(KEY, expect.objectContaining({ api_host: HOST }));
  });

  it("never initialises twice", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load();
    a.startAnalytics();
    a.startAnalytics();
    expect(init).toHaveBeenCalledTimes(1);
  });

  it("stops capturing when consent is withdrawn mid-session", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load();
    a.startAnalytics();

    hasConsent.mockReturnValue(false);
    a.stopAnalytics();
    a.track("waitlist_submitted");

    expect(optOut).toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });
});

describe("configuration", () => {
  it("stays inert when no keys are set, even with consent", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load({ configured: false });
    expect(a.isAnalyticsConfigured()).toBe(false);
    a.startAnalytics();
    a.track("waitlist_submitted");
    expect(init).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it("pins capture defaults and keeps anonymous visitors profile-less", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load();
    a.startAnalytics();
    expect(init).toHaveBeenCalledWith(
      KEY,
      expect.objectContaining({
        defaults: "2026-05-30",
        person_profiles: "identified_only",
      })
    );
  });
});

describe("track", () => {
  it("forwards the event and its properties once live", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load();
    a.startAnalytics();
    a.track(a.EVENTS.waitlistConfirmed, { new_subscriber: true });
    expect(capture).toHaveBeenCalledWith("waitlist_confirmed", { new_subscriber: true });
  });
});

describe("local development", () => {
  it.each(["localhost", "127.0.0.1", "::1", "mac.local"])(
    "does not initialise on %s",
    async (hostname) => {
      hasConsent.mockReturnValue(true);
      const a = await load({ hostname });
      a.startAnalytics();
      expect(init).not.toHaveBeenCalled();
    }
  );

  it("captures nothing from a dev machine even after consent", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load({ hostname: "localhost" });
    a.startAnalytics();
    a.track("waitlist_submitted");
    expect(capture).not.toHaveBeenCalled();
  });

  it("still initialises on a deployed host", async () => {
    hasConsent.mockReturnValue(true);
    const a = await load({ hostname: "finlio.app" });
    a.startAnalytics();
    expect(init).toHaveBeenCalled();
  });
});
