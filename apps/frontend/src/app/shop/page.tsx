import type { Metadata } from "next";
import { Suspense } from "react";

import { ProductGrid } from "@/components/product/ProductGrid";
import { ProductFilters } from "@/components/search/ProductFilters";
import { Pagination } from "@/components/ui/Pagination";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Shop",
  description: "Search and filter our product catalog",
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
    // API unavailable — show empty shop with message below
  }

  const fabrics = ["cotton", "linen", "silk", "wool", "polyester", "lawn", "khaddar"];

  return (
    <div className="container page shop-page">
      <header className="page-header">
        <h1>Shop</h1>
        <p>{result.count} products found</p>
      </header>
      <div className="shop-layout">
        <Suspense fallback={<div className="filters-panel" />}>
          <ProductFilters
            categories={categories.map((c) => ({
              slug: c.slug,
              name: c.name,
            }))}
            fabrics={fabrics}
          />
        </Suspense>
        <div className="shop-results">
          {result.count === 0 && categories.length === 0 ? (
            <p className="notice">
              Could not load products. Make sure the API is running.
            </p>
          ) : null}
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
        </div>
      </div>
    </div>
  );
}
