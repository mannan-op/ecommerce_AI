"use client";

import type { CheckoutPreview } from "@/lib/api";

interface OrderSummaryProps {
  preview: CheckoutPreview | null;
  loading?: boolean;
  localSubtotal?: number;
}

export function OrderSummary({ preview, loading, localSubtotal }: OrderSummaryProps) {
  if (loading) return <p className="notice">Calculating totals…</p>;

  if (!preview) {
    return (
      <aside className="checkout-summary">
        <h2>Order summary</h2>
        <div className="summary-row total">
          <span>Subtotal (est.)</span>
          <span>${(localSubtotal ?? 0).toFixed(2)}</span>
        </div>
        <p className="muted">Shipping &amp; tax calculated at next step.</p>
      </aside>
    );
  }

  return (
    <aside className="checkout-summary">
      <h2>Order summary</h2>
      <ul className="summary-items">
        {preview.items.map((item) => (
          <li key={item.variant_sku} className="summary-item">
            <div>
              <strong>{item.product_name}</strong>
              <p className="muted">
                {item.quantity} × ${item.unit_price}
              </p>
            </div>
            <span>${item.subtotal}</span>
          </li>
        ))}
      </ul>
      <div className="summary-row">
        <span>Subtotal</span>
        <span>${preview.subtotal}</span>
      </div>
      {parseFloat(preview.discount) > 0 ? (
        <div className="summary-row">
          <span>Discount</span>
          <span>-${preview.discount}</span>
        </div>
      ) : null}
      <div className="summary-row">
        <span>Shipping</span>
        <span>${preview.shipping_cost}</span>
      </div>
      <div className="summary-row">
        <span>Tax</span>
        <span>${preview.tax}</span>
      </div>
      <div className="summary-row total">
        <span>Total</span>
        <span>${preview.total}</span>
      </div>
    </aside>
  );
}
