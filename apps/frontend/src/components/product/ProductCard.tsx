import type { ProductList } from "@/lib/api/types";
import { normalizeMediaUrl } from "@/lib/media";
import Image from "next/image";
import Link from "next/link";

interface ProductCardProps {
  product: ProductList;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageSrc = normalizeMediaUrl(product.primary_image);

  return (
    <Link href={`/products/${product.slug}`} className="product-card">
      <div className="product-card-image">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 280px"
            className="object-cover"
          />
        ) : (
          <div className="product-card-placeholder">No image</div>
        )}
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <p className="product-card-desc">
          {product.description || "Discover this product"}
        </p>
        <span className="product-card-price">
          {product.min_price ? `From $${product.min_price}` : "Price TBD"}
        </span>
      </div>
    </Link>
  );
}
