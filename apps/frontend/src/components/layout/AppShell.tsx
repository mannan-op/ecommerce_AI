"use client";

import { usePathname } from "next/navigation";

import { Footer, Header } from "@/components/layout/Header";
import { CartProvider } from "@/components/providers/CartProvider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <CartProvider>
      <Header />
      <main className="main-content">{children}</main>
      <Footer />
    </CartProvider>
  );
}
