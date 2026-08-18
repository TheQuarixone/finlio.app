"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  CONSENT_OPEN_EVENT,
  getConsentSnapshot,
  getServerConsentSnapshot,
  parseConsent,
  readConsent,
  subscribeConsent,
  writeConsent,
} from "@/lib/consent";
import { buttonPrimary, buttonSecondary } from "@/lib/ui";

/* The consent banner.

   Two layers, the shape regulators have settled on: a first layer where
   "Accept all" and "Reject all" sit side by side with the same weight, and a
   second layer with a toggle per category, each non-essential one starting off.
   No dark patterns: rejecting is one click from the first screen, and the
   banner never blocks the page behind it.

   It appears only when there is no current answer, and can be summoned again
   from the footer, which is what "withdraw consent as easily as you gave it"
   requires in practice. */

const APPEAR_DELAY_MS = 700;

type Panel = "summary" | "details";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [panel, setPanel] = useState<Panel>("summary");
  const [analytics, setAnalytics] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  /* Set when the visitor asked for the banner from the footer. Focus follows
     the request, but never the automatic first appearance: stealing focus from
     someone who is mid-sentence on the page would be its own dark pattern. */
  const focusOnOpenRef = useRef(false);
  const headingId = useId();

  /* The cookie is client-only state, so it is read through an external store
     rather than an effect: the server snapshot is empty, the client snapshot is
     the real cookie, and React reconciles the two without a hydration flip. */
  const cookieString = useSyncExternalStore(
    subscribeConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const saved = useMemo(() => parseConsent(cookieString), [cookieString]);

  // A visitor who has already answered never sees the banner again unless they
  // ask for it. Everyone else gets it once the hero has finished its entrance.
  useEffect(() => {
    if (saved) return;
    const timer = window.setTimeout(() => setOpen(true), APPEAR_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [saved]);

  // Reopened from the footer link, landing straight on the toggles with the
  // visitor's current choices filled in.
  useEffect(() => {
    const onOpen = () => {
      setAnalytics(readConsent()?.analytics ?? false);
      setPanel("details");
      setOpen(true);
      // Focus has to wait for the panel to mount; see the effect below.
      focusOnOpenRef.current = true;
    };

    window.addEventListener(CONSENT_OPEN_EVENT, onOpen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open || !focusOnOpenRef.current) return;
    focusOnOpenRef.current = false;
    cardRef.current?.focus();
  }, [open]);

  const save = useCallback((allowAnalytics: boolean) => {
    writeConsent(allowAnalytics);
    setAnalytics(allowAnalytics);
    setOpen(false);
    setPanel("summary");
  }, []);

  if (!open) return null;

  return (
    <div
      className="fixed inset-x-3 bottom-3 z-[45] sm:inset-x-auto sm:bottom-6 sm:right-6 sm:max-w-[26rem]"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div
        ref={cardRef}
        tabIndex={-1}
        role="dialog"
        aria-labelledby={headingId}
        className="animate-rise rounded-2xl bg-white p-5 ring-1 ring-line shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] outline-none sm:rounded-3xl sm:p-6"
      >
        <h2
          id={headingId}
          className="text-[16px] font-semibold tracking-[-0.013em] text-jet"
        >
          Cookies on Finlio
        </h2>

        <p className="mt-2 text-[14px] font-medium leading-[1.55] text-body [text-wrap:pretty]">
          We use only the cookies this site needs to work. Analytics stay off
          unless you allow them, and we never use cookies for ads.
          {panel === "summary" ? (
            <>
              {" "}
              <button
                type="button"
                onClick={() => setPanel("details")}
                className="font-medium text-ink underline decoration-line decoration-2 underline-offset-4 transition-colors hover:decoration-brand-blue"
              >
                Customise
              </button>
              .
            </>
          ) : null}
        </p>

        {panel === "details" ? (
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-cream p-4">
            <ConsentRow
              label="Essential"
              description="Remembers this choice and keeps the site secure. Always on."
              checked
              locked
            />
            <ConsentRow
              label="Analytics"
              description="Anonymous page and waitlist statistics. Off by default."
              checked={analytics}
              onChange={setAnalytics}
            />
            {saved ? (
              <p className="text-[12px] text-body/60">
                Your last choice was saved on{" "}
                {new Date(saved.at).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                .
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          {panel === "summary" ? (
            <>
              {/* Accept and reject are the same size, colour weight and layer.
                  The quieter treatment is reserved for "Customise", which is
                  not a consent choice. */}
              <button
                type="button"
                onClick={() => save(true)}
                className={`${buttonPrimary} h-12 w-full px-5 text-[15px] sm:h-11 sm:w-auto sm:flex-1 sm:text-[14px]`}
              >
                Accept all
              </button>
              <button
                type="button"
                onClick={() => save(false)}
                className={`${buttonSecondary} h-12 w-full px-5 text-[15px] sm:h-11 sm:w-auto sm:flex-1 sm:text-[14px]`}
              >
                Reject all
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => save(analytics)}
                className={`${buttonPrimary} h-12 w-full px-5 text-[15px] sm:h-11 sm:w-auto sm:flex-1 sm:text-[14px]`}
              >
                Save choices
              </button>
              <button
                type="button"
                onClick={() => save(false)}
                className={`${buttonSecondary} h-12 w-full px-5 text-[15px] sm:h-11 sm:w-auto sm:flex-1 sm:text-[14px]`}
              >
                Reject all
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}

function ConsentRow({
  label,
  description,
  checked,
  locked = false,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  locked?: boolean;
  onChange?: (next: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={locked}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span
        aria-hidden
        className="mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full bg-line p-0.5 transition-colors duration-200 peer-checked:bg-brand-green peer-checked:[&>span]:translate-x-4 peer-disabled:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-blue/40"
      >
        <span className="size-4 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] transition-transform duration-200" />
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        <span className="block text-[13px] leading-[1.5] text-body/70">
          {description}
        </span>
      </span>
    </label>
  );
}
