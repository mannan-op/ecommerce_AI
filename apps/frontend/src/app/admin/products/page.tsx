"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminApi, type AdminProductListItem } from "@/lib/api/admin";
import { ApiError } from "@/lib/api/types";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await adminApi.products.list(
        query ? { search: query } : undefined
      );
      setProducts(data.results);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await adminApi.products.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <div className="admin-page">
      <header className="admin-page-header admin-page-header-row">
        <div>
          <h1>Products</h1>
          <p className="muted">{products.length} products</p>
        </div>
        <Link href="/admin/products/new">
          <Button>Add product</Button>
        </Link>
      </header>

      <form
        className="admin-search"
        onSubmit={(e) => {
          e.preventDefault();
          load(search);
        }}
      >
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name or SKU"
        />
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      {error ? <p className="error-message">{error}</p> : null}

      {loading ? (
        <p className="muted">Loading…</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Variants</th>
                <th>Images</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    <br />
                    <span className="muted">{product.slug}</span>
                  </td>
                  <td>{product.category_name}</td>
                  <td>{product.variant_count}</td>
                  <td>{product.image_count}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        product.is_active ? "status-confirmed" : "status-cancelled"
                      }`}
                    >
                      {product.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="admin-table-actions">
                    <Link href={`/admin/products/${product.id}`}>
                      <Button variant="secondary">Edit</Button>
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={() => handleDelete(product.id, product.name)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
