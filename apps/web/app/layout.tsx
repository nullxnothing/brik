import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { SITE_URL } from "../lib/site";
import "./globals.css";

/** Display only. A grotesque with real character, set tight and at 500 rather
 *  than bold, so headings read precise instead of loud. */
const grotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-grotesk",
  display: "swap",
});

/** Every run of text a visitor actually reads. A text face, not a display one. */
const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-text",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jbmono",
  display: "swap",
});

const OG_DESCRIPTION = "Build anything on Solana, in your browser.";
const ORGANIZATION_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.brik.builders/#organization",
  name: "Brik Builders LLC",
  legalName: "Brik Builders LLC",
  alternateName: "Brik",
  url: "https://www.brik.builders/",
  logo: "https://www.brik.builders/icon-512.png",
  email: "mailto:dylan@brik.builders",
  description:
    "A Colorado software company building browser-native development infrastructure for Solana.",
  sameAs: ["https://x.com/brikbuilders"],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Brik · Build anything on Solana, in your browser",
    template: "%s · Brik",
  },
  description:
    "From idea to a live Solana app in one tab. Describe it or pick a template. Brik builds, tests, and deploys it to devnet while you watch.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Brik",
    title: "Brik",
    description: OG_DESCRIPTION,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "Brik. Build anything on Solana, in your browser.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Brik",
    description: OG_DESCRIPTION,
    images: ["/og.png"],
  },
  other: {
    "twitter:site": "@brikbuilders",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0C0C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${grotesk.variable} ${interTight.variable} ${jbMono.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(ORGANIZATION_JSON_LD).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />
        {children}
      </body>
    </html>
  );
}
