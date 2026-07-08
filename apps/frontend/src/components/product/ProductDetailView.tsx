"use client";

import { useEffect } from "react";
import { Heart, Star, Truck } from "lucide-react";

import { AddToCartSection } from "@/components/product/AddToCartButton";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Reveal } from "@/components/motion/Reveal";
import type { ProductDetail, ProductList } from "@/lib/api/types";
import { productRating } from "@/lib/utils";
import { useRecentlyViewedStore } from "@/lib/recently-viewed/store";
import { useWishlistStore } from "@/lib/wishlist/store";

interface ProductDetailViewProps {
  product: ProductDetail;
  related: ProductList[];
}

export function ProductDetailView({ product, related }: ProductDetailViewProps) {
  const addRecent = useRecentlyViewedStore((s) => s.add);
  const recentItems = useRecentlyViewedStore((s) => s.items);
  const { has, toggle } = useWishlistStore();
  const { score, count } = productRating(product.id);

  useEffect(() => {
    addRecent({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      category: product.category as string,
      is_active: product.is_active,
      min_price: product.min_price,
      primary_image: product.primary_image,
      created_at: product.created_at,
      updated_at: product.updated_at,
    });
  }, [product, addRecent]);

  const recentlyViewed = recentItems.filter((p) => p.id !== product.id).slice(0, 4);

  return (
    <div className="container-luxury py-8 lg:py-12">
      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <ProductGallery images={product.images} productName={product.name} />
        </Reveal>

        <Reveal delay={0.1} direction="right">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge variant="accent">In collection</Badge>
                <h1 className="heading-display mt-3 text-4xl lg:text-5xl">
                  {product.name}
                </h1>
              </div>
              <button
                type="button"
                onClick={() => toggle(product.id)}
                className="rounded-full border border-border p-3 transition-colors hover:border-accent"
                aria-label="Wishlist"
              >
                <Heart
                  className={`h-5 w-5 ${has(product.id) ? "fill-error text-error" : ""}`}
                />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-2 text-accent">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(score) ? "fill-current" : "opacity-30"}`}
                />
              ))}
              <span className="text-sm text-muted">
                {score} ({count} reviews)
              </span>
            </div>

            {product.min_price ? (
              <p className="mt-6 text-3xl font-display tracking-wide">
                From ${product.min_price}
              </p>
            ) : null}

            <p className="mt-4 leading-relaxed text-muted">{product.description}</p>

            <div className="mt-6 flex items-center gap-2 text-sm text-muted">
              <Truck className="h-4 w-4 text-accent" />
              Free shipping on orders over $75 · Est. 5 days
            </div>

            <div className="mt-8 rounded-3xl border border-border bg-surface-elevated/50 p-6">
              <AddToCartSection product={product} />
            </div>

            <details className="mt-6 rounded-2xl border border-border px-4 py-3">
              <summary className="cursor-pointer font-medium">Size guide</summary>
              <p className="mt-2 text-sm text-muted">
                S: bust 34&quot; · M: bust 36&quot; · L: bust 38&quot; · XL: bust 40&quot;.
                Formal fits run slightly generous — size down for a tailored look.
              </p>
            </details>
          </div>
        </Reveal>
      </div>

      <section className="mt-20">
        <h2 className="heading-display text-3xl">Product details</h2>
        <p className="mt-4 max-w-2xl text-muted">{product.description}</p>
      </section>

      {related.length > 0 ? (
        <section className="mt-20">
          <h2 className="heading-display text-3xl">You may also like</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}

      {recentlyViewed.length > 0 ? (
        <section className="mt-20">
          <h2 className="heading-display text-3xl">Recently viewed</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recentlyViewed.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
