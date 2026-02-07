import type { Express, Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import { platformStorage, getTierLimits, signWebhookPayload } from "./platform-storage";
import { dispatchWebhookEvent, verifyWebhookSignature } from "./webhook-engine";
import { storage } from "./storage";
import { z } from "zod";
import type { ApiKey } from "../shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "cryptoeats-secret-key";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "cryptoeats-webhook-default-secret";

interface ApiKeyRequest extends Request {
  apiKey?: ApiKey;
}

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization required" });
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

async function apiKeyMiddleware(req: ApiKeyRequest, res: Response, next: NextFunction): Promise<void> {
  const publicKey = req.headers["x-api-key"] as string;
  const secretKey = req.headers["x-api-secret"] as string;

  if (!publicKey) {
    res.status(401).json({ error: "API key required. Include X-API-Key header." });
    return;
  }

  const apiKey = await platformStorage.getApiKeyByPublicKey(publicKey);
  if (!apiKey) {
    res.status(401).json({ error: "Invalid API key." });
    return;
  }

  if (!apiKey.isActive) {
    res.status(403).json({ error: "API key is deactivated." });
    return;
  }

  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    res.status(403).json({ error: "API key has expired." });
    return;
  }

  if (secretKey) {
    const valid = await platformStorage.validateSecretKey(apiKey, secretKey);
    if (!valid) {
      res.status(401).json({ error: "Invalid API secret." });
      return;
    }
  }

  const rateCheck = await platformStorage.checkRateLimit(apiKey);
  if (!rateCheck.allowed) {
    res.status(429).json({
      error: "Rate limit exceeded.",
      remaining: rateCheck.remaining,
      resetAt: rateCheck.resetAt.toISOString(),
      tier: apiKey.tier,
      upgrade: apiKey.tier !== "enterprise" ? "Upgrade your plan for higher limits." : undefined,
    });
    return;
  }

  await platformStorage.incrementDailyRequests(apiKey.id);
  req.apiKey = apiKey;

  const start = Date.now();
  res.on("finish", () => {
    platformStorage.createAuditLog({
      apiKeyId: apiKey.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: Date.now() - start,
      ipAddress: req.ip || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
    }).catch(() => {});
  });

  res.setHeader("X-RateLimit-Limit", getTierLimits(apiKey.tier).dailyLimit.toString());
  res.setHeader("X-RateLimit-Remaining", rateCheck.remaining.toString());
  res.setHeader("X-RateLimit-Reset", rateCheck.resetAt.toISOString());

  next();
}

function requirePermission(...perms: string[]) {
  return (req: ApiKeyRequest, res: Response, next: NextFunction) => {
    const apiKey = req.apiKey;
    if (!apiKey) {
      res.status(401).json({ error: "API key required." });
      return;
    }
    const keyPerms = (apiKey.permissions as string[]) || [];
    const hasPermission = perms.some(p => keyPerms.includes(p) || keyPerms.includes("admin"));
    if (!hasPermission) {
      res.status(403).json({
        error: `Insufficient permissions. Required: ${perms.join(" or ")}. Your tier: ${apiKey.tier}`,
        upgrade: "Upgrade your plan for additional permissions.",
      });
      return;
    }
    next();
  };
}

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  tier: z.enum(["free", "starter", "pro", "enterprise"]).default("free"),
  isSandbox: z.boolean().default(true),
});

const createWebhookSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
});

