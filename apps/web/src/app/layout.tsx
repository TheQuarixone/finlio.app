import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CookieBanner } from "@/components/cookie-banner";
import { Analytics } from "@/components/analytics";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const title = "Finlio: Know why your stocks and mutual funds go up or down";

/* Two lengths on purpose. Search results truncate around 150 to 160
   characters; social cards show roughly 125 and cut earlier again on mobile,
   so the share copy has to make its point in one line. */
const description =
  "One short message every market morning, explaining in simple words why the stocks and mutual funds you own may go up or down today. Join the waitlist.";
const socialDescription =
  "Know why your money moved. One plain-English message every market morning on the stocks and mutual funds you own.";

const siteUrl = "https://finlio.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s · Finlio",
  },
  description,
  applicationName: "Finlio",
  authors: [{ name: "Quarix" }],
  creator: "Quarix",
  publisher: "Quarix",
  category: "finance",
  keywords: [
    "stock news in simple words",
    "mutual fund news India",
    "why did my stock fall",
    "share market for beginners",
    "daily portfolio update",
    "personal finance app India",
    "morning market brief",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    title,
    description: socialDescription,
    url: siteUrl,
    type: "website",
    locale: "en_IN",
    siteName: "Finlio",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: socialDescription,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-clip">
        <Analytics />
        <SiteHeader />
        {/* The footer goes inside the smoother: anything rendered after the
            fixed smooth-wrapper would sit below the viewport, unreachable.
            Fixed-position chrome (the header, the consent banner) has to stay
            outside it, where the wrapper's transform cannot capture it. */}
        <SmoothScroll>
          {children}
          <SiteFooter />
        </SmoothScroll>
        <CookieBanner />
      </body>
    </html>
  );
}
