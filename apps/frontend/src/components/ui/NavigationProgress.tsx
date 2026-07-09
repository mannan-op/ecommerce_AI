"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Shows a top progress bar during client navigations.
 * Dev mode compiles routes on first visit (can take 10–30s) — this gives immediate feedback.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);

  useEffect(() => {
    setActive(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!anchor || anchor.getAttribute("target") === "_blank") return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;

      try {
        const url = new URL(href, window.location.origin);
        if (url.origin !== window.location.origin) return;
        const current = `${pathname}${searchParams.toString() ? `?${searchParams}` : ""}`;
        const next = `${url.pathname}${url.search}`;
        if (next !== current) setActive(true);
      } catch {
        // ignore invalid href
      }
    }

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [pathname, searchParams]);

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[300] h-0.5 overflow-hidden transition-opacity duration-300",
        active ? "opacity-100" : "opacity-0"
      )}
      aria-hidden={!active}
    >
      <div className="h-full w-full origin-left animate-navigation-progress bg-accent" />
    </div>
  );
}
