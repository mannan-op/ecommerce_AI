import type { Metadata } from "next";

import { BrandStory } from "@/components/home/BrandStory";
import { FAQ } from "@/components/home/FAQ";
import { FeaturedCollections } from "@/components/home/FeaturedCollections";
import { HeroSection } from "@/components/home/HeroSection";
import { InstagramGallery } from "@/components/home/InstagramGallery";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ProductShowcase } from "@/components/home/ProductShowcase";
import { SeasonalBanner } from "@/components/home/SeasonalBanner";
import { Testimonials } from "@/components/home/Testimonials";
import { serverApi } from "@/lib/api/server";

export const metadata: Metadata = {
  title: "Luxury fashion for the modern wardrobe",
  description:
    "Discover curated Pakistani luxury fashion — lawn, silk, and artisanal pret collections.",
};

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof serverApi.getProducts>>["results"] = [];
  let categories: Awaited<ReturnType<typeof serverApi.getCategories>> = [];
  let error: string | null = null;

  try {
    const [productResult, cats] = await Promise.all([
      serverApi.getProducts({ ordering: "-newest" }),
      serverApi.getCategories(),
    ]);
    products = productResult.results;
    categories = cats;
  } catch {
    try {
      categories = await serverApi.getCategories();
    } catch {
      error =
        "Could not reach the API. Start the Django backend with docker compose up.";
    }
    if (!error) {
      try {
        const productResult = await serverApi.getProducts();
        products = productResult.results;
      } catch {
        error =
          "Could not load products. Check that the API is running and seeded.";
      }
    }
  }

  const newArrivals = products.slice(0, 8);
  const trending = [...products].reverse().slice(0, 8);
  const bestSellers = products.slice(2, 10);

  return (
    <>
      <HeroSection />

      {categories.length > 0 ? (
        <FeaturedCollections categories={categories} />
      ) : null}

      {error ? (
        <div className="container-luxury py-8 text-center text-sm text-error">
          {error}
        </div>
      ) : (
        <>
          <ProductShowcase
            title="New arrivals"
            subtitle="Just landed"
            products={newArrivals}
            viewAllHref="/shop?ordering=-newest"
            badge="New"
          />
          <SeasonalBanner />
          <ProductShowcase
            title="Trending now"
            subtitle="Most loved"
            products={trending}
          />
          <ProductShowcase
            title="Best sellers"
            subtitle="Client favourites"
            products={bestSellers}
          />
        </>
      )}

      <BrandStory />
      <Testimonials />
      <InstagramGallery products={products} />
      <NewsletterSection />
      <FAQ />
    </>
  );
}
