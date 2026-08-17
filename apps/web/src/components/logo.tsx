import Image from "next/image";

export function LogoMark({ className }: { className?: string }) {
  // The mark asset is opaque (white background baked in). `mix-blend-multiply`
  // drops that white against any light surface — white × backdrop = backdrop —
  // so it reads as bare on the header/footer without a visible box.
  return (
    <Image
      src="/finlion-mark.png"
      alt=""
      width={1024}
      height={1024}
      className={`mix-blend-multiply ${className ?? "size-8"}`}
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
      <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
        <LogoMark className="size-7 shrink-0" />
        <span className="text-base font-semibold tracking-tight text-ink">
          Finlio
        </span>
      </span>
    );
  }

  return (
    <span className={`inline-flex flex-col items-center gap-2 ${className ?? ""}`}>
      <LogoMark className="size-12 sm:size-14" />
      <span className="text-base font-semibold tracking-tight text-ink sm:text-lg">
        Finlio
      </span>
    </span>
  );
}
