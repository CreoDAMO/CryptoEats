import {
  createPaymentIntent,
  capturePayment,
  cancelPayment,
  createRefund,
  getPaymentStatus,
  isStripeConfigured,
} from "./payments";

export type PaymentProviderKey = "stripe" | "adyen" | "godaddy" | "square" | "coinbase";

export interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  isInternational: boolean;
  type: "online" | "in-person" | "pos" | "crypto";
  customerEmail: string;
  customerAddress?: string;
  metadata?: Record<string, string>;
}

export interface PaymentResult {
  clientSecret?: string;
  intentId: string;
  txHash?: string;
  provider: PaymentProviderKey;
  amount: number;
  currency: string;
}

export interface CaptureResult {
  success: boolean;
  intentId: string;
  status: string;
  provider: PaymentProviderKey;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  status: string;
  provider: PaymentProviderKey;
}

export interface DisputeResult {
  resolution: string;
  provider: PaymentProviderKey;
  disputeId?: string;
}

interface PaymentProvider {
  name: PaymentProviderKey;
  isConfigured(): boolean;
  createPayment(order: PaymentOrder): Promise<PaymentResult>;
  capturePayment(intentId: string): Promise<CaptureResult>;
  refundPayment(intentId: string, amount: number, reason?: string): Promise<RefundResult>;
  cancelPayment(intentId: string): Promise<{ success: boolean }>;
  getStatus(intentId: string): Promise<{ status: string; amount: number }>;
  handleDispute(webhookData: any): Promise<DisputeResult>;
  getFeeEstimate(amount: number, type: string): { rate: string; estimated: number };
}

class StripePaymentProvider implements PaymentProvider {
  name: PaymentProviderKey = "stripe";

  isConfigured(): boolean {
    return isStripeConfigured();
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    const result = await createPaymentIntent(order.amount, order.id, order.customerEmail, order.metadata);
    return {
      clientSecret: result.clientSecret,
      intentId: result.intentId,
      provider: "stripe",
      amount: result.amount,
      currency: result.currency,
    };
  }

  async capturePayment(intentId: string): Promise<CaptureResult> {
    const result = await capturePayment(intentId);
    return { ...result, provider: "stripe" };
  }

  async refundPayment(intentId: string, amount: number, reason?: string): Promise<RefundResult> {
    const result = await createRefund(intentId, amount);
    return { success: true, refundId: result.refundId, status: result.status, provider: "stripe" };
  }

  async cancelPayment(intentId: string): Promise<{ success: boolean }> {
    return cancelPayment(intentId);
  }

  async getStatus(intentId: string): Promise<{ status: string; amount: number }> {
    const result = await getPaymentStatus(intentId);
    return { status: result.status, amount: result.amount };
  }

  async handleDispute(webhookData: any): Promise<DisputeResult> {
    if (webhookData.type === "charge.dispute.created") {
      const disputeId = webhookData.data?.object?.id;
      console.log(`[PaymentRouter] Stripe dispute created: ${disputeId}`);
      return { resolution: "logged_for_review", provider: "stripe", disputeId };
    }
    return { resolution: "no_action", provider: "stripe" };
  }

  getFeeEstimate(amount: number, _type: string): { rate: string; estimated: number } {
    const fee = amount * 0.029 + 0.30;
    return { rate: "2.9% + $0.30", estimated: Math.round(fee * 100) / 100 };
  }
}

class AdyenPaymentProvider implements PaymentProvider {
  name: PaymentProviderKey = "adyen";

