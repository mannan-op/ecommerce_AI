"use client";

import type { ProductVariant } from "@/lib/api/types";
import { useMemo, useState } from "react";

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
    return <p className="notice">This product is currently unavailable.</p>;
  }

  return (
    <div className="variant-selector">
      <div className="variant-group">
        <span className="variant-label">Color</span>
        <div className="variant-options">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              className={`variant-chip ${c === color ? "active" : ""}`}
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
        <div className="variant-group">
          <span className="variant-label">Size</span>
          <div className="variant-options">
            {sizesForColor.map((s) => (
              <button
                key={s}
                type="button"
                className={`variant-chip ${s === size ? "active" : ""}`}
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
        <p className="variant-price">${selected.price}</p>
      ) : null}
    </div>
  );
}
