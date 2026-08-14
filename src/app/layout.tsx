import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
const description =
  "Finlio sends you one short message every morning. It explains in simple words why the stocks and mutual funds you own may go up or down today. No share market language. Join the waitlist.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "stock news in simple words",
    "mutual fund news India",
    "why did my stock fall",
    "share market for beginners",
    "daily portfolio update",
  ],
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_IN",
    siteName: "Finlio",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
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
        {children}
      </body>
    </html>
  );
}
