import type { Metadata } from "next";

import { OrderHistoryList } from "@/components/orders/OrderHistoryList";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Order history",
};

export default function OrdersPage() {
  return (
    <div className="container-luxury py-10 lg:py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Account</p>
        <h1 className="heading-display mt-2 text-4xl">Order history</h1>
      </Reveal>
      <div className="mt-10">
        <OrderHistoryList />
      </div>
    </div>
  );
}
