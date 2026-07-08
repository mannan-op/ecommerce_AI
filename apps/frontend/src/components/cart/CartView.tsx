"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { normalizeMediaUrl } from "@/lib/media";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useCartStore } from "@/lib/cart/store";

export function CartView() {
  const mounted = useHasMounted();
  const { items, updateQuantity, removeItem, subtotal, clear } = useCartStore();
  const displayItems = mounted ? items : [];

  if (displayItems.length === 0) {
    return (
      <Reveal className="rounded-3xl border border-dashed border-border py-24 text-center">
        <h2 className="font-display text-3xl">Your bag is empty</h2>
        <p className="mt-2 text-muted">Discover pieces crafted for distinction.</p>
        <Link href="/shop" className="mt-8 inline-block">
          <Button variant="accent" size="lg">
            Continue shopping
          </Button>
        </Link>
      </Reveal>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        {displayItems.map((item) => {
          const imageSrc = normalizeMediaUrl(item.image);
          return (
            <Reveal key={item.variantId}>
              <article className="flex gap-4 rounded-3xl border border-border bg-surface p-4 shadow-soft sm:gap-6 sm:p-6">
                <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-2xl bg-surface-elevated sm:h-32 sm:w-28">
                  {imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={item.productName ?? "Product"}
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="font-display text-lg">{item.productName ?? item.sku}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {[item.color, item.size, item.fabricType]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-2 font-medium">${item.price}</p>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      className="h-10 w-16 rounded-xl border border-border text-center text-sm"
                      onChange={(e) =>
                        updateQuantity(item.variantId, Number(e.target.value))
                      }
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.variantId)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>

      <aside className="h-fit rounded-3xl border border-border bg-surface-elevated/50 p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl">Order summary</h2>
        <div className="mt-6 flex justify-between text-sm">
          <span className="text-muted">Subtotal</span>
          <span className="font-medium">${subtotal().toFixed(2)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Shipping calculated at checkout</p>
        <Link href="/checkout" className="mt-6 block">
          <Button variant="accent" size="lg" fullWidth>
            Proceed to checkout
          </Button>
        </Link>
        <Button variant="ghost" fullWidth className="mt-3" onClick={() => clear()}>
          Clear bag
        </Button>
      </aside>
    </div>
  );
}
