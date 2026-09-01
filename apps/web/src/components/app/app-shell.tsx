"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChartPie, Flag, LayoutGrid, LogOut, Search, Settings,
  Sparkles, Wallet,
} from "lucide-react";

/**
 * The signed-in shell: a dark icon rail against a light workspace.
 *
 * The rail is icon-only by design — Finlio has five destinations, and labels
 * would cost horizontal space the dashboard's two-column layout needs. Each
 * item carries an accessible name and a title, so the affordance survives both
 * screen readers and a hover.
 */

/**
 * `soon` marks a destination that does not exist yet. It renders as a disabled
 * control rather than a link, because a nav item that 404s is worse than one
 * that says it isn't ready — the user learns the app is broken instead of
 * learning the feature is coming.
 */
const NAV = [
  { href: "/app", label: "Dashboard", icon: LayoutGrid },
  { href: "/app/holdings", label: "Holdings", icon: Wallet },
  { href: "/app/allocation", label: "Allocation", icon: ChartPie },
  { href: "/app/goals", label: "Goals", icon: Flag },
  { href: "/app/brief", label: "Morning brief", icon: Sparkles, soon: true },
] as const;

function Rail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Finlio"
      className="sticky top-0 hidden h-dvh w-[76px] shrink-0 flex-col items-center gap-2 bg-[#232322] py-6 sm:flex"
    >
      {/* The shipped logo mark uses mix-blend-multiply to sit on light surfaces,
          which erases it against the dark rail — a monogram is used here instead. */}
      <Link
        href="/"
        aria-label="Finlio home"
        className="mb-6 grid size-9 place-items-center rounded-xl bg-white text-base font-semibold text-[#232322]"
      >
        F
      </Link>

      {NAV.map((item) => {
        const Icon = item.icon;
        const soon = "soon" in item && item.soon;
        const active = pathname === item.href;

        if (soon) {
          return (
            <span
              key={item.href}
              title={`${item.label} — coming soon`}
              aria-label={`${item.label}, coming soon`}
              aria-disabled="true"
              className="relative grid size-11 cursor-not-allowed place-items-center rounded-xl text-white/25"
            >
              <Icon className="size-[19px]" strokeWidth={1.75} />
              <span
                aria-hidden
                className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-[var(--chart-5)]"
              />
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            aria-label={item.label}
            aria-current={active ? "page" : undefined}
            className={`relative grid size-11 place-items-center rounded-xl transition ${
              active
                ? "bg-white/10 text-white"
                : "text-white/45 hover:bg-white/5 hover:text-white/80"
            }`}
          >
            <Icon className="size-[19px]" strokeWidth={1.75} />
          </Link>
        );
      })}

      <div className="mt-auto flex flex-col items-center gap-2">
        <span
          title="Settings — coming soon"
          aria-label="Settings, coming soon"
          aria-disabled="true"
          className="grid size-11 cursor-not-allowed place-items-center rounded-xl text-white/25"
        >
          <Settings className="size-[19px]" strokeWidth={1.75} />
        </span>
        <Link
          href="/"
          title="Back to site"
          aria-label="Back to site"
          className="grid size-11 place-items-center rounded-xl text-white/45 transition hover:bg-white/5 hover:text-white/80"
        >
          <LogOut className="size-[19px]" strokeWidth={1.75} />
        </Link>
      </div>
    </nav>
  );
}

const TITLES: Record<string, { title: string; blurb: string }> = {
  "/app": { title: "Good morning", blurb: "Everything you own, minus everything you owe." },
  "/app/holdings": { title: "Holdings", blurb: "Every asset and liability you have entered." },
  "/app/allocation": { title: "Allocation", blurb: "Where your money actually sits." },
  "/app/goals": { title: "Goals", blurb: "What you are saving for, and whether the pace gets you there." },
};

function Header() {
  const pathname = usePathname();
  const { title, blurb } = TITLES[pathname] ?? TITLES["/app"]!;

  return (
    <header className="flex flex-wrap items-center gap-4 pb-8">
      <div className="min-w-0 flex-1">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          {title}
          {pathname === "/app" && <span aria-hidden>👋</span>}
        </h1>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">{blurb}</p>
      </div>

      <label className="order-last w-full sm:order-none sm:w-auto sm:flex-1 sm:max-w-sm">
        <span className="sr-only">Search your holdings</span>
        <span className="relative block">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="search"
            placeholder="Search holdings"
            className="h-11 w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </span>
      </label>

      <button
        type="button"
        className="flex h-11 items-center gap-2 rounded-full bg-[#232322] pl-2 pr-4 text-sm font-medium text-white transition hover:bg-[#343433]"
      >
        <span aria-hidden className="grid size-7 place-items-center rounded-full bg-white/15 text-xs">
          G
        </span>
        My account
      </button>
    </header>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#efedea] p-0 sm:p-4">
      <div className="flex min-h-dvh overflow-hidden bg-[#232322] sm:min-h-[calc(100dvh-2rem)] sm:rounded-[28px]">
        <Rail />
        <main className="min-w-0 flex-1 bg-secondary px-5 py-8 sm:rounded-[24px] sm:px-8">
          <Header />
          {children}
        </main>
      </div>
    </div>
  );
}
