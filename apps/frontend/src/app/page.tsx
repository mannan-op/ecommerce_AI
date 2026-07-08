import type { Metadata } from "next";
import Link from "next/link";

import { ProductGrid } from "@/components/product/ProductGrid";
import type { Category, ProductList } from "@/lib/api/types";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Shop the latest collection",
  description: "Discover quality products with modern style and craftsmanship.",
};

export default async function HomePage() {
  let products: ProductList[] = [];
  let categories: Category[] = [];
  let error: string | null = null;

  try {
    [products, categories] = await Promise.all([
      serverApi.getProducts().then((r) => r.results),
      serverApi.getCategories(),
    ]);
  } catch {
    error =
      "Could not reach the API. Start the Django backend with docker compose up.";
  }

  return (
    <div className="container page">
      <section className="hero">
        <h1>Curated for modern living</h1>
        <p>
          Quality fabrics, thoughtful design, and seamless shopping — powered by
          our Django + Next.js stack.
        </p>
      </section>

      {categories.length > 0 ? (
        <section className="section">
          <h2>Shop by category</h2>
          <div className="category-pills">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="category-pill"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section">
        <h2>Featured products</h2>
        {error ? (
          <p className="notice">{error}</p>
        ) : (
          <ProductGrid products={products} />
        )}
      </section>
    </div>
  );
}
