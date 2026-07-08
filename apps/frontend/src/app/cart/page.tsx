import type { Metadata } from "next";

import { CartView } from "@/components/cart/CartView";
import { Reveal } from "@/components/motion/Reveal";

export const metadata: Metadata = {
  title: "Shopping bag",
};

export default function CartPage() {
  return (
    <div className="container-luxury py-10 lg:py-16">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">Your selection</p>
        <h1 className="heading-display mt-2 text-4xl">Shopping bag</h1>
      </Reveal>
      <div className="mt-10">
        <CartView />
      </div>
    </div>
  );
}
