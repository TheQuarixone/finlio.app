import Image from "next/image";
import { appIcon } from "@/lib/ui";

/* Floating side composition — visible on tablet, laptop, and large screens
   only (md+). Hidden on phones so the hero stays clean on small devices. */

type Motion = {
  at: string;
  tilt?: number;
  in?: number;
  dur?: number;
  delay?: number;
  dx?: string;
  dy?: string;
};

function vars(m: Motion): React.CSSProperties {
  return {
    "--tilt": `${m.tilt ?? 0}deg`,
    "--in": `${m.in ?? 0}s`,
    "--dur": `${m.dur ?? 7}s`,
    "--delay": `${m.delay ?? 0}s`,
    "--dx": m.dx ?? "0px",
    "--dy": m.dy ?? "-12px",
  } as React.CSSProperties;
}

function Float({ m, children }: { m: Motion; children: React.ReactNode }) {
  return (
    <div className={`animate-decor absolute ${m.at}`} style={vars(m)}>
      {children}
    </div>
  );
}

function Blob({ at, in: inDelay = 0 }: { at: string; in?: number }) {
  return (
    <div
      className={`animate-decor-in absolute rounded-full ${at}`}
      style={{ "--in": `${inDelay}s` } as React.CSSProperties}
    >
      {/* Flare so the disc doesn't read as empty: faint concentric ripples and a
          soft top-lit highlight give it depth and energy. */}
      <span className="absolute inset-[9%] rounded-full ring-1 ring-black/[0.04]" />
      <span className="absolute inset-[25%] rounded-full ring-1 ring-black/[0.03]" />
      <span className="absolute inset-[43%] rounded-full ring-1 ring-black/[0.025]" />
      <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.6),transparent_55%)]" />
    </div>
  );
}

function Icon({ file, size }: { file: string; size: string }) {
  return (
    <Image
      src={`/logos/${file}.png`}
      alt=""
      width={96}
      height={96}
      className={`${size} ${appIcon}`}
    />
  );
}

