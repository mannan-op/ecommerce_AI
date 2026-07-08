import Link from "next/link";
import { Camera, Mail, MapPin, Phone } from "lucide-react";

import { NewsletterForm } from "@/components/marketing/NewsletterForm";

const footerLinks = {
  shop: [
    { label: "All products", href: "/shop" },
    { label: "New arrivals", href: "/shop?ordering=-newest" },
    { label: "Best sellers", href: "/shop" },
  ],
  help: [
    { label: "Orders", href: "/orders" },
    { label: "Shipping", href: "/#faq" },
    { label: "Returns", href: "/#faq" },
  ],
  company: [
    { label: "Our story", href: "/#story" },
    { label: "Contact", href: "/#newsletter" },
  ],
};

export function StoreFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-primary text-background">
      <div className="container-luxury py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" className="font-display text-3xl tracking-tight">
              MAISON<span className="text-accent">.</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-background/70">
              Curated Pakistani luxury fashion — premium fabrics, timeless
              silhouettes, and craftsmanship for the modern wardrobe.
            </p>
            <div className="mt-6 space-y-2 text-sm text-background/60">
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-accent" /> Karachi · Lahore
              </p>
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-accent" /> +92 300 123 4567
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-accent" /> hello@maison.style
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
            {Object.entries(footerLinks).map(([title, links]) => (
              <div key={title}>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
                  {title}
                </h3>
                <ul className="mt-4 space-y-2">
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-background/70 transition-colors hover:text-background"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-accent">
              Newsletter
            </h3>
            <p className="mt-4 text-sm text-background/70">
              Early access to collections and exclusive offers.
            </p>
            <div className="mt-4 [&_input]:border-background/20 [&_input]:bg-background/10 [&_input]:text-background [&_button]:bg-accent [&_button]:text-primary">
              <NewsletterForm />
            </div>
            <div className="mt-6 flex gap-3">
              <a
                href="#"
                aria-label="Instagram"
                className="rounded-full border border-background/20 p-2 text-background/70 transition-colors hover:border-accent hover:text-accent"
              >
                <Camera className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-background/10 pt-8 text-xs text-background/50 sm:flex-row">
          <p>© {new Date().getFullYear()} MAISON. All rights reserved.</p>
          <p>Crafted with precision · Designed for distinction</p>
        </div>
      </div>
    </footer>
  );
}
