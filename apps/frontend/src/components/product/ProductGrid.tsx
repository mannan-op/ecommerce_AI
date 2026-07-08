import type { ProductList } from "@/lib/api/types";

import { ProductCard } from "./ProductCard";

interface ProductGridProps {
  products: ProductList[];
  emptyMessage?: string;
}

export function ProductGrid({
  products,
  emptyMessage = "No products found.",
}: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-surface-elevated/50 py-20 text-center">
        <p className="text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} index={i} />
      ))}
    </div>
  );
}
