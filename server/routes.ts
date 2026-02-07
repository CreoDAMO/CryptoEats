import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import {
  registerSchema, loginSchema, createOrderSchema, rateOrderSchema,
} from "../shared/schema";

const JWT_SECRET = process.env.SESSION_SECRET || "cryptoeats-secret-key";

function getParam(val: string | string[]): string {
  return Array.isArray(val) ? val[0] : val;
}

interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

function generateToken(user: { id: string; email: string; role: string }): string {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
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

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later" },
});

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();

  // =================== AUTH ===================
  app.post("/api/auth/register", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const passwordHash = await bcrypt.hash(data.password, 10);
      const user = await storage.createUser({ email: data.email, passwordHash, phone: data.phone, role: data.role });

      if (data.role === "driver") {
        await storage.createDriver({ userId: user.id, firstName: data.firstName, lastName: data.lastName });
      } else {
        await storage.createCustomer({ userId: user.id, firstName: data.firstName, lastName: data.lastName });
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", authLimiter, async (req: Request, res: Response) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Login failed" });
    }
  });

  app.post("/api/auth/refresh-token", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const token = generateToken(req.user!);
      res.json({ token, user: req.user });
    } catch (err: any) {
      res.status(400).json({ message: "Token refresh failed" });
    }
  });

  // =================== RESTAURANTS ===================
  app.get("/api/restaurants", async (req: Request, res: Response) => {
    try {
      const { cuisine, search, featured } = req.query;
      const filters: any = {};
      if (cuisine) filters.cuisine = cuisine as string;
      if (search) filters.search = search as string;
      if (featured !== undefined) filters.featured = featured === "true";
      const results = await storage.getAllRestaurants(filters);
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/restaurants/:id/menu", async (req: Request, res: Response) => {
    try {
      const items = await storage.getMenuItems(getParam(getParam(req.params.id)));
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== ORDERS ===================
  app.post("/api/orders", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const data = createOrderSchema.parse(req.body);
      const customer = await storage.getCustomerByUserId(req.user!.id);
      if (!customer) return res.status(404).json({ message: "Customer profile not found" });

      const hasAlcohol = data.items.some(item => item.isAlcohol);

      if (hasAlcohol) {
        if (!data.ageVerified) {
          return res.status(400).json({ message: "Age verification required for alcohol orders" });
        }
        const windows = await storage.getDeliveryWindows();
        const activeWindow = windows.find(w => w.isActive);
        if (activeWindow && !storage.isAlcoholDeliveryAllowed(activeWindow.alcoholStartHour!, activeWindow.alcoholEndHour!)) {
          return res.status(400).json({ message: "Alcohol delivery is not available at this time" });
        }
      }

      const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const restaurant = await storage.getRestaurantById(data.restaurantId);
      const deliveryFee = parseFloat(restaurant?.deliveryFee || "2.99");
      const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
      const tax = storage.calculateTax(subtotal);
      const total = Math.round((subtotal + deliveryFee + serviceFee + data.tip + tax.taxAmount) * 100) / 100;

      const order = await storage.createOrder({
        customerId: customer.id,
        restaurantId: data.restaurantId,
        items: data.items,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        tip: data.tip.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: data.paymentMethod,
        deliveryAddress: data.deliveryAddress,
        specialInstructions: data.specialInstructions || null,
        requiresAgeVerification: hasAlcohol,
        taxableAmount: tax.taxableAmount.toFixed(2),
        taxCollected: tax.taxAmount.toFixed(2),
        taxRate: tax.taxRate.toFixed(4),
        eta: restaurant?.estimatedPrepTime || "25-35 min",
      });

      await storage.createTaxTransaction({
        orderId: order.id,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        taxableAmount: tax.taxableAmount.toFixed(2),
        taxRate: tax.taxRate.toFixed(4),
        taxCollected: tax.taxAmount.toFixed(2),
        paymentMethod: data.paymentMethod,
      });

      res.status(201).json(order);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Order creation failed" });
    }
  });

  app.get("/api/orders", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user!.id);
      if (!customer) return res.status(404).json({ message: "Customer profile not found" });
      const orders = await storage.getOrdersByCustomerId(customer.id);
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/orders/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const order = await storage.getOrderById(getParam(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/orders/:id/rate", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const data = rateOrderSchema.parse(req.body);
      const order = await storage.getOrderById(getParam(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      const customer = await storage.getCustomerByUserId(req.user!.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });

      const review = await storage.createReview({
        orderId: order.id,
        customerId: customer.id,
        restaurantId: order.restaurantId,
        driverId: order.driverId,
        restaurantRating: data.restaurantRating,
        driverRating: data.driverRating,
        comment: data.comment,
      });
      res.status(201).json(review);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // =================== RECOMMENDATIONS ===================
  app.get("/api/recommendations", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user!.id);
      const preferences = customer?.tastePreferences || [];
      const restaurants_list = await storage.getAllRestaurants({ featured: true });
      const recommendations = restaurants_list.slice(0, 5).map(r => ({
        restaurant: r,
        reason: preferences.length > 0
          ? `Based on your love of ${preferences[0]} cuisine`
          : `Top rated ${r.cuisineType} restaurant`,
        pairingSuggestion: `Try their signature dishes with a craft beverage`,
      }));
      res.json({ recommendations, sommelierNote: "Curated picks for your palate" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== ID VERIFICATION ===================
  app.post("/api/id-verification", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user!.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const verification = await storage.createIdVerification({
        customerId: customer.id,
        orderId: req.body.orderId || null,
        scanData: req.body.scanData || null,
        verified: req.body.verified || false,
        method: req.body.method || "checkout",
      });
      res.status(201).json(verification);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // =================== CUSTOMER FAVORITES ===================
  app.post("/api/customers/favorites/restaurant/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const updated = await storage.toggleFavoriteRestaurant(req.user!.id, getParam(req.params.id));
      if (!updated) return res.status(404).json({ message: "Customer not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/customers/favorites/item/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const updated = await storage.toggleFavoriteItem(req.user!.id, getParam(req.params.id));
      if (!updated) return res.status(404).json({ message: "Customer not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== CUSTOMER PROFILE ===================
  app.get("/api/customers/profile", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user!.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/customers/profile", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user!.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const updated = await storage.updateCustomer(customer.id, req.body);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== DRIVER ENDPOINTS ===================
  app.get("/api/driver/available-orders", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const orders = await storage.getPendingOrders();
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/driver/orders/:id/accept", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await storage.getDriverByUserId(req.user!.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const order = await storage.assignDriver(getParam(req.params.id), driver.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/driver/orders/:id/status", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { status } = req.body;
      const extra: any = {};
      if (status === "delivered") extra.deliveredAt = new Date();
      const order = await storage.updateOrderStatus(getParam(req.params.id), status, extra);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/driver/orders/:id/verify-age", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const order = await storage.updateOrderStatus(getParam(req.params.id), undefined as any, {
        ageVerifiedAtDelivery: true,
        signatureData: req.body.signatureData || null,
      });
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/driver/earnings", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await storage.getDriverByUserId(req.user!.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const earnings = await storage.getDriverEarnings(driver.id);
      res.json(earnings);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/driver/status", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await storage.getDriverByUserId(req.user!.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const status = await storage.getDriverStatus(driver.id);
      res.json({ driver, status: status || { status: "active", engagementTier: "active" } });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/driver/support", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await storage.getDriverByUserId(req.user!.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const log = await storage.createDriverSupportLog({
        driverId: driver.id,
        interactionType: req.body.interactionType || "appeal",
        notes: req.body.notes,
        outcome: req.body.outcome || "pending",
        supportRep: req.body.supportRep || null,
      });
      res.status(201).json(log);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/driver/break", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await storage.getDriverByUserId(req.user!.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const status = await storage.updateDriverStatus(driver.id, {
        status: req.body.onBreak ? "on_break" : "active",
        engagementTier: req.body.onBreak ? "on_break" : "active",
      });
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/driver/location", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await storage.getDriverByUserId(req.user!.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const updated = await storage.updateDriverLocation(driver.id, req.body.lat, req.body.lng);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/driver/availability", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const driver = await storage.getDriverByUserId(req.user!.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const updated = await storage.updateDriverAvailability(driver.id, req.body.isAvailable);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== PAYMENT STUBS ===================
  app.post("/api/payments/stripe/create-intent", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    res.json({
      clientSecret: `pi_stub_${Date.now()}_secret`,
      paymentIntentId: `pi_stub_${Date.now()}`,
      amount: req.body.amount,
      currency: "usd",
    });
  });

  app.post("/api/payments/cashapp/create", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    res.json({
      paymentId: `cashapp_${Date.now()}`,
      status: "pending",
      amount: req.body.amount,
      redirectUrl: "https://cash.app/pay",
    });
  });

  app.post("/api/payments/coinbase/create-charge", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    res.json({
      chargeId: `crypto_${Date.now()}`,
      status: "pending",
      amount: req.body.amount,
      currency: req.body.currency || "BTC",
      paymentUri: "bitcoin:stub-address",
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
    });
  });

  // =================== TAX ===================
  app.post("/api/tax/calculate", async (req: Request, res: Response) => {
    try {
      const { subtotal, rate } = req.body;
      const result = storage.calculateTax(parseFloat(subtotal), rate ? parseFloat(rate) : undefined);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/tax/jurisdictions", async (_req: Request, res: Response) => {
    try {
      const jurisdictions = await storage.getJurisdictions();
      res.json(jurisdictions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/tax/reports", async (_req: Request, res: Response) => {
    try {
      const summary = await storage.getTaxSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== ADMIN ===================
  app.get("/api/admin/restaurants", async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllRestaurants();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/restaurants/:id/approve", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateRestaurant(getParam(req.params.id), { isApproved: true });
      if (!updated) return res.status(404).json({ message: "Restaurant not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/drivers", async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllDrivers();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/drivers/:id/approve", async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateDriver(getParam(req.params.id), { backgroundCheckStatus: "approved" });
      if (!updated) return res.status(404).json({ message: "Driver not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/orders", async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllOrders();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/tax/summary", async (_req: Request, res: Response) => {
    try {
      const summary = await storage.getTaxSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/tax/file", async (req: Request, res: Response) => {
    try {
      const remittance = await storage.createRemittance({
        jurisdictionId: req.body.jurisdictionId || null,
        periodStart: new Date(req.body.periodStart || Date.now() - 30 * 86400000),
        periodEnd: new Date(req.body.periodEnd || Date.now()),
        totalCollected: req.body.totalCollected || "0",
        remittanceStatus: "filed",
        filedDate: new Date(),
      });
      res.status(201).json(remittance);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/admin/compliance", async (_req: Request, res: Response) => {
    try {
      const logs = await storage.getComplianceLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/delivery-windows", async (req: Request, res: Response) => {
    try {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ message: "Window ID required" });
      const updated = await storage.updateDeliveryWindow(id, data);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/drivers/status", async (_req: Request, res: Response) => {
    try {
      const statuses = await storage.getAllDriverStatuses();
      res.json(statuses);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== CHAT ===================
  app.get("/api/chat/:orderId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const messages = await storage.getChatMessages(getParam(req.params.orderId));
      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/chat/:orderId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const message = await storage.createChatMessage({
        orderId: getParam(req.params.orderId),
        senderId: req.user!.id,
        message: req.body.message,
        type: req.body.type || "text",
      });
      res.status(201).json(message);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // =================== HTTP & SOCKET.IO ===================
  const httpServer = createServer(app);

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join:order", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("driver:location:update", (data: { orderId: string; lat: number; lng: number }) => {
      io.to(`order:${data.orderId}`).emit("driver:location:update", data);
    });

    socket.on("order:status:changed", (data: { orderId: string; status: string }) => {
      io.to(`order:${data.orderId}`).emit("order:status:changed", data);
    });

    socket.on("chat:message", async (data: { orderId: string; senderId: string; message: string }) => {
      try {
        const msg = await storage.createChatMessage({
          orderId: data.orderId,
          senderId: data.senderId,
          message: data.message,
        });
        io.to(`order:${data.orderId}`).emit("chat:message", msg);
      } catch (err) {
        console.error("Chat message error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });

  return httpServer;
}
