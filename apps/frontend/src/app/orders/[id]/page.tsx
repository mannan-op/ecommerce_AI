import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { getAccessToken } from "@/lib/auth/session";
import { serverApi } from "@/lib/api/server";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8)}` };
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { confirmed } = await searchParams;
  const accessToken = await getAccessToken();

  if (!accessToken) {
    redirect(`/login?redirect=/orders/${id}`);
  }

  const order = await serverApi.getOrder(id, accessToken);
  if (!order) notFound();

  const addr =
    typeof order.shipping_address === "object" && order.shipping_address
      ? order.shipping_address
      : null;

  return (
    <div className="container page">
      {confirmed ? (
        <div className="success-banner">
          <h2>Order confirmed!</h2>
          <p>
            Thank you for your purchase. A confirmation email has been sent.
          </p>
        </div>
      ) : null}

      <header className="page-header">
        <h1>Order #{order.id.slice(0, 8).toUpperCase()}</h1>
        <p>
          Placed on {new Date(order.created_at).toLocaleString()} ·{" "}
          <span className={`status-badge status-${order.status}`}>
            {order.status}
          </span>
        </p>
        {order.estimated_delivery ? (
          <p className="muted">
            Estimated delivery:{" "}
            {new Date(order.estimated_delivery).toLocaleDateString("en-PK", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        ) : null}
      </header>

      <div className="order-detail">
        <section>
          <h2>Items</h2>
          <ul className="order-items-list">
            {order.items.map((item) => (
              <li key={item.id} className="order-line">
                <div>
                  <strong>{item.product_name}</strong>
                  <p>
                    {item.color}
                    {item.size ? ` · ${item.size}` : ""}
                    {item.fabric_type ? ` · ${item.fabric_type}` : ""}
                  </p>
                  <p className="muted">SKU: {item.variant_sku}</p>
                </div>
                <div className="order-line-price">
                  <span>
                    {item.quantity} × ${item.unit_price}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {addr ? (
            <>
              <h2>Shipping address</h2>
              <div className="address-card">
                <p>
                  <strong>{addr.label ?? "Shipping"}</strong>
                  <br />
                  {addr.line1}
                  <br />
                  {addr.line2 ? (
                    <>
                      {addr.line2}
                      <br />
                    </>
                  ) : null}
                  {addr.city}, {addr.postal_code}
                  <br />
                  {addr.country}
                </p>
              </div>
            </>
          ) : null}
        </section>

        <aside className="order-summary-panel">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${order.subtotal ?? order.total}</span>
          </div>
          {order.shipping_cost ? (
            <div className="summary-row">
              <span>Shipping</span>
              <span>${order.shipping_cost}</span>
            </div>
          ) : null}
          {order.tax ? (
            <div className="summary-row">
              <span>Tax</span>
              <span>${order.tax}</span>
            </div>
          ) : null}
          {order.discount && parseFloat(String(order.discount)) > 0 ? (
            <div className="summary-row">
              <span>Discount</span>
              <span>-${order.discount}</span>
            </div>
          ) : null}
          <div className="summary-row total">
            <span>Total</span>
            <span>${order.total}</span>
          </div>
          <div className="summary-row">
            <span>Payment</span>
            <span className={`status-badge status-${order.payment.status}`}>
              {order.payment.provider === "demo" && order.payment.status === "paid"
                ? "Paid (Demo)"
                : order.payment.status}
            </span>
          </div>
          <Link href="/orders">
            <Button variant="secondary" fullWidth>
              Back to orders
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
