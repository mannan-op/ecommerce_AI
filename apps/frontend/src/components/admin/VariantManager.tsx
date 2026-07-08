"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { adminApi } from "@/lib/api/admin";
import type { ProductVariant } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";

interface VariantManagerProps {
  productId: string;
  variants: ProductVariant[];
  onChange: () => void;
}

const emptyVariant = {
  sku: "",
  price: "",
  fabric_type: "",
  color: "",
  size: "",
  stock_quantity: "0",
};

export function VariantManager({
  productId,
  variants,
  onChange,
}: VariantManagerProps) {
  const [form, setForm] = useState(emptyVariant);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await adminApi.variants.create({
        product: productId,
        sku: form.sku,
        price: form.price,
        fabric_type: form.fabric_type,
        color: form.color,
        size: form.size,
        stock_quantity: Number(form.stock_quantity),
        is_active: true,
      });
      setForm(emptyVariant);
      onChange();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add variant");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this variant?")) return;
    try {
      await adminApi.variants.delete(id);
      onChange();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Delete failed");
    }
  }

  return (
    <section className="admin-section">
      <h2>Variants</h2>
      {variants.length === 0 ? (
        <p className="muted">No variants yet. Add at least one to sell this product.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Price</th>
                <th>Fabric</th>
                <th>Color</th>
                <th>Size</th>
                <th>Stock</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <tr key={v.id}>
                  <td>{v.sku}</td>
                  <td>${v.price}</td>
                  <td>{v.fabric_type || "—"}</td>
                  <td>{v.color}</td>
                  <td>{v.size || "—"}</td>
                  <td>{v.stock_quantity}</td>
                  <td>
                    <Button variant="ghost" onClick={() => handleDelete(v.id)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form className="admin-inline-form" onSubmit={handleAdd}>
        <h3>Add variant</h3>
        {error ? <p className="error-message">{error}</p> : null}
        <div className="admin-form-grid">
          <Input
            label="SKU"
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            required
          />
          <Input
            label="Price"
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
          <Input
            label="Fabric"
            value={form.fabric_type}
            onChange={(e) => setForm({ ...form, fabric_type: e.target.value })}
          />
          <Input
            label="Color"
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            required
          />
          <Input
            label="Size"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
          />
          <Input
            label="Stock"
            type="number"
            min="0"
            value={form.stock_quantity}
            onChange={(e) =>
              setForm({ ...form, stock_quantity: e.target.value })
            }
            required
          />
        </div>
        <Button type="submit" loading={loading}>
          Add variant
        </Button>
      </form>
    </section>
  );
}
