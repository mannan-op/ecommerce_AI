import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review items in your shopping cart",
};

export default function CartPage() {
  return (
    <div className="container page">
      <header className="page-header">
        <h1>Shopping cart</h1>
      </header>
      <CartView />
    </div>
  );
}
