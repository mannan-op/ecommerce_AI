"use client";

import { motion } from "framer-motion";

import { Reveal, Stagger, StaggerItem } from "@/components/motion/Reveal";

const testimonials = [
  {
    quote:
      "The fabric quality is exceptional. My lawn suit drapes beautifully and still looks pristine after multiple wears.",
    name: "Sara A.",
    location: "Karachi",
  },
  {
    quote:
      "Finally a store that understands luxury pret. The checkout experience was seamless and delivery was fast.",
    name: "Fatima R.",
    location: "Lahore",
  },
  {
    quote:
      "Understated elegance — exactly what I wanted for Eid. The sizing guide was spot on.",
    name: "Amina K.",
    location: "Islamabad",
  },
];

export function Testimonials() {
  return (
    <section className="py-20">
      <div className="container-luxury">
        <Reveal className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Reviews</p>
          <h2 className="heading-display mt-2 text-4xl">Loved by our clients</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <motion.blockquote
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-border/60 bg-surface p-8 shadow-soft"
              >
                <p className="font-display text-lg leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-6 text-sm text-muted">
                  <strong className="text-foreground">{t.name}</strong> · {t.location}
                </footer>
              </motion.blockquote>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
