"use client";

import { useEffect } from "react";

import { useCartStore } from "@/lib/cart/store";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const hydrateFromBackend = useCartStore((s) => s.hydrateFromBackend);

  useEffect(() => {
    hydrateFromBackend();
  }, [hydrateFromBackend]);

  return <>{children}</>;
}
