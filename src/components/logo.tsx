import Image from "next/image";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/finlion-mark.png"
      alt=""
      width={1024}
      height={1024}
      className={className ?? "size-8"}
    />
  );
}

export function Logo({
  className,
  layout = "stacked",
}: {
  className?: string;
  layout?: "stacked" | "inline";
}) {
  if (layout === "inline") {
    return (
      <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
        <span
          className="flex size-8 shrink-0 items-center justify-center rounded-[9px] bg-white p-1.5 ring-1 ring-line/60"
        >
          <LogoMark className="size-full" />
        </span>
        <span className="text-base font-semibold tracking-tight text-ink">
          Finlio
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col items-center gap-2 ${className ?? ""}`}>
      <span
        className="flex size-[52px] items-center justify-center rounded-[14px] bg-white p-2 ring-1 ring-line/60 sm:size-[58px] sm:rounded-[16px] sm:p-2.5"
      >
        <LogoMark className="size-full" />
      </span>
      <span className="text-base font-semibold tracking-tight text-ink sm:text-lg">
        Finlio
      </span>
    </span>
  );
}
