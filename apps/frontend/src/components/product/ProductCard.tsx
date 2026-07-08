"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  Eye,
  Heart,
  ShoppingBag,
  Star,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { QuickViewModal } from "@/components/product/QuickViewModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import type { ProductList } from "@/lib/api/types";
import { ApiError } from "@/lib/api/types";
import { useCartStore } from "@/lib/cart/store";
import { normalizeMediaUrl } from "@/lib/media";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { cn, productRating } from "@/lib/utils";
import { useWishlistStore } from "@/lib/wishlist/store";

interface ProductCardProps {
  product: ProductList;
  badge?: string;
  index?: number;
}

export function ProductCard({ product, badge, index = 0 }: ProductCardProps) {
  const mounted = useHasMounted();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const { has, toggle } = useWishlistStore();
  const [quickView, setQuickView] = useState(false);
  const [adding, setAdding] = useState(false);
  const { score, count } = productRating(product.id);
  const imageSrc = normalizeMediaUrl(product.primary_image);
  const wished = mounted && has(product.id);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-60, 60], [6, -6]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-60, 60], [-6, 6]), {
    stiffness: 300,
    damping: 30,
  });

  async function handleQuickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      const { data } = await api.products.getBySlug(product.slug);
      const variant = data.variants?.find((v) => v.is_active);
      if (!variant) return;
      await addItem(
        variant,
        { name: data.name, image: normalizeMediaUrl(data.primary_image) },
        1
      );
    } catch (err) {
      if (!(err instanceof ApiError)) router.push(`/products/${product.slug}`);
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        style={{ rotateX, rotateY, transformPerspective: 1000 }}
        onMouseMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          x.set(e.clientX - rect.left - rect.width / 2);
          y.set(e.clientY - rect.top - rect.height / 2);
        }}
        onMouseLeave={() => {
          x.set(0);
          y.set(0);
        }}
        className="group relative"
      >
        <Link href={`/products/${product.slug}`} className="block">
          <div className="relative overflow-hidden rounded-3xl bg-surface-elevated shadow-soft transition-shadow duration-500 group-hover:shadow-elevated">
            <div className="relative aspect-[3/4] overflow-hidden">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-surface-elevated text-muted">
                  No image
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-primary/50 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              {badge ? (
                <Badge variant="accent" className="absolute left-4 top-4">
                  {badge}
                </Badge>
              ) : index < 3 ? (
                <Badge variant="accent" className="absolute left-4 top-4">
                  New
                </Badge>
              ) : null}

              <div className="absolute right-4 top-4 flex flex-col gap-2 opacity-0 transition-all duration-300 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    toggle(product.id);
                  }}
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 backdrop-blur-md transition-colors",
                    wished ? "text-error" : "text-foreground hover:text-accent"
                  )}
                  aria-label="Add to wishlist"
                >
                  <Heart className={cn("h-4 w-4", wished && "fill-current")} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setQuickView(true);
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-foreground backdrop-blur-md transition-colors hover:text-accent"
                  aria-label="Quick view"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>

              <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <Button
                  variant="accent"
                  size="sm"
                  fullWidth
                  loading={adding}
                  onClick={handleQuickAdd}
                >
                  <ShoppingBag className="h-4 w-4" />
                  Quick add
                </Button>
              </div>
            </div>

            <div className="space-y-2 p-5">
              <div className="flex items-center gap-1 text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.floor(score) ? "fill-current" : "fill-none opacity-40"
                    )}
                  />
                ))}
                <span className="ml-1 text-xs text-muted">({count})</span>
              </div>
              <h3 className="font-display text-lg leading-tight text-foreground transition-colors group-hover:text-accent">
                {product.name}
              </h3>
              <p className="line-clamp-2 text-xs text-muted">
                {product.description || "Crafted with premium fabrics"}
              </p>
              <p className="text-sm font-medium tracking-wide">
                {product.min_price ? (
                  <>From ${product.min_price}</>
                ) : (
                  <span className="text-muted">Price on request</span>
                )}
              </p>
            </div>
          </div>
        </Link>
      </motion.article>

      <QuickViewModal
        slug={product.slug}
        open={quickView}
        onClose={() => setQuickView(false)}
      />
    </>
  );
}
