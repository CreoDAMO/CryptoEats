import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
  apiKeys, webhooks, webhookDeliveries, integrationPartners,
  whiteLabelConfigs, apiAuditLogs, inboundOrders,
  type ApiKey, type Webhook, type WebhookDelivery,
  type IntegrationPartner, type WhiteLabelConfig, type ApiAuditLog, type InboundOrder,
} from "../shared/schema";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const TIER_LIMITS: Record<string, { rateLimit: number; dailyLimit: number; permissions: string[] }> = {
  free: { rateLimit: 100, dailyLimit: 1000, permissions: ["read"] },
  starter: { rateLimit: 500, dailyLimit: 10000, permissions: ["read", "write"] },
  pro: { rateLimit: 2000, dailyLimit: 100000, permissions: ["read", "write", "webhook", "widget"] },
  enterprise: { rateLimit: 10000, dailyLimit: 1000000, permissions: ["read", "write", "webhook", "widget", "whitelabel", "admin"] },
};

export function getTierLimits(tier: string) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}

function generatePublicKey(): string {
  return `ce_pk_${crypto.randomBytes(24).toString("hex")}`;
}

function generateSecretKey(): string {
  return `ce_sk_${crypto.randomBytes(32).toString("hex")}`;
}

export function generateWebhookSecret(): string {
  return `whsec_${crypto.randomBytes(32).toString("hex")}`;
}

