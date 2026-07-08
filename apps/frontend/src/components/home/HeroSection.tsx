"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export function HeroSection() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 20 });

  return (
    <section
      className="relative overflow-hidden bg-hero-glow py-20 lg:py-32"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set((e.clientX - rect.left - rect.width / 2) / 20);
        mouseY.set((e.clientY - rect.top - rect.height / 2) / 20);
      }}
    >
      <motion.div
        style={{ x: springX, y: springY }}
        className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
      />
      <motion.div
        style={{ x: springX, y: springY }}
        className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-secondary/15 blur-3xl"
      />

      <div className="container-luxury relative grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Spring / Summer 2026
          </p>
          <h1 className="heading-display mt-4 text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Elevated
            <br />
            <span className="text-gradient-gold italic">Elegance</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            Discover curated Pakistani luxury — lawn suits, silk formals, and
            artisanal pret wear crafted for those who dress with intention.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link href="/shop">
              <Button variant="primary" size="lg">
                Explore collection
              </Button>
            </Link>
            <Link href="/shop?ordering=-newest">
              <Button variant="outline" size="lg">
                New arrivals
              </Button>
            </Link>
          </div>
        </Reveal>

        <Reveal delay={0.15} direction="right">
          <div className="perspective-1000 relative mx-auto max-w-md lg:max-w-none">
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10 overflow-hidden rounded-[2rem] border border-border/50 bg-surface shadow-elevated"
            >
              <div className="aspect-[4/5] bg-gradient-to-br from-accent-soft via-surface-elevated to-secondary/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-display text-2xl text-background">
                  The Artisan Edit
                </p>
                <p className="text-sm text-background/80">Limited release</p>
              </div>
            </motion.div>
            <motion.div
              className="absolute -bottom-6 -left-6 z-0 h-32 w-32 rounded-3xl border border-accent/30 bg-accent/10 backdrop-blur-md"
              animate={{ rotate: [0, 4, 0] }}
              transition={{ duration: 8, repeat: Infinity }}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
