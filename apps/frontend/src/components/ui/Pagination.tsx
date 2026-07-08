"use client";

import Link from "next/link";

interface PaginationProps {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}

function buildUrl(
  basePath: string,
  searchParams: Record<string, string | undefined>,
  page: number
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  else params.delete("page");
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Pagination">
      {page > 1 ? (
        <Link
          href={buildUrl(basePath, searchParams, page - 1)}
          className="pagination-btn"
        >
          ← Previous
        </Link>
      ) : (
        <span className="pagination-btn disabled">← Previous</span>
      )}
      <span className="pagination-info">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={buildUrl(basePath, searchParams, page + 1)}
          className="pagination-btn"
        >
          Next →
        </Link>
      ) : (
        <span className="pagination-btn disabled">Next →</span>
      )}
    </nav>
  );
}
