export type PaymentProvider = "demo" | "stripe";

export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER ?? "demo";
  return provider === "stripe" ? "stripe" : "demo";
}

export function isDemoPayment() {
  return getPaymentProvider() === "demo";
}
