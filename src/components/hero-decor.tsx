import Image from "next/image";
import { appIcon } from "@/lib/ui";

/* Floating composition either side of the hero, in the spirit of family.co's
   illustrated hero. Left and right halves scale from their outer edges so
   the cluster stays in the margins from phone to desktop without crowding the
   centred headline. */

type Motion = {
  at: string;
  tilt?: number;
  in?: number;
  dur?: number;
  delay?: number;
  dx?: string;
  dy?: string;
  hideMobile?: boolean;
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
    <div
      className={`animate-decor absolute ${m.at} ${m.hideMobile ? "hidden min-[480px]:block" : ""}`}
      style={vars(m)}
    >
      {children}
    </div>
  );
}

function Blob({
  at,
  in: inDelay = 0,
  hideMobile,
}: {
  at: string;
  in?: number;
  hideMobile?: boolean;
}) {
  return (
    <div
      className={`animate-decor-in absolute rounded-full ${at} ${hideMobile ? "hidden min-[480px]:block" : ""}`}
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
      className={`inline-flex items-center gap-0.5 rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold tabular-nums shadow-[0_1px_2px_rgba(18,18,18,0.1),0_6px_14px_rgba(18,18,18,0.08)] ring-1 ring-line min-[480px]:gap-1 min-[480px]:px-2.5 min-[480px]:py-1 min-[480px]:text-[13px] ${
        up ? "text-brand-green" : "text-brand-red"
      }`}
    >
      <svg
        viewBox="0 0 8 8"
        className={`size-1.5 fill-current min-[480px]:size-2 ${up ? "" : "rotate-180"}`}
      >
        <path d="M4 0 8 7H0Z" />
      </svg>
      {value}
    </span>
  );
}

function Coin() {
  return (
    <span className="flex size-7 items-center justify-center rounded-full bg-brand-amber text-[13px] font-semibold text-[#7a5200] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(18,18,18,0.14),0_6px_14px_rgba(18,18,18,0.1)] min-[480px]:size-9 min-[480px]:text-[15px]">
      ₹
    </span>
  );
}

function ArrowUp() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5 text-brand-green min-[480px]:size-7"
    >
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

const lane =
  "pointer-events-none absolute inset-y-0 w-[46%] max-w-[11rem] min-[480px]:max-w-none min-[480px]:w-[42%] sm:w-[38%] md:w-[34%] lg:w-[30%] xl:w-[26%]";

const scaleLeft =
  "origin-left scale-[0.62] min-[480px]:scale-[0.72] sm:scale-[0.82] md:scale-[0.9] lg:scale-[0.96] xl:scale-100";

const scaleRight =
  "origin-right scale-[0.62] min-[480px]:scale-[0.72] sm:scale-[0.82] md:scale-[0.9] lg:scale-[0.96] xl:scale-100";

const fade =
  "opacity-60 min-[480px]:opacity-75 sm:opacity-85 md:opacity-90 xl:opacity-100";

function LeftCluster() {
  return (
    <div className={`${lane} left-0 ${scaleLeft} ${fade}`}>
      <Blob at="left-[4%] top-[12%] size-24 bg-cream min-[480px]:size-40 xl:size-56" in={0.05} />
      <Blob
        at="left-[18%] top-[58%] size-12 bg-sand min-[480px]:size-20 xl:size-24"
        in={0.35}
        hideMobile
      />

      <Float m={{ at: "left-[2%] top-[14%]", tilt: -8, in: 0.15, dur: 7, dy: "-13px" }}>
        <Icon file="groww" size="size-9 min-[480px]:size-11 xl:size-14" />
      </Float>
      <Float
        m={{
          at: "left-[-2%] top-[38%]",
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
          at: "left-[14%] top-[44%]",
          tilt: -5,
          in: 0.3,
          dur: 6.4,
          delay: 0.5,
          dy: "-15px",
          hideMobile: true,
        }}
      >
        <Coin />
      </Float>
      <Float
        m={{
          at: "left-[24%] top-[30%]",
          tilt: 6,
          in: 0.45,
          dur: 6.6,
          delay: 1.6,
          dx: "-6px",
          hideMobile: true,
        }}
      >
        <Icon file="upstox" size="size-7 min-[480px]:size-9 xl:size-10" />
      </Float>
      <Float
        m={{
          at: "left-[-1%] top-[66%]",
          tilt: 7,
          in: 0.4,
          dur: 7.5,
          delay: 1.8,
          dy: "-10px",
        }}
      >
        <Icon file="kite" size="size-8 min-[480px]:size-10 xl:size-11" />
      </Float>
      <Float
        m={{
          at: "left-[22%] top-[62%]",
          tilt: -4,
          in: 0.55,
          dur: 7.8,
          delay: 0.9,
          dx: "4px",
          hideMobile: true,
        }}
      >
        <Icon file="angelone" size="size-6 min-[480px]:size-8 xl:size-9" />
      </Float>
      <Float
        m={{
          at: "left-[6%] top-[78%]",
          tilt: -3,
          in: 0.6,
          dur: 8.4,
          delay: 0.3,
          dy: "-8px",
          hideMobile: true,
        }}
      >
        <Chip value="+2.1%" up />
      </Float>
      <Float
        m={{
          at: "left-[26%] top-[12%]",
          in: 0.5,
          dur: 6.2,
          delay: 0.8,
          dy: "-9px",
          hideMobile: true,
        }}
      >
        <Dot className="size-2.5 bg-brand-blue min-[480px]:size-3" />
      </Float>
      <Float
        m={{
          at: "left-[8%] top-[30%]",
          in: 0.6,
          dur: 7.1,
          delay: 1.4,
          dy: "-7px",
          hideMobile: true,
        }}
      >
        <Dot className="size-2 bg-brand-green min-[480px]:size-2.5" />
      </Float>
      <Float
        m={{
          at: "left-[24%] top-[48%]",
          in: 0.7,
          dur: 6.8,
          delay: 0.6,
          dy: "-10px",
          hideMobile: true,
        }}
      >
        <Dot className="size-1.5 bg-brand-purple min-[480px]:size-2" />
      </Float>
      <Float
        m={{
          at: "left-[20%] top-[24%]",
          tilt: 10,
          in: 0.65,
          dur: 7.6,
          delay: 1.2,
          hideMobile: true,
        }}
      >
        <Spark className="size-4 text-brand-amber min-[480px]:size-5" />
      </Float>
      <Float
        m={{
          at: "left-[4%] top-[52%]",
          tilt: -12,
          in: 0.75,
          dur: 6.9,
          delay: 0.4,
          hideMobile: true,
        }}
      >
        <Spark className="size-3 text-brand-blue min-[480px]:size-4" />
      </Float>
    </div>
  );
}

