import type { Metadata } from "next";

import { OrderHistoryList } from "@/components/orders/OrderHistoryList";

export const metadata: Metadata = {
  title: "Order history",
  description: "View your past orders",
};

export default function OrdersPage() {
  return (
    <div className="container page">
      <header className="page-header">
        <h1>Order history</h1>
      </header>
      <OrderHistoryList />
    </div>
  );
}
