import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductGrid } from "@/components/product/ProductGrid";
import { Reveal } from "@/components/motion/Reveal";
import { serverApi } from "@/lib/api/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await serverApi.getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: category.description || `Browse ${category.name} products`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  let category: Awaited<ReturnType<typeof serverApi.getCategory>> = null;
  let result: Awaited<ReturnType<typeof serverApi.getProductsByCategory>> = {
    count: 0,
    results: [],
    page: 1,
    totalPages: 1,
    next: null,
    previous: null,
  };

  try {
    category = await serverApi.getCategory(slug);
    if (!category) notFound();
    result = await serverApi.getProductsByCategory(category.id);
  } catch {
    notFound();
  }

  return (
    <div className="container-luxury py-10 lg:py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Collection</p>
        <h1 className="heading-display mt-2 text-4xl lg:text-5xl">{category.name}</h1>
        {category.description ? (
          <p className="mt-4 max-w-2xl text-muted">{category.description}</p>
        ) : null}
      </Reveal>
      <div className="mt-10">
        <ProductGrid
          products={result.results}
          emptyMessage={`No products in ${category.name} yet.`}
        />
      </div>
    </div>
  );
}
