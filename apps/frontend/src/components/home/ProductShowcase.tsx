import Link from "next/link";

import { ProductCard } from "@/components/product/ProductCard";
import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";
import type { ProductList } from "@/lib/api/types";

interface ProductShowcaseProps {
  title: string;
  subtitle: string;
  products: ProductList[];
  viewAllHref?: string;
  badge?: string;
}

export function ProductShowcase({
  title,
  subtitle,
  products,
  viewAllHref = "/shop",
  badge,
}: ProductShowcaseProps) {
  if (!products.length) return null;

  return (
    <section className="py-16 lg:py-20">
      <div className="container-luxury">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              {subtitle}
            </p>
            <h2 className="heading-display mt-2 text-3xl lg:text-4xl">{title}</h2>
          </div>
          <Link href={viewAllHref}>
            <Button variant="ghost">View all →</Button>
          </Link>
        </Reveal>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product, i) => (
            <ProductCard
              key={product.id}
              product={product}
              index={i}
              badge={badge}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
