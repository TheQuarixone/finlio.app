import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { CookieBanner } from "@/components/cookie-banner";
import {
  CONSENT_COOKIE,
  CONSENT_OPEN_EVENT,
  CONSENT_VERSION,
  parseConsent,
} from "@/lib/consent";

/**
 * The banner is the consent record: whatever it writes is what the rest of the
 * site (and later, analytics) will trust. So the assertions are about the
 * cookie it produces, not the markup around it.
 *
 * It appears on a short delay, hence findBy* with room to spare rather than
 * fake timers, which would have to be threaded through userEvent as well.
 */

const APPEAR_TIMEOUT = 2000;

function setConsentCookie(analytics: boolean, version = CONSENT_VERSION) {
  const value = encodeURIComponent(
    JSON.stringify({ version, at: new Date().toISOString(), analytics })
  );
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/`;
}

function storedConsent() {
  return parseConsent(document.cookie);
}

afterEach(() => {
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0`;
});

describe("CookieBanner", () => {
  it("asks a visitor who has not answered yet", async () => {
    render(<CookieBanner />);

    const banner = await screen.findByRole("dialog", undefined, { timeout: APPEAR_TIMEOUT });
    expect(banner).toHaveAccessibleName(/cookies on finlio/i);
    // Reject has to be available on the first layer, next to accept.
    expect(screen.getByRole("button", { name: /accept all/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reject all/i })).toBeInTheDocument();
  });

  it("records a refusal and closes", async () => {
    const user = userEvent.setup();
    render(<CookieBanner />);
    await screen.findByRole("dialog", undefined, { timeout: APPEAR_TIMEOUT });

    await user.click(screen.getByRole("button", { name: /reject all/i }));

    expect(storedConsent()).toMatchObject({ analytics: false });
    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

  it("records consent to analytics", async () => {
    const user = userEvent.setup();
    render(<CookieBanner />);
    await screen.findByRole("dialog", undefined, { timeout: APPEAR_TIMEOUT });

    await user.click(screen.getByRole("button", { name: /accept all/i }));

    expect(storedConsent()).toMatchObject({ analytics: true });
  });

  it("leaves analytics off until it is switched on", async () => {
    const user = userEvent.setup();
    render(<CookieBanner />);
    await screen.findByRole("dialog", undefined, { timeout: APPEAR_TIMEOUT });

    await user.click(screen.getByRole("button", { name: /customise/i }));

    const analytics = screen.getByRole("checkbox", { name: /analytics/i });
    expect(analytics).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /essential/i })).toBeDisabled();

    await user.click(analytics);
    await user.click(screen.getByRole("button", { name: /save choices/i }));

    expect(storedConsent()).toMatchObject({ analytics: true });
  });

  it("stays away once a choice has been made", async () => {
    setConsentCookie(false);
    render(<CookieBanner />);

    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("asks again when the categories change under an old cookie", async () => {
    setConsentCookie(true, CONSENT_VERSION - 1);
    render(<CookieBanner />);

    expect(
      await screen.findByRole("dialog", undefined, { timeout: APPEAR_TIMEOUT })
    ).toBeInTheDocument();
  });

  it("reopens on the footer's request, showing the saved choice", async () => {
    setConsentCookie(true);
    render(<CookieBanner />);

    window.dispatchEvent(new Event(CONSENT_OPEN_EVENT));

    await screen.findByRole("dialog", undefined, { timeout: APPEAR_TIMEOUT });
    expect(screen.getByRole("checkbox", { name: /analytics/i })).toBeChecked();
  });
});
