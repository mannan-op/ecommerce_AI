"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface ProductFiltersProps {
  categories: Array<{ slug: string; name: string }>;
  fabrics?: string[];
}

export function ProductFilters({ categories, fabrics = [] }: ProductFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <aside className="filters-panel">
      <h2>Filters</h2>

      <label className="filter-group">
        <span>Search</span>
        <input
          type="search"
          className="field-input"
          placeholder="Search products…"
          defaultValue={searchParams.get("search") ?? ""}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              update("search", (e.target as HTMLInputElement).value);
            }
          }}
        />
      </label>

      <label className="filter-group">
        <span>Category</span>
        <select
          className="field-input"
          value={searchParams.get("category") ?? ""}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="filter-group">
        <span>Fabric</span>
        <select
          className="field-input"
          value={searchParams.get("fabric") ?? ""}
          onChange={(e) => update("fabric", e.target.value)}
        >
          <option value="">All fabrics</option>
          {fabrics.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </label>

      <div className="filter-row">
        <label className="filter-group">
          <span>Min price</span>
          <input
            type="number"
            className="field-input"
            min={0}
            placeholder="0"
            defaultValue={searchParams.get("min_price") ?? ""}
            onBlur={(e) => update("min_price", e.target.value)}
          />
        </label>
        <label className="filter-group">
          <span>Max price</span>
          <input
            type="number"
            className="field-input"
            min={0}
            placeholder="999"
            defaultValue={searchParams.get("max_price") ?? ""}
            onBlur={(e) => update("max_price", e.target.value)}
          />
        </label>
      </div>
    </aside>
  );
}
