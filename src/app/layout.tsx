import type { Metadata } from "next";
import "./globals.css";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://mottainai.sreekeshokky.in";

export const metadata: Metadata = {
  // ── Core ──────────────────────────────────────────────────────────────────
  title: {
    default: "Mottainai — Consider deeply before you acquire.",
    template: "%s | Mottainai",
  },
  description:
    "Mottainai (もったいない) is your mindful AI shopping companion. Chat with an honest AI friend before every purchase — spend wisely, save more, waste nothing.",
  keywords: [
    "mindful shopping",
    "impulse buying",
    "AI decision maker",
    "mottainai",
    "mindful spending",
    "buy or not",
    "purchasing decision",
    "minimalism",
    "Japanese philosophy",
  ],
  authors: [{ name: "Sreekesh Okky" }],
  creator: "Sreekesh Okky",

  // ── Canonical ─────────────────────────────────────────────────────────────
  metadataBase: new URL(APP_URL),
  alternates: {
    canonical: "/",
  },

  // ── Open Graph (WhatsApp, Facebook, LinkedIn, iMessage) ───────────────────
  openGraph: {
    type: "website",
    url: APP_URL,
    siteName: "Mottainai",
    title: "Mottainai — Consider deeply before you acquire.",
    description:
      "Chat with an honest AI before every purchase. Get a clear Spend / Save / Repair verdict in minutes. Your mindful shopping guide.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mottainai — Your mindful AI shopping companion",
        type: "image/png",
      },
    ],
    locale: "en_US",
  },

  // ── Twitter / X Card ──────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Mottainai — Consider deeply before you acquire.",
    description:
      "Chat with an honest AI before every purchase. Get a clear Spend / Save / Repair verdict in minutes.",
    images: ["/og-image.png"],
  },

  // ── Robots ────────────────────────────────────────────────────────────────
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

  // ── App / PWA hints ───────────────────────────────────────────────────────
  applicationName: "Mottainai",
  appleWebApp: {
    capable: true,
    title: "Mottainai",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* Theme colour for browser chrome (matches app dark bg) */}
        <meta name="theme-color" content="#0d1117" />
      </head>
      <body>{children}</body>
    </html>
  );
}
