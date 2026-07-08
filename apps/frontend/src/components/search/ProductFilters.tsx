"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    <aside className="space-y-6 rounded-3xl border border-border bg-surface p-6 shadow-soft lg:sticky lg:top-28 lg:self-start">
      <h2 className="font-display text-xl">Filters</h2>

      <Input
        label="Search"
        type="search"
        placeholder="Search products…"
        defaultValue={searchParams.get("search") ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            update("search", (e.target as HTMLInputElement).value);
          }
        }}
      />

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted">
          Category
        </label>
        <select
          className="h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm focus:border-accent focus:outline-none"
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
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wider text-muted">
          Fabric
        </label>
        <select
          className="h-12 w-full rounded-2xl border border-border bg-surface-elevated px-4 text-sm focus:border-accent focus:outline-none"
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Min price"
          type="number"
          min={0}
          placeholder="0"
          defaultValue={searchParams.get("min_price") ?? ""}
          onBlur={(e) => update("min_price", e.target.value)}
        />
        <Input
          label="Max price"
          type="number"
          min={0}
          placeholder="999"
          defaultValue={searchParams.get("max_price") ?? ""}
          onBlur={(e) => update("max_price", e.target.value)}
        />
      </div>

      <Button
        variant="ghost"
        fullWidth
        onClick={() => router.push("/shop")}
      >
        Clear filters
      </Button>
    </aside>
  );
}
