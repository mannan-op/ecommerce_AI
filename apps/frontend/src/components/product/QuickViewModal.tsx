"use client";

import { useEffect, useState } from "react";

import { AddToCartSection } from "@/components/product/AddToCartButton";
import { ProductGallery } from "@/components/product/ProductGallery";
import { Modal } from "@/components/ui/Modal";
import { browserClient } from "@/lib/api/browser";
import type { ProductDetail } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";

interface QuickViewModalProps {
  slug: string;
  open: boolean;
  onClose: () => void;
}

export function QuickViewModal({ slug, open, onClose }: QuickViewModalProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    browserClient
      .get<ProductDetail>(`/proxy/catalog/products/${slug}/`)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Could not load product");
      })
      .finally(() => setLoading(false));
  }, [open, slug]);

  return (
    <Modal open={open} onClose={onClose} title={product?.name ?? "Quick view"} size="xl">
      {loading ? (
        <p className="text-center text-muted">Loading…</p>
      ) : error ? (
        <p className="text-center text-error">{error}</p>
      ) : product ? (
        <div className="grid gap-8 md:grid-cols-2">
          <ProductGallery images={product.images} productName={product.name} />
          <div className="space-y-4">
            <p className="text-sm text-muted">{product.description}</p>
            {product.min_price ? (
              <p className="text-2xl font-display">From ${product.min_price}</p>
            ) : null}
            <AddToCartSection product={product} />
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
