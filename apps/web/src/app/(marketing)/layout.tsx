import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SmoothScroll } from "@/components/smooth-scroll";

/**
 * Chrome for the public site only.
 *
 * The header, footer, and scroll smoother used to live in the root layout,
 * which meant the signed-in app inherited a marketing nav and a "Join waitlist"
 * button. A route group keeps the URLs identical (`/`, `/privacy`, …) while
 * giving `/app` a completely different shell.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* The footer goes inside the smoother: anything rendered after the
          fixed smooth-wrapper would sit below the viewport, unreachable.
          Fixed-position chrome (the header, the consent banner) has to stay
          outside it, where the wrapper's transform cannot capture it. */}
      <SmoothScroll>
        {children}
        <SiteFooter />
      </SmoothScroll>
    </>
  );
}
