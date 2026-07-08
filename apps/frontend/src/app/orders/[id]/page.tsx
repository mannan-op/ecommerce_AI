import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAccessToken } from "@/lib/auth/session";
import { serverApi } from "@/lib/api/server";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ confirmed?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8).toUpperCase()}` };
}

function formatAddress(addr: {
  label?: string;
  line1: string;
  line2?: string;
  city: string;
  postal_code: string;
  country?: string;
}) {
  const lines = [addr.line1];
  if (addr.line2?.trim() && addr.line2.trim() !== addr.line1.trim()) {
    lines.push(addr.line2.trim());
  }
  return lines;
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

  const paymentLabel =
    order.payment.provider === "demo" && order.payment.status === "paid"
      ? "Paid (Demo)"
      : order.payment.status;

  return (
    <div className="container-luxury py-10 lg:py-16">
      <Breadcrumbs
        className="mb-8"
        items={[
          { label: "Home", href: "/" },
          { label: "Orders", href: "/orders" },
          { label: `#${order.id.slice(0, 8).toUpperCase()}` },
        ]}
      />

      {confirmed ? (
        <div className="mb-8 rounded-3xl border border-success/30 bg-success/10 px-6 py-5">
          <h2 className="font-display text-2xl text-success">Order confirmed</h2>
          <p className="mt-1 text-sm text-muted">
            Thank you for your purchase. A confirmation email has been sent.
          </p>
        </div>
      ) : null}

      <header className="mb-10 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Order details</p>
        <h1 className="heading-display text-4xl">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
          <span>
            Placed on{" "}
            {new Date(order.created_at).toLocaleString("en-PK", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
          <Badge variant={order.status === "confirmed" ? "success" : "outline"}>
            {order.status}
          </Badge>
        </div>
        {order.estimated_delivery ? (
          <p className="text-sm text-muted">
            Estimated delivery:{" "}
            <span className="text-foreground">
              {new Date(order.estimated_delivery).toLocaleDateString("en-PK", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </p>
        ) : null}
      </header>

      <div className="grid gap-10 lg:grid-cols-[1fr_380px] lg:items-start">
        <div className="space-y-8">
          <section className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
            <h2 className="font-display text-2xl">Items</h2>
            <ul className="mt-6 divide-y divide-border">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start justify-between gap-4 py-5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">{item.product_name}</p>
                    <p className="mt-1 text-sm text-muted">
                      {[item.color, item.size, item.fabric_type]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-muted">SKU: {item.variant_sku}</p>
                  </div>
                  <p className="shrink-0 text-sm font-medium tabular-nums">
                    {item.quantity} × ${item.unit_price}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {addr ? (
            <section className="rounded-3xl border border-border bg-surface p-6 shadow-soft">
              <h2 className="font-display text-2xl">Shipping address</h2>
              <address className="mt-4 not-italic text-sm leading-relaxed text-muted">
                <p className="font-medium text-foreground">{addr.label ?? "Shipping"}</p>
                {formatAddress(addr).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <p>
                  {addr.city}, {addr.postal_code}
                </p>
                <p>{addr.country}</p>
              </address>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 rounded-3xl border border-border bg-surface-elevated/50 p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-2xl">Summary</h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-muted">Subtotal</dt>
              <dd className="font-medium tabular-nums">
                ${order.subtotal ?? order.total}
              </dd>
            </div>
            {order.shipping_cost ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Shipping</dt>
                <dd className="font-medium tabular-nums">${order.shipping_cost}</dd>
              </div>
            ) : null}
            {order.tax ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Tax</dt>
                <dd className="font-medium tabular-nums">${order.tax}</dd>
              </div>
            ) : null}
            {order.discount && parseFloat(String(order.discount)) > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="text-muted">Discount</dt>
                <dd className="font-medium tabular-nums text-success">
                  -${order.discount}
                </dd>
              </div>
            ) : null}
            <div
              className={cn(
                "flex items-center justify-between gap-4 border-t border-border pt-4 text-base"
              )}
            >
              <dt className="font-medium">Total</dt>
              <dd className="font-display text-xl tabular-nums">${order.total}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 pt-1">
              <dt className="text-muted">Payment</dt>
              <dd>
                <Badge variant={order.payment.status === "paid" ? "success" : "outline"}>
                  {paymentLabel}
                </Badge>
              </dd>
            </div>
          </dl>

          <Link href="/orders" className="mt-6 block">
            <Button variant="outline" fullWidth>
              Back to orders
            </Button>
          </Link>
        </aside>
      </div>
    </div>
  );
}
