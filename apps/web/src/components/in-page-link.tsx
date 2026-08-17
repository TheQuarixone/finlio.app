"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/* A link to a section of the landing page, from anywhere on the site.

   On the landing page it stays a bare `#hash`, which is what the smooth-scroll
   handler listens for, so the page glides to the section. From any other route
   (the legal pages) it becomes `/#hash`, which navigates home and lands on the
   section. One component so the header and footer cannot drift apart on this. */

export function InPageLink({
  hash,
  className,
  children,
  ...rest
}: {
  /** Section id, without the "#". */
  hash: string;
  className?: string;
  children: ReactNode;
} & Omit<React.ComponentPropsWithoutRef<"a">, "href" | "className" | "children">) {
  const onLanding = usePathname() === "/";

  return (
    <a href={onLanding ? `#${hash}` : `/#${hash}`} className={className} {...rest}>
      {children}
    </a>
  );
}
