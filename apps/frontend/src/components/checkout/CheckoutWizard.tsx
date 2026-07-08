"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { AddressForm } from "@/components/checkout/AddressForm";
import { DemoPaymentStep } from "@/components/checkout/DemoPayment";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { StripePaymentStep } from "@/components/checkout/StripePayment";
import { Button } from "@/components/ui/Button";
import { api, type CheckoutPreview } from "@/lib/api";
import type { Address } from "@/lib/api/types";
import { useHasMounted } from "@/lib/hooks/useHasMounted";
import { useCartStore } from "@/lib/cart/store";
import { getPaymentProvider } from "@/lib/payment";

const STEPS = ["address", "summary", "payment"] as const;
type Step = (typeof STEPS)[number];

function generateIdempotencyKey() {
  return `checkout-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutWizard() {
  const router = useRouter();
  const mounted = useHasMounted();
  const items = useCartStore((s) => s.items);
  const displayItems = mounted ? items : [];
  const clearCart = useCartStore((s) => s.clear);
  const localSubtotal = useCartStore((s) => s.subtotal());
  const paymentProvider = getPaymentProvider();

  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderId, setOrderId] = useState("");
  const [providerRef, setProviderRef] = useState("");
  const [error, setError] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [idempotencyKey] = useState(generateIdempotencyKey);

  useEffect(() => {
    if (!mounted) return;
    if (displayItems.length === 0) {
      router.replace("/cart");
    }
  }, [mounted, displayItems.length, router]);

  useEffect(() => {
    api.addresses
      .list()
      .then((res) => {
        setAddresses(res.data.results);
        const def = res.data.results.find((a) => a.is_default);
        if (def) setSelectedAddressId(def.id);
      })
      .catch(() => setError("Could not load saved addresses."));
  }, []);

  const loadPreview = useCallback(async () => {
    setPreviewLoading(true);
    setError("");
    try {
      const { data } = await api.orders.preview();
      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load summary");
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  async function handleAddressSaved(addressId: string) {
    setSelectedAddressId(addressId);
    setStep("summary");
    await loadPreview();
  }

  async function handleProceedToPayment() {
    if (!selectedAddressId) {
      setError("Please select or add a shipping address.");
      return;
    }
    setCheckoutLoading(true);
    setError("");
    try {
      const { data } = await api.orders.checkout({
        shipping_address_id: selectedAddressId,
        idempotency_key: idempotencyKey,
        payment_provider: paymentProvider,
      });
      setOrderId(data.order.id);
      setProviderRef(data.provider_reference);
      setClientSecret(data.client_secret);
      setStep("payment");

      if (data.duplicate && data.order.payment?.status === "paid") {
        await clearCart();
        router.push(`/orders/${data.order.id}?confirmed=1`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handlePaymentSuccess() {
    try {
      const { data } = await api.orders.confirmPayment({
        order_id: orderId,
        provider_reference: providerRef,
      });
      await clearCart();
      router.push(`/orders/${data.order.id}?confirmed=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment confirmation failed");
    }
  }

  if (!mounted || displayItems.length === 0) {
    return <p className="text-muted">Redirecting to cart…</p>;
  }

  return (
    <div className="space-y-8">
      <nav
        className="flex flex-wrap gap-3"
        aria-label="Checkout progress"
      >
        {STEPS.map((s, i) => (
          <span
            key={s}
            className={`rounded-full px-4 py-2 text-xs uppercase tracking-wider transition-colors ${
              step === s
                ? "bg-primary text-background"
                : STEPS.indexOf(step) > i
                  ? "bg-accent/20 text-accent"
                  : "bg-surface-elevated text-muted"
            }`}
          >
            {i + 1}. {s}
          </span>
        ))}
      </nav>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {step === "address" ? (
          <div className="space-y-6 rounded-3xl border border-border bg-surface p-6">
            {addresses.length > 0 ? (
              <div className="space-y-4">
                <h2 className="font-display text-2xl">Saved addresses</h2>
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className="flex cursor-pointer gap-4 rounded-2xl border border-border p-4 transition-colors has-[:checked]:border-accent"
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <div>
                      <strong>{addr.label}</strong>
                      <p className="text-sm text-muted">
                        {addr.line1}, {addr.city} {addr.postal_code}
                      </p>
                    </div>
                  </label>
                ))}
                <Button
                  onClick={async () => {
                    setStep("summary");
                    await loadPreview();
                  }}
                  disabled={!selectedAddressId}
                  fullWidth
                >
                  Use selected address
                </Button>
              </div>
            ) : null}
            <AddressForm onSaved={handleAddressSaved} />
          </div>
        ) : null}

        {step === "summary" ? (
          <div className="space-y-4 rounded-3xl border border-border bg-surface p-6">
            <h2 className="font-display text-2xl">Review your order</h2>
            <Button
              onClick={handleProceedToPayment}
              fullWidth
              loading={checkoutLoading}
            >
              Continue to payment
            </Button>
            <Button variant="ghost" onClick={() => setStep("address")}>
              ← Edit address
            </Button>
          </div>
        ) : null}

        {step === "payment" ? (
          <div className="space-y-4 rounded-3xl border border-border bg-surface p-6">
            <h2 className="font-display text-2xl">Payment</h2>
            {paymentProvider === "demo" ? (
              <DemoPaymentStep
                amount={preview?.total ?? localSubtotal.toFixed(2)}
                onSuccess={handlePaymentSuccess}
                onError={setError}
              />
            ) : clientSecret ? (
              <StripePaymentStep
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={setError}
              />
            ) : (
              <p className="text-sm text-error">
                Payment could not be initialized. Check Stripe configuration or go
                back and try again.
              </p>
            )}
          </div>
        ) : null}

        <OrderSummary
          preview={step !== "address" ? preview : null}
          loading={previewLoading}
          localSubtotal={localSubtotal}
        />
      </div>
    </div>
  );
}
