import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BRICK — From idea to a live Solana app. In one tab.",
  description:
    "Describe it or pick a template — BRICK builds, tests, and deploys it to devnet while you watch. No Rust, Anchor or Solana setup required.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
