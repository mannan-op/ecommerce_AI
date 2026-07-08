import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/search/ProductFilters";
import { Reveal } from "@/components/motion/Reveal";
import { Pagination } from "@/components/ui/Pagination";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Shop all",
  description: "Browse our complete luxury fashion collection",
};

interface ShopPageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams;
  const page = Number(params.page ?? "1") || 1;

  let categories: Awaited<ReturnType<typeof serverApi.getCategories>> = [];
  let result: Awaited<ReturnType<typeof serverApi.getProducts>> = {
    count: 0,
    results: [],
    page: 1,
    totalPages: 1,
    next: null,
    previous: null,
  };

  try {
    categories = await serverApi.getCategories();
    result = await serverApi.getProducts({
      page,
      search: params.search,
      category: params.category,
      fabric: params.fabric,
      color: params.color,
      size: params.size,
      min_price: params.min_price,
      max_price: params.max_price,
      ordering: params.ordering,
    });
  } catch {
    // API unavailable
  }

  const fabrics = ["cotton", "linen", "silk", "wool", "polyester", "lawn", "khaddar"];

  return (
    <div className="container-luxury py-10 lg:py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Collection</p>
        <h1 className="heading-display mt-2 text-4xl lg:text-5xl">Shop all</h1>
        <p className="mt-2 text-muted">{result.count} pieces curated for you</p>
      </Reveal>

      <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr]">
        <Suspense fallback={<div className="h-96 rounded-3xl bg-surface-elevated" />}>
          <ProductFilters
            categories={categories.map((c) => ({
              slug: c.slug,
              name: c.name,
            }))}
            fabrics={fabrics}
          />
        </Suspense>

        <div>
          {result.count === 0 && categories.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border py-16 text-center text-muted">
              Could not load products. Make sure the API is running.
            </p>
          ) : (
            <>
              <ProductGrid
                products={result.results}
                emptyMessage="No products match your filters."
              />
              <Pagination
                page={result.page}
                totalPages={result.totalPages}
                basePath="/shop"
                searchParams={params}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
