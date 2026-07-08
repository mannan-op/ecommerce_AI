import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AddToCartSection } from "@/components/product/AddToCartButton";
import { ProductGallery } from "@/components/product/ProductGallery";
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

  return (
    <div className="container page">
      <div className="product-detail">
        <ProductGallery images={product.images} productName={product.name} />
        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="product-detail-desc">{product.description}</p>
          {product.min_price ? (
            <p className="product-detail-price">From ${product.min_price}</p>
          ) : null}
          <AddToCartSection product={product} />
        </div>
      </div>
    </div>
  );
}
