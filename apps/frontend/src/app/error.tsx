"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container page empty-state">
      <h1>Something went wrong</h1>
      <p>We could not load this page. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