  isConfigured(): boolean {
    return !!(process.env.ADYEN_API_KEY && process.env.ADYEN_MERCHANT_ACCOUNT);
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");

    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY!,
      environment: (process.env.ADYEN_ENVIRONMENT as any) || "TEST",
    });
    const checkout = new CheckoutAPI(client);

    const response = await checkout.PaymentsApi.payments({
      amount: { value: Math.round(order.amount * 100), currency: order.currency.toUpperCase() },
      reference: order.id,
      paymentMethod: { type: "scheme" },
      returnUrl: `${process.env.APP_URL || "https://cryptoeats.app"}/payment/return`,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT!,
      metadata: { orderId: order.id, customerEmail: order.customerEmail },
    });

    return {
      intentId: response.pspReference || order.id,
      provider: "adyen",
      amount: Math.round(order.amount * 100),
      currency: order.currency,
    };
  }

  async capturePayment(intentId: string): Promise<CaptureResult> {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");

    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY!,
      environment: (process.env.ADYEN_ENVIRONMENT as any) || "TEST",
    });
    const checkout = new CheckoutAPI(client);

    await checkout.ModificationsApi.captureAuthorisedPayment(intentId, {
      amount: { value: 0, currency: "USD" },
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT!,
    });

    return { success: true, intentId, status: "captured", provider: "adyen" };
  }

  async refundPayment(intentId: string, amount: number, _reason?: string): Promise<RefundResult> {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");

    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY!,
      environment: (process.env.ADYEN_ENVIRONMENT as any) || "TEST",
    });
    const checkout = new CheckoutAPI(client);

    const response = await checkout.ModificationsApi.refundCapturedPayment(intentId, {
      amount: { value: Math.round(amount * 100), currency: "USD" },
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT!,
    });

    return {
      success: true,
      refundId: response.pspReference || `refund_${intentId}`,
      status: "refunded",
      provider: "adyen",
    };
  }

  async cancelPayment(intentId: string): Promise<{ success: boolean }> {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");

    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY!,
      environment: (process.env.ADYEN_ENVIRONMENT as any) || "TEST",
    });
    const checkout = new CheckoutAPI(client);

    await checkout.ModificationsApi.cancelAuthorisedPaymentByPspReference(intentId, {
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT!,
    });

    return { success: true };
  }

  async getStatus(_intentId: string): Promise<{ status: string; amount: number }> {
    return { status: "unknown", amount: 0 };
  }

  async handleDispute(webhookData: any): Promise<DisputeResult> {
    const items = webhookData.notificationItems || [];
    for (const item of items) {
      const notification = item.NotificationRequestItem || item;
      if (notification.eventCode === "CHARGEBACK" || notification.eventCode === "REQUEST_FOR_INFORMATION") {
        console.log(`[PaymentRouter] Adyen dispute: ${notification.pspReference}`);
        return {
          resolution: "defense_needed",
          provider: "adyen",
          disputeId: notification.pspReference,
        };
      }
    }
    return { resolution: "no_action", provider: "adyen" };
  }

  getFeeEstimate(amount: number, _type: string): { rate: string; estimated: number } {
    const fee = amount * 0.02 + 0.13;
    return { rate: "~2.0% + $0.13 (interchange-plus)", estimated: Math.round(fee * 100) / 100 };
  }
}

class GoDaddyPaymentProvider implements PaymentProvider {
  name: PaymentProviderKey = "godaddy";
  private apiUrl = process.env.GODADDY_PAYMENTS_API_URL || "https://api.godaddypayments.com/v1";

  isConfigured(): boolean {
    return !!process.env.GODADDY_PAYMENTS_API_KEY;
  }

  private async request(method: string, path: string, data?: any): Promise<any> {
    const url = `${this.apiUrl}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${process.env.GODADDY_PAYMENTS_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GoDaddy API error: ${response.status} - ${error}`);
    }
    return response.json();
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");

    const result = await this.request("POST", "/payments", {
      amount: Math.round(order.amount * 100),
      currency: order.currency.toUpperCase(),
      reference: order.id,
      description: `CryptoEats Order #${order.id}`,
    });

    return {
      intentId: result.transactionId || result.id,
      provider: "godaddy",
      amount: Math.round(order.amount * 100),
      currency: order.currency,
    };
  }

  async capturePayment(intentId: string): Promise<CaptureResult> {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");

    await this.request("POST", `/payments/${intentId}/capture`);
    return { success: true, intentId, status: "captured", provider: "godaddy" };
  }

  async refundPayment(intentId: string, amount: number, reason?: string): Promise<RefundResult> {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");

    const result = await this.request("POST", `/payments/${intentId}/refund`, {
      amount: Math.round(amount * 100),
      reason: reason || "requested_by_customer",
    });

    return {
      success: true,
      refundId: result.refundId || `refund_${intentId}`,
      status: "refunded",
      provider: "godaddy",
    };
  }

  async cancelPayment(intentId: string): Promise<{ success: boolean }> {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");
    await this.request("POST", `/payments/${intentId}/cancel`);
    return { success: true };
  }

  async getStatus(intentId: string): Promise<{ status: string; amount: number }> {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");
    const result = await this.request("GET", `/payments/${intentId}`);
    return { status: result.status, amount: (result.amount || 0) / 100 };
  }

  async handleDispute(webhookData: any): Promise<DisputeResult> {
    if (webhookData.event === "dispute_created" || webhookData.type === "dispute") {
      console.log(`[PaymentRouter] GoDaddy dispute: ${webhookData.transactionId}`);
      return {
        resolution: "review_pending",
        provider: "godaddy",
        disputeId: webhookData.transactionId || webhookData.id,
      };
    }
    return { resolution: "no_action", provider: "godaddy" };
  }

  getFeeEstimate(amount: number, type: string): { rate: string; estimated: number } {
    let rate: number;
    let rateStr: string;
    if (type === "in-person") {
      rate = 0.023;
      rateStr = "2.3% + $0";
    } else {
      rate = 0.027;
      rateStr = "2.7% + $0.30";
    }
    const fee = amount * rate + (type === "in-person" ? 0 : 0.30);
    return { rate: rateStr, estimated: Math.round(fee * 100) / 100 };
  }
}

