"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function AnnouncementBar() {
  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-primary text-background">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/20 via-transparent to-accent/20" />
      <div className="container-luxury relative flex items-center justify-center gap-2 py-2.5 text-center text-xs tracking-[0.2em] uppercase">
        <Sparkles className="h-3.5 w-3.5 text-accent" />
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          Complimentary shipping on orders over $75 · Summer collection now live
        </motion.span>
      </div>
    </div>
  );
}
