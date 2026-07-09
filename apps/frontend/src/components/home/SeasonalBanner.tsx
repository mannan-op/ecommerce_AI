import Image from "next/image";
import Link from "next/link";

import { Reveal } from "@/components/motion/Reveal";
import { Button } from "@/components/ui/Button";

export function SeasonalBanner() {
  return (
    <section className="py-12">
      <div className="container-luxury">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] bg-primary px-8 py-16 text-background lg:px-16 lg:py-20">
            <Image
              src="/images/marketing/seasonal-banner.png"
              alt="Magenta embroidered lawn suit"
              fill
              sizes="100vw"
              className="object-cover object-center opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/40" />
            <div className="relative z-10 max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-accent">
                Seasonal edit
              </p>
              <h2 className="heading-display mt-3 text-4xl lg:text-5xl">
                The Summer Formal Collection
              </h2>
              <p className="mt-4 text-background/75">
                Lightweight silks and breathable lawns designed for celebrations,
                soirées, and sun-drenched afternoons.
              </p>
              <Link href="/shop?fabric=silk" className="mt-8 inline-block">
                <Button variant="accent" size="lg">
                  Shop the edit
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
