import Image from "next/image";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={32}
      height={32}
      aria-hidden="true"
      className={className}
    />
  );
}

export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className={markClassName ?? "size-7"} />
      <span className="text-lg font-semibold tracking-tight">finlio</span>
    </span>
  );
}
