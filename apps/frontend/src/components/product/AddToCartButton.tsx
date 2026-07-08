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
    return <p className="notice">Out of stock</p>;
  }

  return (
    <div className="add-to-cart-section">
      <VariantSelector variants={product.variants} onSelect={setSelected} />
      <div className="qty-row">
        <label htmlFor="qty">Quantity</label>
        <input
          id="qty"
          type="number"
          min={1}
          max={selected?.stock_quantity ?? 99}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="qty-input"
        />
      </div>
      <Button
        onClick={handleAdd}
        loading={loading}
        disabled={!selected || (selected.stock_quantity ?? 0) < 1}
        fullWidth
      >
        {added ? "Added to cart ✓" : "Add to cart"}
      </Button>
    </div>
  );
}
