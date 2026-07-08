import Link from "next/link";

import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="container page empty-state">
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist or has been moved.</p>
      <div className="empty-state-actions">
        <Link href="/">
          <Button>Go home</Button>
        </Link>
        <Link href="/shop">
          <Button variant="secondary">Browse shop</Button>
        </Link>
      </div>
    </div>
  );
}
