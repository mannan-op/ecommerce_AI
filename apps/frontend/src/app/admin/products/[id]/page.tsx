"use client";

import { useCallback, useEffect, useState } from "react";

import { ImageManager } from "@/components/admin/ImageManager";
import { ProductForm } from "@/components/admin/ProductForm";
import { VariantManager } from "@/components/admin/VariantManager";
import { adminApi } from "@/lib/api/admin";
import type { Category, ProductDetail } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [productId, setProductId] = useState("");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (id: string) => {
    setError("");
    try {
      const [productRes, categoriesRes] = await Promise.all([
        adminApi.products.get(id),
        adminApi.categories.list(),
      ]);
      setProduct(productRes.data);
      const cats = categoriesRes.data.results ?? [];
      setCategories(cats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load product");
    }
  }, []);

  useEffect(() => {
    params.then((p) => {
      setProductId(p.id);
      load(p.id);
    });
  }, [params, load]);

  async function handleSave(data: {
    name: string;
    slug: string;
    description: string;
    category: string;
    is_active: boolean;
  }) {
    if (!productId) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.products.update(productId, data);
      await load(productId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!product) {
    return (
      <div className="admin-page">
        {error ? <p className="error-message">{error}</p> : <p className="muted">Loading…</p>}
      </div>
    );
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>Edit product</h1>
        <p className="muted">{product.name}</p>
      </header>

      {error ? <p className="error-message">{error}</p> : null}

      <ProductForm
        categories={categories}
        initial={{
          name: product.name,
          slug: product.slug,
          description: product.description,
          category: product.category as string,
          is_active: product.is_active,
        }}
        onSubmit={handleSave}
        loading={saving}
      />

      <VariantManager
        productId={productId}
        variants={product.variants ?? []}
        onChange={() => load(productId)}
      />

      <ImageManager
        productId={productId}
        images={product.images ?? []}
        onChange={() => load(productId)}
      />
    </div>
  );
}
