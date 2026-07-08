"use client";

import type { ProductImage } from "@/lib/api/types";
import { normalizeMediaUrl } from "@/lib/media";
import Image from "next/image";
import { useState } from "react";

interface ProductGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const [active, setActive] = useState(0);
  const current = sorted[active];
  const mainSrc = normalizeMediaUrl(current?.image);

  if (!sorted.length) {
    return <div className="gallery-placeholder">No images available</div>;
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        {mainSrc ? (
          <Image
            src={mainSrc}
            alt={current.alt_text || productName}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : null}
      </div>
      {sorted.length > 1 ? (
        <div className="gallery-thumbs">
          {sorted.map((img, i) => {
            const thumbSrc = normalizeMediaUrl(img.image);
            return (
            <button
              key={img.id}
              type="button"
              className={`gallery-thumb ${i === active ? "active" : ""}`}
              onClick={() => setActive(i)}
            >
              {thumbSrc ? (
                <Image
                  src={thumbSrc}
                  alt={img.alt_text || `${productName} ${i + 1}`}
                  fill
                  sizes="80px"
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