class SquarePaymentProvider implements PaymentProvider {
  name: PaymentProviderKey = "square";

  isConfigured(): boolean {
    return !!process.env.SQUARE_ACCESS_TOKEN;
  }

  private async getClient() {
    const { Client, Environment } = await import("square");
    return new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN!,
      environment: (process.env.SQUARE_ENVIRONMENT === "production" ? Environment.Production : Environment.Sandbox),
    });
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    if (!this.isConfigured()) throw new Error("Square is not configured");

    const client = await this.getClient();
    const { result } = await client.paymentsApi.createPayment({
      sourceId: "cnon:card-nonce-ok",
      idempotencyKey: `ce_${order.id}_${Date.now()}`,
      amountMoney: {
        amount: BigInt(Math.round(order.amount * 100)),
        currency: order.currency.toUpperCase(),
      },
      referenceId: order.id,
      note: `CryptoEats Order #${order.id}`,
    });

    return {
      intentId: result.payment?.id || order.id,
      provider: "square",
      amount: Number(result.payment?.amountMoney?.amount || 0),
      currency: order.currency,
    };
  }

  async capturePayment(intentId: string): Promise<CaptureResult> {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    await client.paymentsApi.completePayment(intentId, {});
    return { success: true, intentId, status: "captured", provider: "square" };
  }

  async refundPayment(intentId: string, amount: number, reason?: string): Promise<RefundResult> {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();

    const { result } = await client.refundsApi.refundPayment({
      idempotencyKey: `refund_${intentId}_${Date.now()}`,
      paymentId: intentId,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency: "USD",
      },
      reason: reason || "Customer request",
    });

    return {
      success: true,
      refundId: result.refund?.id || `refund_${intentId}`,
      status: "refunded",
      provider: "square",
    };
  }

  async cancelPayment(intentId: string): Promise<{ success: boolean }> {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    await client.paymentsApi.cancelPayment(intentId);
    return { success: true };
  }

  async getStatus(intentId: string): Promise<{ status: string; amount: number }> {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    const { result } = await client.paymentsApi.getPayment(intentId);
    return {
      status: result.payment?.status || "unknown",
      amount: Number(result.payment?.amountMoney?.amount || 0) / 100,
    };
  }

  async handleDispute(webhookData: any): Promise<DisputeResult> {
    if (webhookData.type === "dispute.created") {
      const disputeId = webhookData.data?.id || webhookData.data?.object?.dispute?.id;
      console.log(`[PaymentRouter] Square dispute: ${disputeId}`);
      return { resolution: "evidence_required", provider: "square", disputeId };
    }
    return { resolution: "no_action", provider: "square" };
  }

  getFeeEstimate(amount: number, type: string): { rate: string; estimated: number } {
    if (type === "in-person" || type === "pos") {
      const fee = amount * 0.026 + 0.10;
      return { rate: "2.6% + $0.10", estimated: Math.round(fee * 100) / 100 };
    }
    const fee = amount * 0.029 + 0.30;
    return { rate: "2.9% + $0.30", estimated: Math.round(fee * 100) / 100 };
  }
}

