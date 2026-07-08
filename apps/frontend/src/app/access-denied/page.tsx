import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";

export const metadata = {
  title: "Access denied",
};

export default function AccessDeniedPage() {
  return (
    <div className="container-luxury flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Reveal>
        <h1 className="heading-display text-4xl">Admin access required</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          You are signed in, but this account does not have staff permissions.
          The admin panel is only available to staff users.
        </p>
        <p className="mt-4 text-sm text-muted">
          Demo staff: <strong>admin@example.com</strong> / <strong>admin12345</strong>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/">
            <Button variant="accent">Back to store</Button>
          </Link>
          <Link href="/login?redirect=/admin">
            <Button variant="outline">Sign in with another account</Button>
          </Link>
        </div>
      </Reveal>
    </div>
  );
}
