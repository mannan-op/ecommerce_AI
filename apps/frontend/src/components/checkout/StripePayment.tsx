"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { Button } from "@/components/ui/Button";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
);

function PaymentForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });
    setLoading(false);
    if (error) {
      onError(error.message ?? "Payment failed");
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onSuccess();
    } else {
      onError(`Payment status: ${paymentIntent?.status ?? "unknown"}`);
    }
  }

  return (
    <form onSubmit={handlePay} className="payment-form">
      <PaymentElement />
      <Button type="submit" fullWidth loading={loading} disabled={!stripe}>
        Pay now
      </Button>
    </form>
  );
}

interface StripePaymentStepProps {
  clientSecret: string;
  onSuccess: () => void;
  onError: (msg: string) => void;
}

export function StripePaymentStep({
  clientSecret,
  onSuccess,
  onError,
}: StripePaymentStepProps) {
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    return (
      <p className="error-message">
        Stripe publishable key not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <PaymentForm onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
