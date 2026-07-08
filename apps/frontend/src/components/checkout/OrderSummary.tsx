"use client";

import type { CheckoutPreview } from "@/lib/api";

interface OrderSummaryProps {
  preview: CheckoutPreview | null;
  loading?: boolean;
  localSubtotal?: number;
}

export function OrderSummary({ preview, loading, localSubtotal }: OrderSummaryProps) {
  if (loading) return <p className="text-muted">Calculating totals…</p>;

  const wrapper =
    "rounded-3xl border border-border bg-surface-elevated/50 p-6 lg:sticky lg:top-28";

  if (!preview) {
    return (
      <aside className={wrapper}>
        <h2 className="font-display text-2xl">Order summary</h2>
        <div className="mt-4 flex justify-between font-medium">
          <span className="text-muted">Subtotal (est.)</span>
          <span>${(localSubtotal ?? 0).toFixed(2)}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Shipping & tax calculated at next step.</p>
      </aside>
    );
  }

  return (
    <aside className={wrapper}>
      <h2 className="font-display text-2xl">Order summary</h2>
      <ul className="mt-4 space-y-3 border-b border-border pb-4">
        {preview.items.map((item) => (
          <li key={item.variant_sku} className="flex justify-between text-sm">
            <div>
              <strong>{item.product_name}</strong>
              <p className="text-muted">
                {item.quantity} × ${item.unit_price}
              </p>
            </div>
            <span>${item.subtotal}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span>${preview.subtotal}</span>
        </div>
        {parseFloat(preview.discount) > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted">Discount</span>
            <span>-${preview.discount}</span>
          </div>
        ) : null}
        <div className="flex justify-between">
          <span className="text-muted">Shipping</span>
          <span>${preview.shipping_cost}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted">Tax</span>
          <span>${preview.tax}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-3 text-base font-medium">
          <span>Total</span>
          <span>${preview.total}</span>
        </div>
      </div>
    </aside>
  );
}
