import Link from "next/link";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";
import type { Category } from "@/lib/api/types";

interface FeaturedCollectionsProps {
  categories: Category[];
}

export function FeaturedCollections({ categories }: FeaturedCollectionsProps) {
  const featured = categories.slice(0, 4);

  return (
    <section className="py-20">
      <div className="container-luxury">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Curated</p>
          <h2 className="heading-display mt-2 text-4xl">Featured collections</h2>
        </Reveal>
        <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((cat, i) => (
            <StaggerItem key={cat.id}>
              <Link
                href={`/categories/${cat.slug}`}
                className="group relative block overflow-hidden rounded-3xl bg-surface-elevated shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-elevated"
              >
                <div className="aspect-[4/5] bg-gradient-to-br from-accent-soft/80 via-surface to-secondary/10 transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/60 via-primary/10 to-transparent" />
                <div className="absolute bottom-0 p-6">
                  <span className="text-xs uppercase tracking-widest text-accent">
                    0{i + 1}
                  </span>
                  <h3 className="mt-1 font-display text-2xl text-background">
                    {cat.name}
                  </h3>
                </div>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
