"use client";

import type { ProductVariant } from "@/lib/api/types";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface VariantSelectorProps {
  variants: ProductVariant[];
  onSelect: (variant: ProductVariant) => void;
}

export function VariantSelector({ variants, onSelect }: VariantSelectorProps) {
  const activeVariants = variants.filter((v) => v.is_active);
  const colors = useMemo(
    () => [...new Set(activeVariants.map((v) => v.color))],
    [activeVariants]
  );
  const [color, setColor] = useState(colors[0] ?? "");
  const [size, setSize] = useState("");

  const sizesForColor = useMemo(
    () =>
      activeVariants
        .filter((v) => v.color === color && v.size)
        .map((v) => v.size),
    [activeVariants, color]
  );

  const selected =
    activeVariants.find(
      (v) =>
        v.color === color && (sizesForColor.length === 0 || v.size === size || !size)
    ) ?? activeVariants.find((v) => v.color === color);

  if (!activeVariants.length) {
    return <p className="text-sm text-muted">This product is currently unavailable.</p>;
  }

  return (
    <div className="space-y-5">
      <div>
        <span className="text-xs font-medium uppercase tracking-wider text-muted">
          Color
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              className={cn(
                "rounded-2xl border px-4 py-2 text-sm capitalize transition-all",
                c === color
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border hover:border-accent/50"
              )}
              onClick={() => {
                setColor(c);
                setSize("");
                const match = activeVariants.find((v) => v.color === c);
                if (match) onSelect(match);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {sizesForColor.length > 0 ? (
        <div>
          <span className="text-xs font-medium uppercase tracking-wider text-muted">
            Size
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizesForColor.map((s) => (
              <button
                key={s}
                type="button"
                className={cn(
                  "min-w-[3rem] rounded-2xl border px-4 py-2 text-sm transition-all",
                  s === size
                    ? "border-primary bg-primary text-background"
                    : "border-border hover:border-accent/50"
                )}
                onClick={() => {
                  setSize(s);
                  const match = activeVariants.find(
                    (v) => v.color === color && v.size === s
                  );
                  if (match) onSelect(match);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {selected ? (
        <div className="flex items-center justify-between text-sm">
          <p className="text-2xl font-display">${selected.price}</p>
          <p className="text-muted">
            {selected.stock_quantity > 0 ? (
              <span className="text-success">{selected.stock_quantity} in stock</span>
            ) : (
              <span className="text-error">Out of stock</span>
            )}
          </p>
        </div>
      ) : null}
    </div>
  );
}
