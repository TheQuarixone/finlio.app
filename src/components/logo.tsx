import Image from "next/image";
import { appIcon } from "@/lib/ui";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.png"
      alt=""
      width={32}
      height={32}
      aria-hidden="true"
      className={`${appIcon} ${className ?? ""}`}
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
    <span
      className={`inline-flex flex-col items-center gap-2 ${className ?? ""}`}
    >
      <LogoMark className={markClassName ?? "size-7"} />
      <span className="text-lg font-semibold tracking-tight">Finlio</span>
    </span>
  );
}