function Chip({ value, up }: { value: string; up: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[12px] font-semibold tabular-nums ring-1 ring-line lg:text-[13px] ${
        up ? "text-brand-green" : "text-brand-red"
      }`}
    >
      <svg
        viewBox="0 0 8 8"
        className={`size-2 fill-current ${up ? "" : "rotate-180"}`}
      >
        <path d="M4 0 8 7H0Z" />
      </svg>
      {value}
    </span>
  );
}

function Coin() {
  return (
    <span className="flex size-8 items-center justify-center rounded-full bg-brand-amber text-[14px] font-semibold text-[#7a5200] ring-1 ring-black/5 lg:size-9 lg:text-[15px]">
      ₹
    </span>
  );
}

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-6 text-brand-green lg:size-7">
      <path
        d="M4 17 9.5 11.5 13 15 20 7"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15 7h5v5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Dot({ className }: { className: string }) {
  return <span className={`block rounded-full ${className}`} />;
}

function Spark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 0c.6 6.3 5.7 11.4 12 12-6.3.6-11.4 5.7-12 12-.6-6.3-5.7-11.4-12-12C6.3 11.4 11.4 6.3 12 0Z" />
    </svg>
  );
}

/* The morning alert — the app pings you before the market opens. */
function Bell() {
  return (
    <span className="flex size-9 items-center justify-center rounded-2xl bg-white ring-1 ring-line lg:size-11">
      <svg viewBox="0 0 24 24" fill="none" className="size-5 text-brand-orange lg:size-6">
        <path
          d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  );
}

/* A stand-in for the plain-words morning message itself. */
function MiniBrief() {
  return (
    <span className="flex flex-col gap-1.5 rounded-xl bg-white px-2.5 py-2.5 ring-1 ring-line">
      <span className="flex items-center gap-1.5">
        <span className="size-1.5 rounded-full bg-brand-green" />
        <span className="h-1.5 w-9 rounded-full bg-ink/20" />
      </span>
      <span className="h-1.5 w-12 rounded-full bg-ink/12" />
      <span className="h-1.5 w-7 rounded-full bg-ink/10" />
    </span>
  );
}

const iconLg = "size-11 lg:size-14";
const iconMd = "size-9 lg:size-11";
const iconSm = "size-8 lg:size-10";
const iconXs = "size-7 lg:size-9";

const sideScale = "origin-top scale-[0.82] lg:scale-[0.92] xl:scale-100";

function LeftCluster() {
  return (
    <div
      className={`absolute bottom-0 left-0 top-24 w-full ${sideScale} origin-top-left`}
    >
      <Blob at="left-[2%] top-[14%] size-48 bg-cream lg:size-56" in={0.05} />
      <Blob at="left-[8%] top-[60%] size-20 bg-sand lg:size-24" in={0.35} />

      <Float
        m={{
          at: "left-[6%] top-[18%]",
          tilt: -8,
          in: 0.15,
          dur: 7,
          dy: "-13px",
        }}
      >
        <Icon file="groww" size={iconLg} />
      </Float>
      <Float
        m={{
          at: "left-[0.5%] top-[41%]",
          tilt: 4,
          in: 0.25,
          dur: 8,
          delay: 1.1,
          dx: "5px",
          dy: "-9px",
        }}
      >
        <Chip value="+1.2%" up />
      </Float>
      <Float
        m={{
          at: "left-[9%] top-[47%]",
          tilt: -5,
          in: 0.3,
          dur: 6.4,
          delay: 0.5,
          dy: "-15px",
        }}
      >
        <Coin />
      </Float>
      <Float
        m={{
          at: "left-[14%] top-[33%]",
          tilt: 6,
          in: 0.45,
          dur: 6.6,
          delay: 1.6,
          dx: "-6px",
        }}
      >
        <Icon file="upstox" size={iconSm} />
      </Float>
      <Float
        m={{
          at: "left-[2%] top-[69%]",
          tilt: 7,
          in: 0.4,
          dur: 7.5,
          delay: 1.8,
          dy: "-10px",
        }}
      >
        <Icon file="kite" size={iconMd} />
      </Float>
      <Float
        m={{
          at: "left-[12.5%] top-[64%]",
          tilt: -4,
          in: 0.55,
          dur: 7.8,
          delay: 0.9,
          dx: "4px",
        }}
      >
        <Icon file="angelone" size={iconXs} />
      </Float>
      <Float
        m={{
          at: "left-[5%] top-[81%]",
          tilt: -3,
          in: 0.6,
          dur: 8.4,
          delay: 0.3,
          dy: "-8px",
        }}
      >
        <Chip value="+2.1%" up />
      </Float>
      <Float
        m={{
          at: "left-[15%] top-[16%]",
          in: 0.5,
          dur: 6.2,
          delay: 0.8,
          dy: "-9px",
        }}
      >
        <Dot className="size-3 bg-brand-blue" />
      </Float>
      <Float
        m={{
          at: "left-[4%] top-[34%]",
          in: 0.6,
          dur: 7.1,
          delay: 1.4,
          dy: "-7px",
        }}
      >
        <Dot className="size-2.5 bg-brand-green" />
      </Float>
      <Float
        m={{
          at: "left-[13.5%] top-[52%]",
          in: 0.7,
          dur: 6.8,
          delay: 0.6,
          dy: "-10px",
        }}
      >
        <Dot className="size-2 bg-brand-purple" />
      </Float>
      <Float
        m={{
          at: "left-[11%] top-[27%]",
          tilt: 10,
          in: 0.65,
          dur: 7.6,
          delay: 1.2,
        }}
      >
        <Spark className="size-4 text-brand-amber lg:size-5" />
      </Float>
      <Float
        m={{
          at: "left-[2.5%] top-[56%]",
          tilt: -12,
          in: 0.75,
          dur: 6.9,
          delay: 0.4,
        }}
      >
        <Spark className="size-3.5 text-brand-blue lg:size-4" />
      </Float>
      <Float
        m={{ at: "left-[0.5%] top-[24%]", tilt: -6, in: 0.5, dur: 7.7, delay: 1.3, dy: "-11px" }}
      >
        <Bell />
      </Float>
      <Float
        m={{ at: "left-[14.5%] top-[78%]", tilt: 5, in: 0.7, dur: 7.2, delay: 0.7, dx: "-4px" }}
      >
        <Icon file="paytmmoney" size={iconMd} />
      </Float>
      <Float
        m={{ at: "left-[16%] top-[45%]", tilt: -4, in: 0.6, dur: 6.7, delay: 1.5 }}
      >
        <Icon file="et" size={iconXs} />
      </Float>
    </div>
  );
}

function RightCluster() {
  return (
    <div
      className={`absolute bottom-0 right-0 top-24 w-full ${sideScale} origin-top-right`}
    >
      <Blob at="right-[1%] top-[12%] size-52 bg-cream lg:size-60" in={0.1} />
      <Blob at="right-[7%] top-[64%] size-16 bg-sand lg:size-20" in={0.4} />

      <Float
        m={{
          at: "right-[6%] top-[15%]",
          tilt: 7,
          in: 0.2,
          dur: 7.5,
          delay: 0.7,
          dy: "-14px",
        }}
      >
        <Icon file="etmoney" size={iconLg} />
      </Float>
      <Float
        m={{
          at: "right-[0.5%] top-[35%]",
          tilt: -5,
          in: 0.3,
          dur: 8,
          delay: 0.2,
          dx: "-5px",
          dy: "-9px",
        }}
      >
        <Chip value="−0.4%" up={false} />
      </Float>
      <Float
        m={{
          at: "right-[13%] top-[26%]",
          in: 0.5,
          dur: 6.8,
          delay: 1.4,
          dy: "-11px",
        }}
      >
        <ArrowUp />
      </Float>
      <Float
        m={{
          at: "right-[12%] top-[41%]",
          tilt: -6,
          in: 0.5,
          dur: 6.9,
          delay: 1.9,
          dx: "6px",
        }}
      >
        <Icon file="mint" size={iconSm} />
      </Float>
      <Float
        m={{
          at: "right-[4%] top-[51%]",
          tilt: 3,
          in: 0.6,
          dur: 8.2,
          delay: 1,
          dy: "-8px",
        }}
      >
        <Chip value="+0.9%" up />
      </Float>
      <Float
        m={{
          at: "right-[2%] top-[64%]",
          tilt: -7,
          in: 0.45,
          dur: 7.2,
          delay: 1,
          dy: "-12px",
        }}
      >
        <Icon file="moneycontrol" size={iconMd} />
      </Float>
      <Float
        m={{
          at: "right-[14%] top-[57%]",
          tilt: 4,
          in: 0.7,
          dur: 7.9,
          delay: 0.5,
          dx: "-4px",
        }}
      >
        <Icon file="etmarkets" size={iconMd} />
      </Float>
      <Float
        m={{
          at: "right-[10.5%] top-[73%]",
          tilt: 5,
          in: 0.65,
          dur: 6.6,
          delay: 1.7,
        }}
      >
        <Icon file="kuvera" size={iconMd} />
      </Float>
      <Float
        m={{
          at: "right-[14.5%] top-[13%]",
          in: 0.55,
          dur: 6.4,
          delay: 1.1,
          dy: "-8px",
        }}
      >
        <Dot className="size-2.5 bg-brand-purple" />
      </Float>
      <Float
        m={{
          at: "right-[9%] top-[33%]",
          in: 0.6,
          dur: 7.4,
          delay: 0.3,
          dy: "-10px",
        }}
      >
        <Dot className="size-3 bg-brand-orange" />
      </Float>
      <Float
        m={{
          at: "right-[6%] top-[80%]",
          in: 0.8,
          dur: 7,
          delay: 1.5,
          dy: "-7px",
        }}
      >
        <Dot className="size-2 bg-brand-green" />
      </Float>
      <Float
        m={{
          at: "right-[16%] top-[68%]",
          tilt: 14,
          in: 0.8,
          dur: 7.3,
          delay: 0.9,
        }}
      >
        <Spark className="size-3.5 text-brand-blue lg:size-4" />
      </Float>
      <Float
        m={{
          at: "right-[3.5%] top-[27%]",
          tilt: -10,
          in: 0.75,
          dur: 6.7,
          delay: 1.6,
        }}
      >
        <Spark className="size-3 text-brand-green lg:size-3.5" />
      </Float>
      <Float
        m={{ at: "right-[15.5%] top-[46%]", tilt: 5, in: 0.55, dur: 7.6, delay: 0.8, dx: "-4px" }}
      >
        <Icon file="coin" size={iconSm} />
      </Float>
      <Float
        m={{ at: "right-[13%] top-[85%]", tilt: -5, in: 0.75, dur: 7.4, delay: 1.2, dy: "-9px" }}
      >
        <MiniBrief />
      </Float>
      <Float
        m={{ at: "right-[3%] top-[44%]", tilt: 7, in: 0.65, dur: 6.9, delay: 1.4 }}
      >
        <Icon file="et" size={iconXs} />
      </Float>
    </div>
  );
}

export function HeroDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden select-none overflow-hidden md:block"
    >
      <LeftCluster />
      <RightCluster />
    </div>
  );
}

/* Phones can't take the edge clusters — they'd sit under the centred text — so
   they get their own self-contained floating strip. It lives in the flow of the
   hero, below the form, inside its own box, so nothing overlaps the headline and
   the same playful finance-app language reaches small screens. Hidden at md+
   where the full side clusters take over. */
export function HeroDecorMobile() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto mt-14 h-44 w-full max-w-sm select-none md:hidden"
    >
      <div className="absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cream" />
      <Blob at="left-[6%] top-[46%] size-20 bg-sand" in={0.2} />
      <Blob at="right-[8%] top-[8%] size-16 bg-sand" in={0.3} />

      <Float m={{ at: "left-[4%] top-[16%]", tilt: -8, in: 0.15, dur: 7, dy: "-10px" }}>
        <Icon file="groww" size="size-11" />
      </Float>
      <Float m={{ at: "left-[34%] top-[2%]", tilt: 5, in: 0.25, dur: 7.6, delay: 0.6, dy: "-8px" }}>
        <Icon file="etmoney" size="size-10" />
      </Float>
      <Float m={{ at: "right-[5%] top-[14%]", tilt: 6, in: 0.3, dur: 6.8, delay: 1.1, dy: "-11px" }}>
        <Icon file="mint" size="size-9" />
      </Float>
      <Float m={{ at: "left-[21%] top-[54%]", tilt: 7, in: 0.4, dur: 7.4, delay: 0.9, dy: "-9px" }}>
        <Icon file="kite" size="size-10" />
      </Float>
      <Float m={{ at: "right-[20%] top-[52%]", tilt: -5, in: 0.5, dur: 8, delay: 0.4, dy: "-8px" }}>
        <Icon file="moneycontrol" size="size-9" />
      </Float>

      <Float m={{ at: "left-[0%] top-[62%]", tilt: -4, in: 0.35, dur: 8.2, delay: 0.3, dy: "-7px" }}>
        <Chip value="+1.2%" up />
      </Float>
      <Float m={{ at: "right-[0%] top-[34%]", tilt: 5, in: 0.55, dur: 7, delay: 1.3, dy: "-8px" }}>
        <Chip value="−0.4%" up={false} />
      </Float>
      <Float m={{ at: "left-[52%] top-[62%]", in: 0.6, dur: 6.6, delay: 1.6, dy: "-9px" }}>
        <Coin />
      </Float>

      <Float m={{ at: "left-[46%] top-[30%]", in: 0.5, dur: 6.4, delay: 0.8, dy: "-8px" }}>
        <Dot className="size-2.5 bg-brand-blue" />
      </Float>
      <Float m={{ at: "right-[34%] top-[76%]", in: 0.7, dur: 7.1, delay: 0.5, dy: "-7px" }}>
        <Dot className="size-2 bg-brand-purple" />
      </Float>
      <Float m={{ at: "left-[12%] top-[32%]", tilt: 10, in: 0.65, dur: 7.6, delay: 1.2 }}>
        <Spark className="size-4 text-brand-amber" />
      </Float>
    </div>
  );
}
