import { NewsletterForm } from "@/components/marketing/NewsletterForm";
import { Reveal } from "@/components/motion/Reveal";

export function NewsletterSection() {
  return (
    <section id="newsletter" className="py-20">
      <div className="container-luxury">
        <Reveal>
          <div className="rounded-[2rem] border border-border/60 bg-surface px-8 py-14 text-center shadow-soft lg:px-20">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">Stay connected</p>
            <h2 className="heading-display mt-3 text-3xl lg:text-4xl">
              Join the MAISON circle
            </h2>
            <p className="mx-auto mt-4 max-w-md text-muted">
              Be first to discover new collections, private sales, and styling notes
              from our creative team.
            </p>
            <div className="mx-auto mt-8 max-w-md">
              <NewsletterForm />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