function RightCluster() {
  return (
    <div className={`${lane} right-0 ${scaleRight} ${fade}`}>
      <Blob at="right-[4%] top-[10%] size-24 bg-cream min-[480px]:size-44 xl:size-60" in={0.1} />
      <Blob
        at="right-[18%] top-[60%] size-12 bg-sand min-[480px]:size-20 xl:size-20"
        in={0.4}
        hideMobile
      />

      <Float
        m={{
          at: "right-[2%] top-[13%]",
          tilt: 7,
          in: 0.2,
          dur: 7.5,
          delay: 0.7,
          dy: "-14px",
        }}
      >
        <Icon file="etmoney" size="size-9 min-[480px]:size-11 xl:size-14" />
      </Float>
      <Float
        m={{
          at: "right-[-2%] top-[32%]",
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
          at: "right-[24%] top-[24%]",
          in: 0.5,
          dur: 6.8,
          delay: 1.4,
          dy: "-11px",
          hideMobile: true,
        }}
      >
        <ArrowUp />
      </Float>
      <Float
        m={{
          at: "right-[22%] top-[38%]",
          tilt: -6,
          in: 0.5,
          dur: 6.9,
          delay: 1.9,
          dx: "6px",
          hideMobile: true,
        }}
      >
        <Icon file="mint" size="size-7 min-[480px]:size-9 xl:size-10" />
      </Float>
      <Float
        m={{
          at: "right-[6%] top-[48%]",
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
          at: "right-[-1%] top-[60%]",
          tilt: -7,
          in: 0.45,
          dur: 7.2,
          delay: 1,
          dy: "-12px",
        }}
      >
        <Icon file="moneycontrol" size="size-8 min-[480px]:size-10 xl:size-11" />
      </Float>
      <Float
        m={{
          at: "right-[26%] top-[54%]",
          tilt: 4,
          in: 0.7,
          dur: 7.9,
          delay: 0.5,
          dx: "-4px",
          hideMobile: true,
        }}
      >
        <Icon file="etmarkets" size="size-6 min-[480px]:size-8 xl:size-9" />
      </Float>
      <Float
        m={{
          at: "right-[18%] top-[70%]",
          tilt: 5,
          in: 0.65,
          dur: 6.6,
          delay: 1.7,
          hideMobile: true,
        }}
      >
        <Icon file="kuvera" size="size-6 min-[480px]:size-8 xl:size-9" />
      </Float>
      <Float
        m={{
          at: "right-[28%] top-[10%]",
          in: 0.55,
          dur: 6.4,
          delay: 1.1,
          dy: "-8px",
          hideMobile: true,
        }}
      >
        <Dot className="size-2 bg-brand-purple min-[480px]:size-2.5" />
      </Float>
      <Float
        m={{
          at: "right-[16%] top-[30%]",
          in: 0.6,
          dur: 7.4,
          delay: 0.3,
          dy: "-10px",
          hideMobile: true,
        }}
      >
        <Dot className="size-2.5 bg-brand-orange min-[480px]:size-3" />
      </Float>
      <Float
        m={{
          at: "right-[10%] top-[76%]",
          in: 0.8,
          dur: 7,
          delay: 1.5,
          dy: "-7px",
          hideMobile: true,
        }}
      >
        <Dot className="size-1.5 bg-brand-green min-[480px]:size-2" />
      </Float>
      <Float
        m={{
          at: "right-[30%] top-[64%]",
          tilt: 14,
          in: 0.8,
          dur: 7.3,
          delay: 0.9,
          hideMobile: true,
        }}
      >
        <Spark className="size-3 text-brand-blue min-[480px]:size-4" />
      </Float>
      <Float
        m={{
          at: "right-[4%] top-[24%]",
          tilt: -10,
          in: 0.75,
          dur: 6.7,
          delay: 1.6,
          hideMobile: true,
        }}
      >
        <Spark className="size-3 text-brand-green min-[480px]:size-3.5" />
      </Float>
    </div>
  );
}

export function HeroDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 select-none">
      <LeftCluster />
      <RightCluster />
    </div>
  );
}
