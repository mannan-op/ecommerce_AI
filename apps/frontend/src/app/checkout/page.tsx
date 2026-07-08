import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutWizard } from "@/components/checkout/CheckoutWizard";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your purchase",
};

export default function CheckoutPage() {
  return (
    <div className="container page">
      <header className="page-header">
        <h1>Checkout</h1>
      </header>
      <Suspense fallback={<p className="notice">Loading checkout…</p>}>
        <CheckoutWizard />
      </Suspense>
    </div>
  );
}
