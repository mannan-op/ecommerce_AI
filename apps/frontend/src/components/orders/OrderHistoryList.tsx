"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
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

  if (loading) return <p className="notice">Loading orders…</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <h2>No orders yet</h2>
        <p>When you place an order, it will appear here.</p>
        <Link href="/">
          <Button>Start shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="order-list">
      {orders.map((order) => (
        <Link key={order.id} href={`/orders/${order.id}`} className="order-card">
          <div>
            <strong>Order #{order.id.slice(0, 8)}</strong>
            <p>{new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <div className="order-card-meta">
            <span className={`status-badge status-${order.status}`}>
              {order.status}
            </span>
            <span>${order.total}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
