import Image from "next/image";
import { Faq } from "@/components/faq";
import { Logo, LogoMark } from "@/components/logo";
import { RotatingWord } from "@/components/rotating-word";
import { BriefCard } from "@/components/brief-card";
import { HeroDecor } from "@/components/hero-decor";
import { WaitlistForm } from "@/components/waitlist-form";
import { appIcon } from "@/lib/ui";

function AppIcon({ file, label }: { file: string; label: string }) {
  return (
    <Image
      src={`/logos/${file}.png`}
      alt={label}
      title={label}
      width={64}
      height={64}
      className={`size-7 sm:size-8 ${appIcon}`}
    />
  );
}

function IconRow({ children }: { children: React.ReactNode }) {
  return (
    <span className="reveal-icons ml-2.5 inline-flex translate-y-[-3px] gap-1.5 align-middle">
      {children}
    </span>
  );
}

/* Splits a sentence so each word can sharpen on its own as the page scrolls.
   The index drives the stagger; see `.reveal-word` in globals.css. */
function Words({ children }: { children: string }) {
  return (
    <>
      {children
        .trim()
        .split(/\s+/)
        .map((word, index) => (
          <span
            key={`${index}-${word}`}
            className="reveal-word"
            style={{ "--i": index } as React.CSSProperties}
          >
            {word}{" "}
          </span>
        ))}
    </>
  );
}

/** Small colour-coded eyebrow that names the section, as family.co does. */
function SectionLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <p className={`text-[14px] font-semibold tracking-[-0.006em] ${className}`}>
      {children}
    </p>
  );
}

const FOOTER_LINKS = [
  { label: "How it works", href: "#about" },
  { label: "FAQs", href: "#faqs" },
  { label: "Join the waitlist", href: "#waitlist" },
];

