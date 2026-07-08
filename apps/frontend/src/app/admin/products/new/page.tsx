"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ProductForm } from "@/components/admin/ProductForm";
import { adminApi } from "@/lib/api/admin";
import type { Category } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    adminApi.categories
      .list()
      .then((res) => setCategories(res.data.results ?? res.data as unknown as Category[]))
      .catch(() => setError("Failed to load categories"));
  }, []);

  async function handleSubmit(data: {
    name: string;
    slug: string;
    description: string;
    category: string;
    is_active: boolean;
  }) {
    setLoading(true);
    setError("");
    try {
      const { data: product } = await adminApi.products.create(data);
      router.push(`/admin/products/${product.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create product");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header">
        <h1>New product</h1>
      </header>
      {error ? <p className="error-message">{error}</p> : null}
      <ProductForm categories={categories} onSubmit={handleSubmit} loading={loading} />
    </div>
  );
}
