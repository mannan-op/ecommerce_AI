import Image from "next/image";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { ProductList } from "@/lib/api/types";
import { normalizeMediaUrl } from "@/lib/media";

interface InstagramGalleryProps {
  products: ProductList[];
}

export function InstagramGallery({ products }: InstagramGalleryProps) {
  const items = products.filter((p) => p.primary_image).slice(0, 6);

  return (
    <section className="py-20">
      <div className="container-luxury">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">@maison.style</p>
          <h2 className="heading-display mt-2 text-4xl">From the gallery</h2>
        </Reveal>
        <Stagger className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {items.map((product) => {
            const src = normalizeMediaUrl(product.primary_image);
            return (
              <StaggerItem key={product.id}>
                <div className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-elevated">
                  {src ? (
                    <Image
                      src={src}
                      alt={product.name}
                      fill
                      sizes="200px"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-primary/0 transition-colors group-hover:bg-primary/30" />
                </div>
              </StaggerItem>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