const inboundOrderSchema = z.object({
  externalOrderId: z.string().min(1),
  source: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  customerEmail: z.string().email().optional(),
  deliveryAddress: z.string().min(1),
  items: z.array(z.object({
    name: z.string(),
    price: z.number().positive(),
    quantity: z.number().int().positive(),
    isAlcohol: z.boolean().optional(),
  })).min(1),
  subtotal: z.number().positive(),
  deliveryFee: z.number().min(0).optional(),
  tip: z.number().min(0).optional(),
  total: z.number().positive(),
  specialInstructions: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

const whiteLabelSchema = z.object({
  brandName: z.string().min(1),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
  customDomain: z.string().optional(),
  supportEmail: z.string().email().optional(),
});

export function registerPlatformRoutes(app: Express): void {
  const platformLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: { error: "Too many requests. Please slow down." },
  });

  app.use("/api/v1", platformLimiter);

  // =================== API KEY MANAGEMENT (JWT AUTH) ===================
  app.post("/api/developer/keys", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const data = createApiKeySchema.parse(req.body);
      const result = await platformStorage.createApiKey({
        userId: req.user!.id,
        name: data.name,
        tier: data.tier,
        isSandbox: data.isSandbox,
      });
      res.status(201).json({
        message: "API key created. Save your secret key - it won't be shown again.",
        publicKey: result.apiKey.publicKey,
        secretKey: result.secretKey,
        tier: result.apiKey.tier,
        rateLimit: getTierLimits(result.apiKey.tier),
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/developer/keys", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      res.json(keys.map(k => ({
        id: k.id,
        name: k.name,
        publicKey: k.publicKey,
        tier: k.tier,
        isActive: k.isActive,
        isSandbox: k.isSandbox,
        dailyRequests: k.dailyRequests,
        rateLimit: k.rateLimit,
        permissions: k.permissions,
        lastUsedAt: k.lastUsedAt,
        createdAt: k.createdAt,
      })));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/developer/keys/:id/rotate", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const result = await platformStorage.rotateApiKey(req.params.id as string);
      if (!result) return res.status(404).json({ error: "API key not found" });
      res.json({
        message: "API key rotated. Save your new credentials.",
        publicKey: result.apiKey.publicKey,
        secretKey: result.secretKey,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/developer/keys/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const key = await platformStorage.deactivateApiKey(req.params.id as string);
      if (!key) return res.status(404).json({ error: "API key not found" });
      res.json({ message: "API key deactivated." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =================== WEBHOOK MANAGEMENT (JWT AUTH) ===================
  app.post("/api/developer/webhooks", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const data = createWebhookSchema.parse(req.body);
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      if (keys.length === 0) return res.status(400).json({ error: "Create an API key first." });
      const webhook = await platformStorage.createWebhook({
        apiKeyId: keys[0].id,
        url: data.url,
        events: data.events,
      });
      res.status(201).json({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        message: "Save this webhook secret for signature verification.",
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/developer/webhooks", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      if (keys.length === 0) return res.json([]);
      const allWebhooks = [];
      for (const key of keys) {
        const wh = await platformStorage.getWebhooksByApiKey(key.id);
        allWebhooks.push(...wh);
      }
      res.json(allWebhooks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/developer/webhooks/:id/deliveries", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const deliveries = await platformStorage.getWebhookDeliveries(req.params.id as string);
      res.json(deliveries);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/developer/webhooks/:id/test", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const webhook = await platformStorage.getWebhookById(req.params.id as string);
      if (!webhook) return res.status(404).json({ error: "Webhook not found" });
      await dispatchWebhookEvent("test.ping", {
        message: "This is a test webhook delivery from CryptoEats.",
        timestamp: new Date().toISOString(),
      });
      res.json({ message: "Test webhook dispatched." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/developer/webhooks/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      await platformStorage.deleteWebhook(req.params.id as string);
      res.json({ message: "Webhook deactivated." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =================== AUDIT LOGS (JWT AUTH) ===================
  app.get("/api/developer/audit-logs", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      if (keys.length === 0) return res.json([]);
      const logs = await platformStorage.getAuditLogs(keys[0].id);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =================== WHITE-LABEL CONFIG (JWT AUTH) ===================
  app.post("/api/developer/whitelabel", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const data = whiteLabelSchema.parse(req.body);
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      const proKey = keys.find(k => k.tier === "enterprise" || k.tier === "pro");
      if (!proKey) return res.status(403).json({ error: "White-label requires Pro or Enterprise tier." });
      const config = await platformStorage.createWhiteLabelConfig({ apiKeyId: proKey.id, ...data });
      res.status(201).json(config);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/developer/whitelabel", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      if (keys.length === 0) return res.json(null);
      const config = await platformStorage.getWhiteLabelConfig(keys[0].id);
      res.json(config || null);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/developer/whitelabel/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const data = whiteLabelSchema.partial().parse(req.body);
      const config = await platformStorage.updateWhiteLabelConfig(req.params.id as string, data);
      res.json(config);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // =================== INTEGRATION PARTNERS (JWT AUTH) ===================
  app.post("/api/developer/integrations", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      if (keys.length === 0) return res.status(400).json({ error: "Create an API key first." });
      const partner = await platformStorage.createIntegrationPartner({
        apiKeyId: keys[0].id,
        name: req.body.name,
        type: req.body.type,
        platform: req.body.platform,
        config: req.body.config,
      });
      res.status(201).json(partner);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/developer/integrations", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user!.id);
      if (keys.length === 0) return res.json([]);
      const allPartners = [];
      for (const key of keys) {
        const partners = await platformStorage.getIntegrationPartners(key.id);
        allPartners.push(...partners);
      }
      res.json(allPartners);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // =================== PLATFORM API v1 (API KEY AUTH) ===================

  // --- Restaurants ---
  app.get("/api/v1/restaurants", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const { cuisine, search, featured } = req.query;
      const filters: any = {};
      if (cuisine) filters.cuisine = cuisine as string;
      if (search) filters.search = search as string;
      if (featured !== undefined) filters.featured = featured === "true";
      const results = await storage.getAllRestaurants(filters);
      res.json({ data: results, meta: { count: results.length, sandbox: req.apiKey!.isSandbox } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/restaurants/:id", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const restaurant = await storage.getRestaurantById(req.params.id as string);
      if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
      res.json({ data: restaurant });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/restaurants/:id/menu", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const items = await storage.getMenuItems(req.params.id as string);
      res.json({ data: items, meta: { count: items.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Orders ---
  app.get("/api/v1/orders", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json({ data: allOrders, meta: { count: allOrders.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/orders/:id", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const order = await storage.getOrderById(req.params.id as string);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json({ data: order });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/v1/orders/:id/status", apiKeyMiddleware as any, requirePermission("write") as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required." });
      const order = await storage.updateOrderStatus(req.params.id as string, status);
      if (!order) return res.status(404).json({ error: "Order not found" });

      await dispatchWebhookEvent(`order.${status}`, { orderId: order.id, status, updatedAt: new Date().toISOString() });
      res.json({ data: order });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Drivers ---
  app.get("/api/v1/drivers", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json({
        data: drivers.map(d => ({
          id: d.id,
          firstName: d.firstName,
          lastName: d.lastName,
          isAvailable: d.isAvailable,
          rating: d.rating,
          totalDeliveries: d.totalDeliveries,
          currentLat: d.currentLat,
          currentLng: d.currentLng,
        })),
        meta: { count: drivers.length },
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/drivers/available", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const drivers = await storage.getAvailableDrivers();
      res.json({ data: drivers, meta: { count: drivers.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Tax ---
  app.get("/api/v1/tax/jurisdictions", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const jurisdictions = await storage.getJurisdictions();
      res.json({ data: jurisdictions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/v1/tax/calculate", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const { subtotal, rate } = req.body;
      if (!subtotal) return res.status(400).json({ error: "Subtotal is required." });
      const tax = storage.calculateTax(subtotal, rate || 0.07);
      res.json({ data: tax });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- NFTs ---
  app.get("/api/v1/nft/marketplace", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const listings = await storage.getActiveNftListings();
      res.json({ data: listings, meta: { count: listings.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Inbound Orders (from external systems) ---
  app.post("/api/v1/integrations/orders/inbound", apiKeyMiddleware as any, requirePermission("write") as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const data = inboundOrderSchema.parse(req.body);

      const hasAlcohol = data.items.some(item => item.isAlcohol);
      if (hasAlcohol) {
        const windows = await storage.getDeliveryWindows();
        const activeWindow = windows.find((w: any) => w.isActive);
        if (activeWindow && !storage.isAlcoholDeliveryAllowed(activeWindow.alcoholStartHour!, activeWindow.alcoholEndHour!)) {
          return res.status(400).json({ error: "Alcohol delivery not available at this time (8 AM - 10 PM only)." });
        }
      }

      const order = await platformStorage.createInboundOrder({
        apiKeyId: req.apiKey!.id,
        externalOrderId: data.externalOrderId,
        source: data.source,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerEmail: data.customerEmail,
        deliveryAddress: data.deliveryAddress,
        items: data.items,
        subtotal: data.subtotal.toString(),
        deliveryFee: (data.deliveryFee || 0).toString(),
        tip: (data.tip || 0).toString(),
        total: data.total.toString(),
        specialInstructions: data.specialInstructions,
        metadata: data.metadata,
      });

      await dispatchWebhookEvent("order.created", {
        orderId: order.id,
        externalOrderId: data.externalOrderId,
        source: data.source,
        type: "inbound",
      });

      res.status(201).json({
        data: order,
        message: "Inbound order received and queued for processing.",
      });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get("/api/v1/integrations/orders/inbound", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const orders = await platformStorage.getInboundOrders(req.apiKey!.id);
      res.json({ data: orders, meta: { count: orders.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/integrations/orders/inbound/:id", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const order = await platformStorage.getInboundOrderById(req.params.id as string);
      if (!order) return res.status(404).json({ error: "Inbound order not found" });
      res.json({ data: order });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Inbound Webhooks (from external POS/systems) ---
  app.post("/api/v1/webhooks/external/order", apiKeyMiddleware as any, requirePermission("write") as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const { orderId, status, source, metadata } = req.body;
      if (!orderId || !status || !source) {
        return res.status(400).json({ error: "orderId, status, and source are required." });
      }

      const order = await platformStorage.getInboundOrderById(orderId);
      if (order) {
        await platformStorage.updateInboundOrder(orderId, { status, metadata });
      }

      await dispatchWebhookEvent("order.updated", { orderId, status, source, external: true });

      res.json({ message: "External order update received.", orderId, status });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/v1/webhooks/external/inventory", apiKeyMiddleware as any, requirePermission("write") as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const { restaurantId, items, source } = req.body;
      if (!restaurantId || !items || !source) {
        return res.status(400).json({ error: "restaurantId, items, and source are required." });
      }

      await dispatchWebhookEvent("inventory.sync", { restaurantId, itemCount: items.length, source });

      res.json({ message: "Inventory sync received.", restaurantId, itemsProcessed: items.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Platform Info ---
  app.get("/api/v1/platform/status", async (req: Request, res: Response) => {
    res.json({
      platform: "CryptoEats",
      version: "1.0.0",
      status: "operational",
      features: {
        ordering: true,
        delivery: true,
        blockchain: true,
        nft: true,
        escrow: true,
        onramp: true,
        webhooks: true,
        whiteLabel: true,
      },
      tiers: {
        free: { price: "$0/mo", rateLimit: "1,000 requests/day", features: ["Read-only API access", "Basic restaurant data"] },
        starter: { price: "$99/mo", rateLimit: "10,000 requests/day", features: ["Read + Write access", "Order management", "Basic webhooks"] },
        pro: { price: "$499/mo", rateLimit: "100,000 requests/day", features: ["Full API access", "Webhooks", "Embeddable widgets", "Priority support"] },
        enterprise: { price: "Custom", rateLimit: "1,000,000 requests/day", features: ["Unlimited access", "White-label", "Custom integrations", "Dedicated support", "SLA"] },
      },
      endpoints: {
        base: "/api/v1",
        docs: "/api-docs",
        developer_portal: "/developers",
      },
    });
  });

  // --- Tier & Usage Info ---
  app.get("/api/v1/usage", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const key = req.apiKey!;
      const limits = getTierLimits(key.tier);
      const rateCheck = await platformStorage.checkRateLimit(key);
      res.json({
        tier: key.tier,
        dailyRequests: key.dailyRequests,
        dailyLimit: limits.dailyLimit,
        remaining: rateCheck.remaining,
        resetAt: rateCheck.resetAt.toISOString(),
        permissions: key.permissions,
        isSandbox: key.isSandbox,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Widget Config ---
  app.get("/api/v1/widget/config", apiKeyMiddleware as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const whiteLabelConfig = await platformStorage.getWhiteLabelConfig(req.apiKey!.id);
      const restaurants = await storage.getAllRestaurants({ featured: true });
      res.json({
        brandName: whiteLabelConfig?.brandName || "CryptoEats",
        primaryColor: whiteLabelConfig?.primaryColor || "#FF6B00",
        secondaryColor: whiteLabelConfig?.secondaryColor || "#1A1A2E",
        accentColor: whiteLabelConfig?.accentColor || "#00D4AA",
        logoUrl: whiteLabelConfig?.logoUrl || null,
        restaurants: restaurants.slice(0, 6).map(r => ({
          id: r.id,
          name: r.name,
          cuisineType: r.cuisineType,
          rating: r.rating,
          deliveryFee: r.deliveryFee,
          imageUrl: r.imageUrl,
        })),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Admin: View all platform data ---
  app.get("/api/v1/admin/api-keys", apiKeyMiddleware as any, requirePermission("admin") as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const keys = await platformStorage.getAllApiKeys();
      res.json({ data: keys, meta: { count: keys.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/admin/webhooks", apiKeyMiddleware as any, requirePermission("admin") as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const wh = await platformStorage.getAllWebhooks();
      res.json({ data: wh, meta: { count: wh.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/v1/admin/inbound-orders", apiKeyMiddleware as any, requirePermission("admin") as any, async (req: ApiKeyRequest, res: Response) => {
    try {
      const orders = await platformStorage.getAllInboundOrders();
      res.json({ data: orders, meta: { count: orders.length } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}

export { dispatchWebhookEvent };
