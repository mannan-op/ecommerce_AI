"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import type { Order } from "@/lib/api/types";

export function OrderHistoryList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.orders
      .list()
      .then((res) => setOrders(res.data.results))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load orders")
      )
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-muted">Loading orders…</p>;
  if (error) return <p className="text-sm text-error">{error}</p>;
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-border py-20 text-center">
        <h2 className="font-display text-2xl">No orders yet</h2>
        <p className="mt-2 text-muted">When you place an order, it will appear here.</p>
        <Link href="/shop" className="mt-6 inline-block">
          <Button variant="accent">Start shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <Link
          key={order.id}
          href={`/orders/${order.id}`}
          className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-surface p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated"
        >
          <div>
            <strong>Order #{order.id.slice(0, 8).toUpperCase()}</strong>
            <p className="text-sm text-muted">
              {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant={order.status === "confirmed" ? "success" : "outline"}>
              {order.status}
            </Badge>
            <span className="font-medium">${order.total}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
