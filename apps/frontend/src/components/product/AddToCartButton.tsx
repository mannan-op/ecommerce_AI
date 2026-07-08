"use client";

import type { ProductDetail, ProductVariant } from "@/lib/api/types";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { normalizeMediaUrl } from "@/lib/media";
import { useCartStore } from "@/lib/cart/store";

import { VariantSelector } from "./VariantSelector";

interface AddToCartSectionProps {
  product: ProductDetail;
}

export function AddToCartSection({ product }: AddToCartSectionProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [selected, setSelected] = useState<ProductVariant | null>(
    product.variants.find((v) => v.is_active) ?? null
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleAdd() {
    if (!selected) return;
    setLoading(true);
    try {
      await addItem(
        selected,
        { name: product.name, image: normalizeMediaUrl(product.primary_image) },
        quantity
      );
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (!product.variants.some((v) => v.is_active)) {
    return <p className="text-sm text-muted">Out of stock</p>;
  }

  return (
    <div className="space-y-6">
      <VariantSelector variants={product.variants} onSelect={setSelected} />
      <div className="flex items-center gap-4">
        <label htmlFor="qty" className="text-xs uppercase tracking-wider text-muted">
          Qty
        </label>
        <input
          id="qty"
          type="number"
          min={1}
          max={selected?.stock_quantity ?? 99}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="h-11 w-20 rounded-2xl border border-border bg-surface px-3 text-center text-sm focus:border-accent focus:outline-none"
        />
      </div>
      <Button
        variant="accent"
        size="lg"
        onClick={handleAdd}
        loading={loading}
        disabled={!selected || (selected.stock_quantity ?? 0) < 1}
        fullWidth
      >
        {added ? "Added to bag ✓" : "Add to bag"}
      </Button>
    </div>
  );
}
