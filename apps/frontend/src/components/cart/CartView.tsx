"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { normalizeMediaUrl } from "@/lib/media";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useCartStore } from "@/lib/cart/store";

export function CartView() {
  const mounted = useHasMounted();
  const { items, updateQuantity, removeItem, subtotal, clear } = useCartStore();
  const displayItems = mounted ? items : [];

  if (displayItems.length === 0) {
    return (
      <div className="empty-state">
        <h2>Your cart is empty</h2>
        <p>Browse our collection and add something you love.</p>
        <Link href="/">
          <Button>Continue shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-layout">
      <div className="cart-items">
        {displayItems.map((item) => {
          const imageSrc = normalizeMediaUrl(item.image);
          return (
          <article key={item.variantId} className="cart-item">
            <div className="cart-item-image">
              {imageSrc ? (
                <Image
                  src={imageSrc}
                  alt={item.productName ?? "Product"}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="product-card-placeholder" />
              )}
            </div>
            <div className="cart-item-info">
              <h3>{item.productName ?? item.sku}</h3>
              <p>
                {[item.color, item.size, item.fabricType]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              <p className="cart-item-price">${item.price}</p>
            </div>
            <div className="cart-item-actions">
              <input
                type="number"
                min={1}
                value={item.quantity}
                className="qty-input"
                onChange={(e) =>
                  updateQuantity(item.variantId, Number(e.target.value))
                }
              />
              <Button
                variant="ghost"
                onClick={() => removeItem(item.variantId)}
              >
                Remove
              </Button>
            </div>
          </article>
          );
        })}
      </div>
      <aside className="cart-summary">
        <h2>Order summary</h2>
        <div className="summary-row">
          <span>Subtotal</span>
          <span>${subtotal().toFixed(2)}</span>
        </div>
        <Link href="/checkout">
          <Button fullWidth>Proceed to checkout</Button>
        </Link>
        <Button variant="ghost" fullWidth onClick={() => clear()}>
          Clear cart
        </Button>
      </aside>
    </div>
  );
}
