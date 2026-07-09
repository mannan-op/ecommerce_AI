import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";

import { AppShell } from "@/components/layout/AppShell";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { NavigationProgress } from "@/components/ui/NavigationProgress";
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
    default: "MAISON — Women's Luxury Fashion",
    template: "%s | MAISON",
  },
  description:
    "Premium Pakistani women's luxury fashion — curated lawn, silk, and artisanal pret collections.",
};

const getCachedCategories = unstable_cache(
  () => serverApi.getCategories(),
  ["catalog-categories"],
  { revalidate: 300 }
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let categories: Awaited<ReturnType<typeof serverApi.getCategories>> = [];
  try {
    categories = await getCachedCategories();
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
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          <AppShell categories={categories}>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