class CoinbasePaymentProvider implements PaymentProvider {
  name: PaymentProviderKey = "coinbase";

  isConfigured(): boolean {
    return !!process.env.COINBASE_COMMERCE_API_KEY;
  }

  private get headers() {
    return {
      "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY!,
      "X-CC-Version": "2018-03-22",
      "Content-Type": "application/json",
    };
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    if (!this.isConfigured()) throw new Error("Coinbase Commerce is not configured");

    const response = await fetch("https://api.commerce.coinbase.com/charges", {
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({
        name: "CryptoEats Order",
        description: `Order #${order.id}`,
        pricing_type: "fixed_price",
        local_price: {
          amount: order.amount.toFixed(2),
          currency: order.currency.toUpperCase(),
        },
        metadata: {
          orderId: order.id,
          customerEmail: order.customerEmail,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Coinbase Commerce error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const charge = data.data;

    return {
      intentId: charge.id,
      txHash: charge.payments?.[0]?.transaction_id,
      provider: "coinbase",
      amount: Math.round(order.amount * 100),
      currency: order.currency,
    };
  }

  async capturePayment(intentId: string): Promise<CaptureResult> {
    return { success: true, intentId, status: "completed", provider: "coinbase" };
  }

  async refundPayment(intentId: string, amount: number, reason?: string): Promise<RefundResult> {
    console.log(`[PaymentRouter] Coinbase refund requested: ${intentId}, amount: ${amount}, reason: ${reason}`);
    console.log("[PaymentRouter] Crypto refunds require manual processing via wallet transfer");
    return {
      success: true,
      refundId: `cb_refund_${intentId}_${Date.now()}`,
      status: "pending_manual_review",
      provider: "coinbase",
    };
  }

  async cancelPayment(intentId: string): Promise<{ success: boolean }> {
    if (!this.isConfigured()) throw new Error("Coinbase Commerce is not configured");

    await fetch(`https://api.commerce.coinbase.com/charges/${intentId}/cancel`, {
      method: "POST",
      headers: this.headers,
    });

    return { success: true };
  }

  async getStatus(intentId: string): Promise<{ status: string; amount: number }> {
    if (!this.isConfigured()) throw new Error("Coinbase Commerce is not configured");

    const response = await fetch(`https://api.commerce.coinbase.com/charges/${intentId}`, {
      headers: this.headers,
    });

    if (!response.ok) throw new Error("Failed to fetch charge status");

    const data = await response.json();
    const charge = data.data;
    const timeline = charge.timeline || [];
    const lastStatus = timeline[timeline.length - 1]?.status || "NEW";

    return {
      status: lastStatus.toLowerCase(),
      amount: parseFloat(charge.pricing?.local?.amount || "0"),
    };
  }

  async handleDispute(webhookData: any): Promise<DisputeResult> {
    const eventType = webhookData.event?.type || webhookData.type;
    if (eventType === "charge:failed" || eventType === "charge:disputed") {
      const chargeId = webhookData.event?.data?.id || webhookData.data?.id;
      console.log(`[PaymentRouter] Coinbase dispute/failure: ${chargeId}`);
      return {
        resolution: "manual_review_required",
        provider: "coinbase",
        disputeId: chargeId,
      };
    }
    return { resolution: "no_action", provider: "coinbase" };
  }

  getFeeEstimate(amount: number, _type: string): { rate: string; estimated: number } {
    const fee = amount * 0.01;
    return { rate: "1.0%", estimated: Math.round(fee * 100) / 100 };
  }
}

export interface RoutingConfig {
  defaultProvider: PaymentProviderKey;
  cryptoProvider: PaymentProviderKey;
  internationalProvider: PaymentProviderKey;
  inPersonProvider: PaymentProviderKey;
  posProvider: PaymentProviderKey;
  fallbackChain: PaymentProviderKey[];
}

const defaultRoutingConfig: RoutingConfig = {
  defaultProvider: "stripe",
  cryptoProvider: "coinbase",
  internationalProvider: "adyen",
  inPersonProvider: "godaddy",
  posProvider: "square",
  fallbackChain: ["stripe", "adyen", "square", "godaddy"],
};

class PaymentRouter {
  private providers: Map<PaymentProviderKey, PaymentProvider> = new Map();
  private config: RoutingConfig;
  private routingStats = {
    totalRouted: 0,
    byProvider: {} as Record<string, number>,
    fallbacksUsed: 0,
  };

  constructor(config?: Partial<RoutingConfig>) {
    this.config = { ...defaultRoutingConfig, ...config };

    this.providers.set("stripe", new StripePaymentProvider());
    this.providers.set("adyen", new AdyenPaymentProvider());
    this.providers.set("godaddy", new GoDaddyPaymentProvider());
    this.providers.set("square", new SquarePaymentProvider());
    this.providers.set("coinbase", new CoinbasePaymentProvider());
  }

  private selectProvider(order: PaymentOrder): PaymentProviderKey {
    if (order.type === "crypto") return this.config.cryptoProvider;
    if (order.isInternational) return this.config.internationalProvider;
    if (order.type === "in-person") return this.config.inPersonProvider;
    if (order.type === "pos") return this.config.posProvider;
    return this.config.defaultProvider;
  }

  private getConfiguredFallback(preferred: PaymentProviderKey): PaymentProviderKey {
    const provider = this.providers.get(preferred);
    if (provider?.isConfigured()) return preferred;

    for (const fallback of this.config.fallbackChain) {
      if (fallback !== preferred) {
        const fb = this.providers.get(fallback);
        if (fb?.isConfigured()) {
          console.log(`[PaymentRouter] ${preferred} not configured, falling back to ${fallback}`);
          this.routingStats.fallbacksUsed++;
          return fallback;
        }
      }
    }

    throw new Error("No payment providers are configured. Set at least STRIPE_SECRET_KEY.");
  }

  async createPayment(order: PaymentOrder): Promise<PaymentResult> {
    const preferred = this.selectProvider(order);
    const providerKey = this.getConfiguredFallback(preferred);
    const provider = this.providers.get(providerKey)!;

    this.routingStats.totalRouted++;
    this.routingStats.byProvider[providerKey] = (this.routingStats.byProvider[providerKey] || 0) + 1;

    console.log(`[PaymentRouter] Routing order ${order.id} to ${providerKey} (requested: ${preferred}, type: ${order.type})`);
    return provider.createPayment(order);
  }

  async capturePayment(intentId: string, providerKey: PaymentProviderKey): Promise<CaptureResult> {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.capturePayment(intentId);
  }

  async refundPayment(intentId: string, amount: number, providerKey: PaymentProviderKey, reason?: string): Promise<RefundResult> {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.refundPayment(intentId, amount, reason);
  }

  async cancelPayment(intentId: string, providerKey: PaymentProviderKey): Promise<{ success: boolean }> {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.cancelPayment(intentId);
  }

  async getStatus(intentId: string, providerKey: PaymentProviderKey): Promise<{ status: string; amount: number }> {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.getStatus(intentId);
  }

  async handleDispute(webhookData: any, providerKey: PaymentProviderKey): Promise<DisputeResult> {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.handleDispute(webhookData);
  }

  getProviderStatus(): Record<string, { configured: boolean; name: string }> {
    const status: Record<string, { configured: boolean; name: string }> = {};
    for (const [key, provider] of this.providers) {
      status[key] = { configured: provider.isConfigured(), name: provider.name };
    }
    return status;
  }

  getFeeComparison(amount: number, type: string = "online"): Record<string, { rate: string; estimated: number; configured: boolean }> {
    const comparison: Record<string, { rate: string; estimated: number; configured: boolean }> = {};
    for (const [key, provider] of this.providers) {
      const fees = provider.getFeeEstimate(amount, type);
      comparison[key] = { ...fees, configured: provider.isConfigured() };
    }
    return comparison;
  }

  getRoutingStats() {
    return { ...this.routingStats };
  }

  getRoutingConfig(): RoutingConfig {
    return { ...this.config };
  }

  updateRoutingConfig(updates: Partial<RoutingConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log("[PaymentRouter] Routing config updated:", this.config);
  }
}

export const paymentRouter = new PaymentRouter();

export function getPaymentRouter(): PaymentRouter {
  return paymentRouter;
}