/* Socials are hidden for now. Kept here so the icon paths are not lost;
   the real handles still need to go in before this is shown again.

const SOCIALS = [
  {
    label: "Finlio on X",
    href: "https://x.com",
    path: "M18.9 2H22l-6.77 7.74L23.2 22h-6.23l-4.88-6.38L6.5 22H3.37l7.24-8.28L2.8 2h6.39l4.41 5.83L18.9 2Zm-1.1 18.13h1.73L7.33 3.77H5.47l12.33 16.36Z",
  },
  {
    label: "Finlio on LinkedIn",
    href: "https://linkedin.com",
    path: "M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5ZM.24 8.31h4.52V23H.24V8.31Zm7.44 0h4.33v2h.06c.6-1.14 2.08-2.34 4.28-2.34 4.58 0 5.42 3.01 5.42 6.92V23h-4.51v-7.1c0-1.7-.03-3.88-2.36-3.88-2.37 0-2.73 1.85-2.73 3.76V23H7.68V8.31Z",
  },
];
*/

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <HeroDecor />
        <div className="relative mx-auto w-full max-w-3xl px-4 pb-16 pt-12 text-center sm:px-6 sm:pb-28 sm:pt-20 lg:pb-32 lg:pt-24">
          <div className="animate-rise rise-1 mb-8 flex justify-center sm:mb-12">
            <Logo
              markClassName="size-8 sm:size-10"
              className="gap-2 text-[1.2rem] sm:gap-2.5 sm:text-[1.5rem]"
            />
          </div>
          <h1 className="animate-rise rise-2 text-[clamp(2.125rem,7.2vw,4.25rem)] font-medium leading-[1.12] tracking-[-0.04em] text-ink [text-wrap:balance] sm:leading-[1.09] sm:tracking-[-1.35px]">
            Know why your money
            <RotatingWord />
          </h1>

        <p className="animate-rise rise-3 mx-auto mt-7 max-w-lg text-[17px] font-medium leading-[1.53] tracking-[-0.013em] text-body [text-wrap:pretty]">
          Every morning, Finlio tells you in simple words why the stocks and
          mutual funds you own will go up or down today.
        </p>

        <div
          id="waitlist"
          className="animate-rise rise-4 mt-10 flex w-full scroll-mt-8 justify-center"
        >
          <WaitlistForm />
          </div>
        </div>
      </section>

      {/* About: this section does the explaining */}
      <section id="about" className="scroll-mt-8 bg-cream">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
          <div className="reveal-rise inline-flex max-w-full items-center gap-2.5 rounded-full bg-white py-1.5 pl-1.5 pr-4 ring-1 ring-line">
            <LogoMark className="size-7 shrink-0" />
            <span className="text-[14px] font-medium text-body">
              from the Finlio team
            </span>
          </div>

          <div className="mt-10 space-y-8 text-2xl font-medium leading-[1.3] tracking-[-0.022em] text-ink sm:text-3xl">
            <p className="reveal-line">
              <Words>Finlio started with one simple problem.</Words>
            </p>

            <div className="space-y-3">
              <p className="reveal-line">
                <Words>Your stocks sit in one app.</Words>
                <IconRow>
                  <AppIcon file="groww" label="Groww" />
                  <AppIcon file="kite" label="Zerodha Kite" />
                  <AppIcon file="upstox" label="Upstox" />
                  <AppIcon file="angelone" label="Angel One" />
                </IconRow>
              </p>
              <p className="reveal-line">
                <Words>Your mutual funds sit in another.</Words>
                <IconRow>
                  <AppIcon file="etmoney" label="ET Money" />
                  <AppIcon file="coin" label="Coin by Zerodha" />
                  <AppIcon file="paytmmoney" label="Paytm Money" />
                  <AppIcon file="kuvera" label="Kuvera" />
                </IconRow>
              </p>
              <p className="reveal-line">
                <Words>And the news is somewhere else.</Words>
                <IconRow>
                  <AppIcon file="moneycontrol" label="Moneycontrol" />
                  <AppIcon file="etmarkets" label="ET Markets" />
                  <AppIcon file="mint" label="Mint" />
                  <AppIcon file="et" label="The Economic Times" />
                </IconRow>
              </p>
            </div>

            <p className="reveal-line">
              <Words>
                One morning your money goes down. You do not know why. You open
                the news. You ask a friend. You are still confused.
              </Words>
            </p>

            <p className="reveal-line">
              <Words>
                So we built Finlio. It watches only the stocks and mutual funds
                that you own. Nothing else.
              </Words>
            </p>

            <p className="reveal-line">
              <Words>
                Before the market opens, you get one short message. It tells you
                what will move today, and why it will move. In easy words.
              </Words>
            </p>

            <p className="reveal-line">
              <Words>
                Like a friend who reads the market for you, and then explains it
                to you in plain English.
              </Words>
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="scroll-mt-8">
        <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-32">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-16">
            <div className="reveal-rise">
              <SectionLabel className="text-brand-orange">FAQs</SectionLabel>
              <h2 className="mt-3 text-[clamp(2rem,3.6vw,2.75rem)] font-medium leading-[1.09] tracking-[-1.35px] text-ink [text-wrap:balance]">
                Frequently asked questions
              </h2>
            </div>
            <div className="reveal-rise reveal-d1">
              <Faq />
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-cream">
        <div className="mx-auto w-full max-w-6xl px-6 py-24 sm:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <div className="reveal-rise">
              <SectionLabel className="text-brand-green">
                Early access
              </SectionLabel>
              <h2 className="mt-3 text-[clamp(2rem,3.6vw,2.75rem)] font-medium leading-[1.09] tracking-[-1.35px] text-ink [text-wrap:balance]">
                Stop guessing.
                <br />
                Start knowing.
              </h2>
              <p className="mt-5 max-w-md text-[17px] font-medium leading-[1.53] tracking-[-0.013em] text-body [text-wrap:pretty]">
                Join the waitlist and get your first morning message on the day
                we launch. Free, and in simple words.
              </p>
              {/* family.co closes with an accent text link rather than a
                  button. min-h keeps a 44px touch target despite the small
                  type, and the arrow slides on hover. */}
              <a
                href="#waitlist"
                className="group mt-6 inline-flex min-h-[44px] items-center gap-2 text-[17px] font-medium tracking-[-0.013em] text-brand-link transition-[color] hover:text-brand-blue"
              >
                Join the waitlist
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  className="size-[18px] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1"
                >
                  <path
                    d="M4 12h15M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>

            <div className="reveal-rise reveal-d1">
              <BriefCard />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-[auto_1fr_auto] sm:gap-16">
            <LogoMark className="size-7 shrink-0" />

            {/* Only real, working destinations live here. Product / Company /
                Legal columns can join once those pages exist. */}
            <nav>
              <h3 className="text-[15px] font-semibold text-ink">Finlio</h3>
              <ul className="mt-4 space-y-3 text-[15px]">
                {FOOTER_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-body/60 transition-[color] hover:text-ink"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Social links hidden until the accounts exist. To restore,
                uncomment SOCIALS above and map it here under the year. */}
            <div className="flex flex-col gap-5 sm:items-end">
              <p className="text-[15px] text-body/50">© 2026</p>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-3 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="flex items-center gap-2.5 text-[14px] font-medium text-body">
              <span className="animate-status-pulse size-2.5 rounded-full bg-brand-green" />
              Coming soon
            </p>
            <p className="text-[14px] text-body/50">
              Finlio shares news and information only. It is not investment
              advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
