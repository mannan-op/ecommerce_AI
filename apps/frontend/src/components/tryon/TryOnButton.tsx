"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { TryOnModal } from "@/components/tryon/TryOnModal";
import { Button } from "@/components/ui/Button";
import type { ProductDetail } from "@/lib/api/types";

export function TryOnButton({ product }: { product: ProductDetail }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="lg"
        fullWidth
        onClick={() => setOpen(true)}
        className="group border-accent/40 bg-gradient-to-r from-accent/5 to-transparent hover:border-accent hover:shadow-glow"
      >
        <Sparkles className="mr-2 h-4 w-4 text-accent transition-transform group-hover:scale-110" />
        <span className="font-display tracking-wide">Virtual try-on</span>
      </Button>
      <TryOnModal open={open} onClose={() => setOpen(false)} product={product} />
    </>
  );
}
