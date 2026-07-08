import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductDetailView } from "@/components/product/ProductDetailView";
import { serverApi } from "@/lib/api/server";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await serverApi.getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description || `Shop ${product.name}`,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await serverApi.getProduct(slug);
  if (!product) notFound();

  let related: Awaited<ReturnType<typeof serverApi.getProducts>>["results"] = [];
  try {
    const result = await serverApi.getProducts({ page: 1 });
    related = result.results.filter((p) => p.id !== product.id).slice(0, 4);
  } catch {
    // ignore
  }

  return <ProductDetailView product={product} related={related} />;
}
