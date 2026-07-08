"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "What is your shipping policy?",
    a: "We offer flat-rate shipping of $9.99. Orders over $75 qualify for complimentary shipping. Delivery typically takes 5 business days within Pakistan.",
  },
  {
    q: "How do I choose the right size?",
    a: "Each product page includes a size guide. If you're between sizes, we recommend sizing up for formal wear and true-to-size for pret collections.",
  },
  {
    q: "Can I return or exchange items?",
    a: "Unworn items with tags attached may be returned within 14 days of delivery. Contact our team to initiate a return.",
  },
  {
    q: "Do you ship internationally?",
    a: "Currently we ship within Pakistan. International shipping is coming soon — subscribe to our newsletter for updates.",
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20">
      <div className="container-luxury max-w-3xl">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Support</p>
          <h2 className="heading-display mt-2 text-4xl">Frequently asked</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {faqs.map((faq, i) => (
            <Reveal key={faq.q} delay={i * 0.05}>
              <div className="overflow-hidden rounded-2xl border border-border bg-surface">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-6 py-4 text-left"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <span className="font-medium">{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 text-muted transition-transform",
                      open === i && "rotate-180"
                    )}
                  />
                </button>
                <AnimatePresence>
                  {open === i ? (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-border px-6 py-4 text-sm text-muted">
                        {faq.a}
                      </p>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
