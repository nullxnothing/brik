import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const display = localFont({
  src: "../fonts/fredoka.ttf",
  variable: "--font-display",
  weight: "300 700",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Brik — From idea to a live Solana app. In one tab.",
  description:
    "Describe it or pick a template — Brik builds, tests, and deploys it to devnet while you watch. No Rust, Anchor or Solana setup required.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={display.variable}>
      <body>{children}</body>
    </html>
  );
}
