"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";

interface DemoPaymentStepProps {
  amount: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function DemoPaymentStep({
  amount,
  onSuccess,
  onError,
}: DemoPaymentStepProps) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    onError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      onSuccess();
    } catch {
      onError("Demo payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-accent/30 bg-accent/10 p-4">
        <strong>Demo Payment Mode</strong>
        <p className="mt-1 text-sm text-muted">
          No real charges. Simulates a successful payment for development.
        </p>
      </div>
      <p className="text-lg">
        Total due: <strong className="font-display text-2xl">${amount}</strong>
      </p>
      <Button type="button" variant="accent" fullWidth loading={loading} onClick={handlePay}>
        Pay with Demo Mode
      </Button>
    </div>
  );
}
