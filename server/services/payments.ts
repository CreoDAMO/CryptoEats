import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" as any })
  : null;

export interface PaymentIntentResult {
  clientSecret: string;
  intentId: string;
  amount: number;
  currency: string;
}

export interface PaymentCaptureResult {
  success: boolean;
  intentId: string;
  status: string;
}

export function isStripeConfigured(): boolean {
  return stripe !== null;
}

export async function createPaymentIntent(
  amount: number,
  orderId: string,
  customerEmail: string,
  metadata?: Record<string, string>
): Promise<PaymentIntentResult> {
  if (!stripe) throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");

  const intent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: "usd",
    payment_method_types: ["card"],
    capture_method: "manual",
    metadata: {
      orderId,
      customerEmail,
      platform: "cryptoeats",
      ...metadata,
    },
    receipt_email: customerEmail,
  });

  return {
    clientSecret: intent.client_secret!,
    intentId: intent.id,
    amount: intent.amount,
    currency: intent.currency,
  };
}

export async function capturePayment(intentId: string): Promise<PaymentCaptureResult> {
  if (!stripe) throw new Error("Stripe is not configured.");

  const captured = await stripe.paymentIntents.capture(intentId);
  return {
    success: captured.status === "succeeded",
    intentId: captured.id,
    status: captured.status,
  };
}

export async function cancelPayment(intentId: string, reason?: string): Promise<{ success: boolean }> {
  if (!stripe) throw new Error("Stripe is not configured.");

  await stripe.paymentIntents.cancel(intentId, {
    cancellation_reason: "requested_by_customer" as any,
  });
  return { success: true };
}

export async function createRefund(intentId: string, amount?: number): Promise<{ refundId: string; status: string }> {
  if (!stripe) throw new Error("Stripe is not configured.");

  const refund = await stripe.refunds.create({
    payment_intent: intentId,
    ...(amount ? { amount: Math.round(amount * 100) } : {}),
  });

  return { refundId: refund.id, status: refund.status! };
}

export async function getPaymentStatus(intentId: string) {
  if (!stripe) throw new Error("Stripe is not configured.");

  const intent = await stripe.paymentIntents.retrieve(intentId);
  return {
    intentId: intent.id,
    status: intent.status,
    amount: intent.amount / 100,
    capturedAmount: intent.amount_received / 100,
  };
}

export async function constructWebhookEvent(payload: Buffer | string, signature: string) {
  if (!stripe) throw new Error("Stripe is not configured.");

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set.");

  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
