"use client";

import { useEffect } from "react";

import { useCartStore } from "@/lib/cart/store";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const hydrateFromBackend = useCartStore((s) => s.hydrateFromBackend);

  useEffect(() => {
    const run = () => hydrateFromBackend();
    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(run, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(run, 250);
    return () => window.clearTimeout(id);
  }, [hydrateFromBackend]);

  return <>{children}</>;
}
