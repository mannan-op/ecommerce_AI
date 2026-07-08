import type { Metadata } from "next";
import { Suspense } from "react";

import { CheckoutWizard } from "@/components/checkout/CheckoutWizard";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Checkout",
};

export default function CheckoutPage() {
  return (
    <div className="container-luxury py-10 lg:py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Secure checkout</p>
        <h1 className="heading-display mt-2 text-4xl">Checkout</h1>
      </Reveal>
      <div className="mt-10">
        <Suspense fallback={<p className="text-muted">Loading checkout…</p>}>
          <CheckoutWizard />
        </Suspense>
      </div>
    </div>
  );
}
