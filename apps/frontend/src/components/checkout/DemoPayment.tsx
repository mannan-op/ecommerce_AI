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
    <div className="demo-payment">
      <div className="demo-payment-banner">
        <strong>Demo Payment Mode</strong>
        <p>
          No real charges. This simulates a successful payment for development and
          testing.
        </p>
      </div>
      <p className="demo-payment-amount">
        Total due: <strong>${amount}</strong>
      </p>
      <Button type="button" fullWidth loading={loading} onClick={handlePay}>
        Pay with Demo Mode
      </Button>
    </div>
  );
}
