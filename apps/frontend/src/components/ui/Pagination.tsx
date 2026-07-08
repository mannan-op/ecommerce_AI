"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams = {},
}: PaginationProps) {
  const currentParams = useSearchParams();

  function buildUrl(targetPage: number) {
    const params = new URLSearchParams(currentParams.toString());
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    if (targetPage > 1) params.set("page", String(targetPage));
    else params.delete("page");
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  }

  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) =>
      p === 1 ||
      p === totalPages ||
      (p >= page - 1 && p <= page + 1)
  );

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link
          href={buildUrl(page - 1)}
          className="rounded-2xl border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          Previous
        </Link>
      ) : null}
      {pages.map((p, i) => {
        const prev = pages[i - 1];
        const showEllipsis = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {showEllipsis ? (
              <span className="px-1 text-muted">…</span>
            ) : null}
            <Link
              href={buildUrl(p)}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl text-sm transition-all",
                p === page
                  ? "bg-primary text-background shadow-soft"
                  : "border border-border text-muted hover:border-accent hover:text-foreground"
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages ? (
        <Link
          href={buildUrl(page + 1)}
          className="rounded-2xl border border-border px-4 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-foreground"
        >
          Next
        </Link>
      ) : null}
    </nav>
  );
}
