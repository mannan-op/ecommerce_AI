"use client";

import { usePathname } from "next/navigation";

import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { StoreNavbar } from "@/components/layout/StoreNavbar";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import type { Category } from "@/lib/api/types";

interface AppShellProps {
  children: React.ReactNode;
  categories?: Category[];
}

export function AppShell({ children, categories = [] }: AppShellProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <AuthProvider>
      {isAdmin ? (
        children
      ) : (
        <CartProvider>
          <AnnouncementBar />
          <StoreNavbar categories={categories} />
          <main className="min-h-screen">{children}</main>
          <StoreFooter />
        </CartProvider>
      )}
    </AuthProvider>
  );
}
