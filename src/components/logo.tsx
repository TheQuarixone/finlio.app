export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="32" height="32" rx="9" fill="currentColor" />
      {/* Rising chart line that ends in an arrowhead. */}
      <path
        d="M7 21.5 L13 15.5 L17 19 L24.5 11"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M24.5 11 L25 16.5 L20.5 12.5 Z" fill="white" />
    </svg>
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
