"use client";

import { motion } from "framer-motion";
import { ZoomIn } from "lucide-react";
import type { ProductImage } from "@/lib/api/types";
import { normalizeMediaUrl } from "@/lib/media";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);
  const current = sorted[active];
  const mainSrc = normalizeMediaUrl(current?.image);

  if (!sorted.length) {
    return (
      <div className="flex aspect-[3/4] items-center justify-center rounded-3xl bg-surface-elevated text-muted">
        No images available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        className={cn(
          "relative aspect-[3/4] overflow-hidden rounded-3xl bg-surface-elevated shadow-soft",
          zoom && "cursor-zoom-out"
        )}
        onClick={() => setZoom((z) => !z)}
        whileHover={{ scale: zoom ? 1 : 1.01 }}
      >
        {mainSrc ? (
          <Image
            src={mainSrc}
            alt={current.alt_text || productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={cn(
              "object-cover transition-transform duration-500",
              zoom && "scale-150"
            )}
            priority
          />
        ) : null}
        <button
          type="button"
          className="absolute right-4 top-4 rounded-full bg-surface/90 p-2 backdrop-blur-md"
          aria-label="Toggle zoom"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </motion.div>

      {sorted.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {sorted.map((img, i) => {
            const thumbSrc = normalizeMediaUrl(img.image);
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => {
                  setActive(i);
                  setZoom(false);
                }}
                className={cn(
                  "relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl border-2 transition-all",
                  i === active
                    ? "border-accent shadow-soft"
                    : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                {thumbSrc ? (
                  <Image
                    src={thumbSrc}
                    alt={img.alt_text || `${productName} ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
