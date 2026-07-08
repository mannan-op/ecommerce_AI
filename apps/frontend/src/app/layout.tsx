import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { serverApi } from "@/lib/api/server";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MAISON — Luxury Fashion",
    template: "%s | MAISON",
  },
  description:
    "Premium Pakistani luxury fashion — curated collections, artisanal fabrics, and timeless design.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: Awaited<ReturnType<typeof serverApi.getCategories>> = [];
  try {
    categories = await serverApi.getCategories();
  } catch {
    // API offline
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${display.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <AppShell categories={categories}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