export function signWebhookPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export const platformStorage = {
  async createApiKey(data: { userId: string; name: string; tier?: string; isSandbox?: boolean }): Promise<{ apiKey: ApiKey; secretKey: string }> {
    const publicKey = generatePublicKey();
    const secretKey = generateSecretKey();
    const secretKeyHash = await bcrypt.hash(secretKey, 10);
    const tier = (data.tier || "free") as "free" | "starter" | "pro" | "enterprise";
    const limits = getTierLimits(tier);

    const [apiKey] = await db.insert(apiKeys).values({
      userId: data.userId,
      name: data.name,
      publicKey,
      secretKeyHash,
      tier,
      isSandbox: data.isSandbox ?? true,
      rateLimit: limits.rateLimit,
      permissions: limits.permissions,
    }).returning();

    return { apiKey, secretKey };
  },

  async getApiKeyByPublicKey(publicKey: string): Promise<ApiKey | undefined> {
    const [key] = await db.select().from(apiKeys).where(eq(apiKeys.publicKey, publicKey)).limit(1);
    return key;
  },

  async validateSecretKey(apiKey: ApiKey, secretKey: string): Promise<boolean> {
    return bcrypt.compare(secretKey, apiKey.secretKeyHash);
  },

  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return db.select().from(apiKeys).where(eq(apiKeys.userId, userId)).orderBy(desc(apiKeys.createdAt));
  },

  async updateApiKey(id: string, data: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const [key] = await db.update(apiKeys).set({ ...data, updatedAt: new Date() }).where(eq(apiKeys.id, id)).returning();
    return key;
  },

  async rotateApiKey(id: string): Promise<{ apiKey: ApiKey; secretKey: string } | undefined> {
    const secretKey = generateSecretKey();
    const secretKeyHash = await bcrypt.hash(secretKey, 10);
    const publicKey = generatePublicKey();
    const [key] = await db.update(apiKeys).set({ publicKey, secretKeyHash, updatedAt: new Date() }).where(eq(apiKeys.id, id)).returning();
    if (!key) return undefined;
    return { apiKey: key, secretKey };
  },

  async deactivateApiKey(id: string): Promise<ApiKey | undefined> {
    const [key] = await db.update(apiKeys).set({ isActive: false, updatedAt: new Date() }).where(eq(apiKeys.id, id)).returning();
    return key;
  },

  async incrementDailyRequests(id: string): Promise<void> {
    await db.update(apiKeys).set({
      dailyRequests: sql`${apiKeys.dailyRequests} + 1`,
      lastUsedAt: new Date(),
    }).where(eq(apiKeys.id, id));
  },

  async resetDailyRequests(id: string): Promise<void> {
    await db.update(apiKeys).set({ dailyRequests: 0, lastResetAt: new Date() }).where(eq(apiKeys.id, id));
  },

  async checkRateLimit(apiKey: ApiKey): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
    const limits = getTierLimits(apiKey.tier);
    const lastReset = apiKey.lastResetAt ? new Date(apiKey.lastResetAt) : new Date();
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      await platformStorage.resetDailyRequests(apiKey.id);
      return { allowed: true, remaining: limits.dailyLimit - 1, resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) };
    }

    const current = apiKey.dailyRequests || 0;
    const allowed = current < limits.dailyLimit;
    return {
      allowed,
      remaining: Math.max(0, limits.dailyLimit - current),
      resetAt: new Date(lastReset.getTime() + 24 * 60 * 60 * 1000),
    };
  },

  async createWebhook(data: { apiKeyId: string; url: string; events: string[] }): Promise<Webhook> {
    const secret = generateWebhookSecret();
    const [webhook] = await db.insert(webhooks).values({
      apiKeyId: data.apiKeyId,
      url: data.url,
      events: data.events,
      secret,
    }).returning();
    return webhook;
  },

  async getWebhooksByApiKey(apiKeyId: string): Promise<Webhook[]> {
    return db.select().from(webhooks).where(eq(webhooks.apiKeyId, apiKeyId)).orderBy(desc(webhooks.createdAt));
  },

  async getWebhookById(id: string): Promise<Webhook | undefined> {
    const [webhook] = await db.select().from(webhooks).where(eq(webhooks.id, id)).limit(1);
    return webhook;
  },

  async updateWebhook(id: string, data: Partial<Webhook>): Promise<Webhook | undefined> {
    const [webhook] = await db.update(webhooks).set({ ...data, updatedAt: new Date() }).where(eq(webhooks.id, id)).returning();
    return webhook;
  },

  async deleteWebhook(id: string): Promise<void> {
    await db.update(webhooks).set({ isActive: false }).where(eq(webhooks.id, id));
  },

  async getWebhooksForEvent(event: string): Promise<Webhook[]> {
    const allWebhooks = await db.select().from(webhooks).where(eq(webhooks.isActive, true));
    return allWebhooks.filter(w => {
      const events = w.events as string[];
      return events.includes(event) || events.includes("*");
    });
  },

  async createWebhookDelivery(data: { webhookId: string; event: string; payload: Record<string, unknown>; responseStatus?: number; responseBody?: string; success?: boolean; attempts?: number }): Promise<WebhookDelivery> {
    const [delivery] = await db.insert(webhookDeliveries).values(data).returning();
    return delivery;
  },

  async getWebhookDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    return db.select().from(webhookDeliveries).where(eq(webhookDeliveries.webhookId, webhookId)).orderBy(desc(webhookDeliveries.deliveredAt)).limit(limit);
  },

  async createIntegrationPartner(data: { apiKeyId: string; name: string; type: string; platform?: string; config?: Record<string, unknown> }): Promise<IntegrationPartner> {
    const [partner] = await db.insert(integrationPartners).values(data).returning();
    return partner;
  },

  async getIntegrationPartners(apiKeyId: string): Promise<IntegrationPartner[]> {
    return db.select().from(integrationPartners).where(eq(integrationPartners.apiKeyId, apiKeyId));
  },

  async createWhiteLabelConfig(data: { apiKeyId: string; brandName: string; primaryColor?: string; secondaryColor?: string; accentColor?: string; logoUrl?: string; customDomain?: string; supportEmail?: string }): Promise<WhiteLabelConfig> {
    const [config] = await db.insert(whiteLabelConfigs).values(data).returning();
    return config;
  },

  async getWhiteLabelConfig(apiKeyId: string): Promise<WhiteLabelConfig | undefined> {
    const [config] = await db.select().from(whiteLabelConfigs).where(eq(whiteLabelConfigs.apiKeyId, apiKeyId)).limit(1);
    return config;
  },

  async updateWhiteLabelConfig(id: string, data: Partial<WhiteLabelConfig>): Promise<WhiteLabelConfig | undefined> {
    const [config] = await db.update(whiteLabelConfigs).set({ ...data, updatedAt: new Date() }).where(eq(whiteLabelConfigs.id, id)).returning();
    return config;
  },

  async createAuditLog(data: { apiKeyId?: string; method: string; path: string; statusCode?: number; requestBody?: Record<string, unknown>; responseTime?: number; ipAddress?: string; userAgent?: string }): Promise<ApiAuditLog> {
    const [log] = await db.insert(apiAuditLogs).values(data).returning();
    return log;
  },

  async getAuditLogs(apiKeyId: string, limit = 100): Promise<ApiAuditLog[]> {
    return db.select().from(apiAuditLogs).where(eq(apiAuditLogs.apiKeyId, apiKeyId)).orderBy(desc(apiAuditLogs.createdAt)).limit(limit);
  },

  async createInboundOrder(data: { apiKeyId: string; externalOrderId: string; source: string; customerName: string; customerPhone?: string; customerEmail?: string; deliveryAddress: string; items: { name: string; price: number; quantity: number; isAlcohol?: boolean }[]; subtotal: string; deliveryFee?: string; tip?: string; total: string; specialInstructions?: string; metadata?: Record<string, unknown> }): Promise<InboundOrder> {
    const [order] = await db.insert(inboundOrders).values(data).returning();
    return order;
  },

  async getInboundOrders(apiKeyId: string): Promise<InboundOrder[]> {
    return db.select().from(inboundOrders).where(eq(inboundOrders.apiKeyId, apiKeyId)).orderBy(desc(inboundOrders.createdAt));
  },

  async getInboundOrderById(id: string): Promise<InboundOrder | undefined> {
    const [order] = await db.select().from(inboundOrders).where(eq(inboundOrders.id, id)).limit(1);
    return order;
  },

  async updateInboundOrder(id: string, data: Partial<InboundOrder>): Promise<InboundOrder | undefined> {
    const [order] = await db.update(inboundOrders).set({ ...data, updatedAt: new Date() }).where(eq(inboundOrders.id, id)).returning();
    return order;
  },

  async getAllApiKeys(): Promise<ApiKey[]> {
    return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  },

  async getAllWebhooks(): Promise<Webhook[]> {
    return db.select().from(webhooks).orderBy(desc(webhooks.createdAt));
  },

  async getAllInboundOrders(): Promise<InboundOrder[]> {
    return db.select().from(inboundOrders).orderBy(desc(inboundOrders.createdAt));
  },
};
