import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export default function NotFound() {
  return (
    <div className="container-luxury flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.3em] text-accent">404</p>
        <h1 className="heading-display mt-4 text-5xl">Page not found</h1>
        <p className="mt-4 max-w-md text-muted">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/">
            <Button variant="accent">Go home</Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline">Browse shop</Button>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
