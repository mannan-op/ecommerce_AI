import { Reveal } from "@/components/motion/Reveal";

export function BrandStory() {
  return (
    <section id="story" className="border-y border-border bg-surface-elevated/50 py-20 lg:py-28">
      <div className="container-luxury grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-gradient-to-br from-accent-soft via-surface to-secondary/10 shadow-elevated" />
        </Reveal>
        <Reveal delay={0.1} direction="right">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">Our story</p>
          <h2 className="heading-display mt-3 text-4xl">
            Crafted for the modern connoisseur
          </h2>
          <p className="mt-6 leading-relaxed text-muted">
            MAISON celebrates Pakistani heritage through a contemporary luxury lens.
            Each piece is selected for exceptional fabric, refined construction, and
            timeless appeal — bridging artisan tradition with global sophistication.
          </p>
          <p className="mt-4 leading-relaxed text-muted">
            From Karachi ateliers to your wardrobe, we believe clothing should feel
            as considered as it looks.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
