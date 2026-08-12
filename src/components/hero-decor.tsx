import Image from "next/image";
import { appIcon } from "@/lib/ui";

/* Floating composition either side of the hero, in the spirit of family.co's
   illustrated hero. Ours is built from things that mean something for a money
   app: real broker app icons, price chips, a rupee coin and a rising line,
   scattered among soft shapes in the accent palette.

   Each piece scales in on load with its own delay, then drifts on its own
   loop. Everything stays inside the outer ~16% of the viewport so it can
   never crowd the centred headline, and the whole thing is hidden below xl
   where there is no room for it. */

type Motion = {
  /** Position utilities. */
  at: string;
  /** Resting angle, degrees. */
  tilt?: number;
  /** Entrance delay, seconds. */
  in?: number;
  /** Drift loop length and offset, seconds. */
  dur?: number;
  delay?: number;
  /** Drift distance; varying these stops the cluster moving as one block. */
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

/** Big soft shapes: they fade in but stay put, so nothing large wobbles. */
function Blob({ at, in: inDelay = 0 }: { at: string; in?: number }) {
  return (
    <div
      className={`animate-decor-in absolute rounded-full ${at}`}
      style={{ "--in": `${inDelay}s` } as React.CSSProperties}
    />
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
      className={`inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[13px] font-semibold tabular-nums shadow-[0_1px_2px_rgba(18,18,18,0.1),0_6px_14px_rgba(18,18,18,0.08)] ring-1 ring-line ${
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
    <span className="flex size-9 items-center justify-center rounded-full bg-brand-amber text-[15px] font-semibold text-[#7a5200] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(18,18,18,0.14),0_6px_14px_rgba(18,18,18,0.1)]">
      ₹
    </span>
  );
}

function ArrowUp() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-7 text-brand-green">
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

export function HeroDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden select-none xl:block"
    >
      {/* soft background shapes */}
      <Blob at="left-[2%] top-[14%] size-56 bg-cream" in={0.05} />
      <Blob at="right-[1%] top-[12%] size-60 bg-cream" in={0.1} />
      <Blob at="left-[8%] top-[60%] size-24 bg-sand" in={0.35} />
      <Blob at="right-[7%] top-[64%] size-20 bg-sand" in={0.4} />

      {/* left cluster */}
      <Float m={{ at: "left-[6%] top-[18%]", tilt: -8, in: 0.15, dur: 7, dy: "-13px" }}>
        <Icon file="groww" size="size-14" />
      </Float>
      <Float m={{ at: "left-[0.5%] top-[41%]", tilt: 4, in: 0.25, dur: 8, delay: 1.1, dx: "5px", dy: "-9px" }}>
        <Chip value="+1.2%" up />
      </Float>
      <Float m={{ at: "left-[9%] top-[47%]", tilt: -5, in: 0.3, dur: 6.4, delay: 0.5, dy: "-15px" }}>
        <Coin />
      </Float>
      <Float m={{ at: "left-[14%] top-[33%]", tilt: 6, in: 0.45, dur: 6.6, delay: 1.6, dx: "-6px" }}>
        <Icon file="upstox" size="size-10" />
      </Float>
      <Float m={{ at: "left-[2%] top-[69%]", tilt: 7, in: 0.4, dur: 7.5, delay: 1.8, dy: "-10px" }}>
        <Icon file="kite" size="size-11" />
      </Float>
      <Float m={{ at: "left-[12.5%] top-[64%]", tilt: -4, in: 0.55, dur: 7.8, delay: 0.9, dx: "4px" }}>
        <Icon file="angelone" size="size-9" />
      </Float>
      <Float m={{ at: "left-[5%] top-[81%]", tilt: -3, in: 0.6, dur: 8.4, delay: 0.3, dy: "-8px" }}>
        <Chip value="+2.1%" up />
      </Float>
      <Float m={{ at: "left-[15%] top-[16%]", in: 0.5, dur: 6.2, delay: 0.8, dy: "-9px" }}>
        <Dot className="size-3 bg-brand-blue" />
      </Float>
      <Float m={{ at: "left-[4%] top-[34%]", in: 0.6, dur: 7.1, delay: 1.4, dy: "-7px" }}>
        <Dot className="size-2.5 bg-brand-green" />
      </Float>
      <Float m={{ at: "left-[13.5%] top-[52%]", in: 0.7, dur: 6.8, delay: 0.6, dy: "-10px" }}>
        <Dot className="size-2 bg-brand-purple" />
      </Float>
      <Float m={{ at: "left-[11%] top-[27%]", tilt: 10, in: 0.65, dur: 7.6, delay: 1.2 }}>
        <Spark className="size-5 text-brand-amber" />
      </Float>
      <Float m={{ at: "left-[2.5%] top-[56%]", tilt: -12, in: 0.75, dur: 6.9, delay: 0.4 }}>
        <Spark className="size-4 text-brand-blue" />
      </Float>

      {/* right cluster */}
      <Float m={{ at: "right-[6%] top-[15%]", tilt: 7, in: 0.2, dur: 7.5, delay: 0.7, dy: "-14px" }}>
        <Icon file="etmoney" size="size-14" />
      </Float>
      <Float m={{ at: "right-[0.5%] top-[35%]", tilt: -5, in: 0.3, dur: 8, delay: 0.2, dx: "-5px", dy: "-9px" }}>
        <Chip value="−0.4%" up={false} />
      </Float>
      <Float m={{ at: "right-[13%] top-[26%]", in: 0.5, dur: 6.8, delay: 1.4, dy: "-11px" }}>
        <ArrowUp />
      </Float>
      <Float m={{ at: "right-[12%] top-[41%]", tilt: -6, in: 0.5, dur: 6.9, delay: 1.9, dx: "6px" }}>
        <Icon file="mint" size="size-10" />
      </Float>
      <Float m={{ at: "right-[4%] top-[51%]", tilt: 3, in: 0.6, dur: 8.2, delay: 1, dy: "-8px" }}>
        <Chip value="+0.9%" up />
      </Float>
      <Float m={{ at: "right-[2%] top-[64%]", tilt: -7, in: 0.45, dur: 7.2, delay: 1, dy: "-12px" }}>
        <Icon file="moneycontrol" size="size-11" />
      </Float>
      <Float m={{ at: "right-[14%] top-[57%]", tilt: 4, in: 0.7, dur: 7.9, delay: 0.5, dx: "-4px" }}>
        <Icon file="etmarkets" size="size-9" />
      </Float>
      <Float m={{ at: "right-[10.5%] top-[73%]", tilt: 5, in: 0.65, dur: 6.6, delay: 1.7 }}>
        <Icon file="kuvera" size="size-9" />
      </Float>
      <Float m={{ at: "right-[14.5%] top-[13%]", in: 0.55, dur: 6.4, delay: 1.1, dy: "-8px" }}>
        <Dot className="size-2.5 bg-brand-purple" />
      </Float>
      <Float m={{ at: "right-[9%] top-[33%]", in: 0.6, dur: 7.4, delay: 0.3, dy: "-10px" }}>
        <Dot className="size-3 bg-brand-orange" />
      </Float>
      <Float m={{ at: "right-[6%] top-[80%]", in: 0.8, dur: 7, delay: 1.5, dy: "-7px" }}>
        <Dot className="size-2 bg-brand-green" />
      </Float>
      <Float m={{ at: "right-[16%] top-[68%]", tilt: 14, in: 0.8, dur: 7.3, delay: 0.9 }}>
        <Spark className="size-4 text-brand-blue" />
      </Float>
      <Float m={{ at: "right-[3.5%] top-[27%]", tilt: -10, in: 0.75, dur: 6.7, delay: 1.6 }}>
        <Spark className="size-3.5 text-brand-green" />
      </Float>
    </div>
  );
}
