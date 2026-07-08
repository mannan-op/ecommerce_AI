"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Category } from "@/lib/api/types";

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  category: string;
  is_active: boolean;
}

interface ProductFormProps {
  categories: Category[];
  initial?: Partial<ProductFormValues>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  loading?: boolean;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function ProductForm({
  categories,
  initial,
  onSubmit,
  loading,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormValues>({
    name: initial?.name ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    category: initial?.category ?? categories[0]?.id ?? "",
    is_active: initial?.is_active ?? true,
  });
  const [slugTouched, setSlugTouched] = useState(Boolean(initial?.slug));

  function updateName(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugTouched ? prev.slug : slugify(name),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit(form);
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <Input
        label="Name"
        value={form.name}
        onChange={(e) => updateName(e.target.value)}
        required
      />
      <Input
        label="Slug"
        value={form.slug}
        onChange={(e) => {
          setSlugTouched(true);
          setForm({ ...form, slug: e.target.value });
        }}
        required
      />
      <label className="input-field">
        <span className="input-label">Description</span>
        <textarea
          className="input-control"
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </label>
      <label className="input-field">
        <span className="input-label">Category</span>
        <select
          className="input-control"
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          required
        >
          <option value="">Select category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
        />
        Active (visible in store)
      </label>
      <Button type="submit" loading={loading}>
        Save product
      </Button>
    </form>
  );
}
