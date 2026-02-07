import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import {
  registerSchema, loginSchema, createOrderSchema, rateOrderSchema,
  merchantOnboardingSchema, driverOnboardingSchema,
} from "../shared/schema";
import {
  getUSDCBalance, getBaseBalance, prepareEscrowDeposit, verifyTransaction,
  prepareNFTMint, BASE_CHAIN_ID, MARKETPLACE_NFT_ADDRESS, MARKETPLACE_ESCROW_ADDRESS,
  validateChainId, isContractAllowlisted, getContractInfo, getAllowlistedContracts,
  isGasSponsored, estimateGas, getPaymasterStatus, classifyPaymasterError,
  prepareEscrowRelease, prepareEscrowDispute, prepareAdminRefund, getEscrowDetails,
  type PaymasterError,
} from "./blockchain";
import {
  createPaymentIntent, capturePayment, cancelPayment, createRefund,
  getPaymentStatus, isStripeConfigured, constructWebhookEvent,
} from "./services/payments";
import {
  sendEmail, sendSMS, sendPushNotification,
  isSendGridConfigured, isTwilioConfigured,
  buildOrderConfirmationEmail, buildOrderStatusEmail, buildOrderStatusSMS,
} from "./services/notifications";
import { saveUpload, validateUpload, getUploadCategories } from "./services/uploads";
import { setupTrackingSocket, getOrderDriverLocation, getActiveDriverCount, getAllActiveDrivers, getDirectionsETA, assignDriverToOrder } from "./services/tracking";
import { reportError } from "./services/monitoring";
import {
  startIdentityVerification, handleVerificationWebhook, handleCheckrWebhook,
  getVerificationStatus, checkAlcoholEligibility, isPersonaConfigured, isCheckrConfigured,
} from "./services/verification";
import { initCache, getCachedMenu, getCachedRestaurants, invalidateMenuCache, invalidateRestaurantsCache, getCacheStats } from "./services/cache";
import {
  getPresignedUploadUrl, getPresignedDownloadUrl, uploadToCloud, deleteFromCloud,
  validateCloudUpload, isS3Configured, getCloudStorageStatus,
} from "./services/cloud-storage";

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

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export async function registerRoutes(app: Express): Promise<Server> {
  await seedDatabase();
  await initCache();

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
        await storage.createOnboardingApplication({ userId: user.id, role: "driver" });
      } else if (data.role === "restaurant") {
        await storage.createOnboardingApplication({ userId: user.id, role: "restaurant" });
      } else {
        await storage.createCustomer({ userId: user.id, firstName: data.firstName, lastName: data.lastName });
      }

      // Auto-create embedded wallet for new users
      const walletPlaceholder = `0x${Array.from({length: 40}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
      await storage.createWallet({
        userId: user.id,
        walletAddress: walletPlaceholder,
        walletType: "embedded",
        chainId: 8453,
      });

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

  // =================== ONBOARDING ===================
  app.get("/api/onboarding/status", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const onboarding = await storage.getOnboardingByUserId(req.user!.id);
      if (!onboarding) {
        return res.json({ status: "none", message: "No onboarding application found" });
      }
      res.json(onboarding);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to fetch onboarding status" });
    }
  });

  app.post("/api/onboarding/merchant", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "restaurant") {
        return res.status(403).json({ message: "Only restaurant accounts can complete merchant onboarding" });
      }
      const data = merchantOnboardingSchema.parse(req.body);
      let onboarding = await storage.getOnboardingByUserId(req.user!.id);
      if (!onboarding) {
        onboarding = await storage.createOnboardingApplication({ userId: req.user!.id, role: "restaurant" });
      }

      const updated = await storage.updateOnboarding(onboarding.id, {
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        businessPhone: data.businessPhone,
        einNumber: data.einNumber || null,
        cuisineType: data.cuisineType,
        hasAlcoholLicense: data.hasAlcoholLicense,
        alcoholLicenseNumber: data.alcoholLicenseNumber || null,
        operatingHoursData: data.operatingHours || null,
        agreementSigned: data.agreementSigned,
        agreementSignedAt: data.agreementSigned ? new Date() : null,
        status: "pending_review",
        step: 3,
      });

      if (data.agreementSigned) {
        await storage.createAgreement({
          entityType: "restaurant",
          entityId: req.user!.id,
          agreementType: "merchant_onboarding",
          agreementText: "CryptoEats Merchant Partner Agreement — I agree to the terms of service, SB 676 compliance requirements, and platform fee structure.",
          signatureData: `digital-signature-${req.user!.email}-${Date.now()}`,
          ipAddress: (req.ip as string) || "unknown",
        });
      }

      res.json({ message: "Merchant onboarding submitted for review", application: updated });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Merchant onboarding failed" });
    }
  });

  app.post("/api/onboarding/driver", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "driver") {
        return res.status(403).json({ message: "Only driver accounts can complete driver onboarding" });
      }
      const data = driverOnboardingSchema.parse(req.body);
      let onboarding = await storage.getOnboardingByUserId(req.user!.id);
      if (!onboarding) {
        onboarding = await storage.createOnboardingApplication({ userId: req.user!.id, role: "driver" });
      }

      const updated = await storage.updateOnboarding(onboarding.id, {
        licenseNumber: data.licenseNumber,
        vehicleType: data.vehicleType,
        vehicleMake: data.vehicleMake,
        vehicleModel: data.vehicleModel,
        vehicleYear: data.vehicleYear,
        vehicleColor: data.vehicleColor,
        licensePlate: data.licensePlate,
        insuranceProvider: data.insuranceProvider,
        insurancePolicyNumber: data.insurancePolicyNumber,
        insuranceExpiry: data.insuranceExpiry,
        backgroundCheckConsent: data.backgroundCheckConsent,
        agreementSigned: data.agreementSigned,
        agreementSignedAt: data.agreementSigned ? new Date() : null,
        status: "pending_review",
        step: 4,
      });

      const driverRecords = await storage.getDriverByUserId(req.user!.id);
      if (driverRecords) {
        await storage.updateDriver(driverRecords.id, {
          licenseNumber: data.licenseNumber,
          vehicleInfo: `${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel} (${data.vehicleColor})`,
          insuranceData: {
            policyNumber: data.insurancePolicyNumber,
            expiryDate: data.insuranceExpiry,
            provider: data.insuranceProvider,
          },
        });
      }

      if (data.agreementSigned) {
        await storage.createAgreement({
          entityType: "driver",
          entityId: req.user!.id,
          agreementType: "independent_contractor",
          agreementText: "CryptoEats Independent Contractor Agreement — I acknowledge independent contractor status, agree to the Human-First policy, and consent to background check processing.",
          signatureData: `digital-signature-${req.user!.email}-${Date.now()}`,
          ipAddress: (req.ip as string) || "unknown",
        });
      }

      res.json({ message: "Driver onboarding submitted for review", application: updated });
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Driver onboarding failed" });
    }
  });

  app.put("/api/onboarding/step", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { step } = req.body;
      const onboarding = await storage.getOnboardingByUserId(req.user!.id);
      if (!onboarding) {
        return res.status(404).json({ message: "No onboarding application found" });
      }
      const updated = await storage.updateOnboarding(onboarding.id, {
        step: step,
        status: "in_progress",
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to update step" });
    }
  });

  app.get("/api/admin/onboarding", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const applications = await storage.getAllOnboardings();
      res.json(applications);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch onboarding applications" });
    }
  });

  app.get("/api/admin/onboarding/pending", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const applications = await storage.getPendingOnboardings();
      res.json(applications);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to fetch pending applications" });
    }
  });

  app.put("/api/admin/onboarding/:id/review", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = req.params.id as string;
      const { status, reviewNotes } = req.body;
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
      }
      const onboarding = await storage.getOnboardingById(id);
      if (!onboarding) {
        return res.status(404).json({ message: "Application not found" });
      }

      const updated = await storage.updateOnboarding(id, {
        status,
        reviewNotes: reviewNotes || null,
        reviewedBy: req.user!.id,
        reviewedAt: new Date(),
      });

      if (status === "approved" && onboarding.role === "restaurant" && onboarding.businessName) {
        await storage.createRestaurant({
          userId: onboarding.userId,
          name: onboarding.businessName,
          cuisineType: onboarding.cuisineType || "General",
          address: onboarding.businessAddress || "",
          phone: onboarding.businessPhone || "",
          alcoholLicense: onboarding.hasAlcoholLicense || false,
          operatingHours: onboarding.operatingHoursData || { open: "09:00", close: "22:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
          isApproved: true,
          agreementSignedDate: onboarding.agreementSignedAt,
        });
      }

      if (status === "approved" && onboarding.role === "driver") {
        const driver = await storage.getDriverByUserId(onboarding.userId);
        if (driver) {
          await storage.updateDriver(driver.id, { backgroundCheckStatus: "approved" });
        }
      }

      await storage.createComplianceLog({
        type: "agreement",
        entityId: onboarding.userId,
        details: { action: `onboarding_${status}`, role: onboarding.role, reviewNotes },
        status,
      });

      res.json({ message: `Application ${status}`, application: updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Review failed" });
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
      const hasFilters = cuisine || search || featured !== undefined;
      if (hasFilters) {
        const results = await storage.getAllRestaurants(filters);
        return res.json(results);
      }
      const results = await getCachedRestaurants(() => storage.getAllRestaurants(filters));
      res.json(results);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/restaurants/:id/menu", async (req: Request, res: Response) => {
    try {
      const restaurantId = getParam(req.params.id);
      const items = await getCachedMenu(restaurantId, () => storage.getMenuItems(restaurantId));
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

  // =================== BLOCKCHAIN: WALLETS ===================
  app.post("/api/wallet/connect", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { walletAddress, walletType, chainId } = req.body;
      if (!walletAddress) return res.status(400).json({ message: "walletAddress is required" });
      const existing = await storage.getWalletByAddress(walletAddress);
      if (existing) {
        return res.json(existing);
      }
      const wallet = await storage.createWallet({
        userId: req.user!.id,
        walletAddress,
        walletType: walletType || "coinbase",
        chainId: chainId || 8453,
      });
      res.status(201).json(wallet);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to connect wallet" });
    }
  });

  app.get("/api/wallet/balance/:address", async (req: Request, res: Response) => {
    try {
      const address = getParam(req.params.address);
      const [usdc, eth] = await Promise.all([
        getUSDCBalance(address),
        getBaseBalance(address),
      ]);
      res.json({ usdc, eth, chainId: BASE_CHAIN_ID });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to get balance" });
    }
  });

  app.get("/api/wallet/me", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const wallets = await storage.getWalletsByUserId(req.user!.id);
      res.json(wallets);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== BLOCKCHAIN: ESCROW ===================
  app.post("/api/escrow/prepare", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, sellerAddress, amount, timeout } = req.body;
      if (!orderId || !sellerAddress || !amount) {
        return res.status(400).json({ message: "orderId, sellerAddress, and amount are required" });
      }
      const txData = prepareEscrowDeposit(orderId, sellerAddress, amount.toString(), timeout || 86400);
      res.json({
        ...txData,
        message: txData.gasSponsored
          ? "Gas fees are sponsored by Base Paymaster. No ETH needed."
          : "This transaction requires ETH for gas fees.",
      });
    } catch (err: any) {
      const classified = err.paymasterError || classifyPaymasterError(err);
      res.status(400).json({
        message: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
        suggestion: classified.suggestion,
      });
    }
  });

  app.post("/api/escrow/confirm", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, txHash, depositorAddress, sellerAddress, amount } = req.body;
      if (!orderId || !txHash || !depositorAddress || !sellerAddress || !amount) {
        return res.status(400).json({ message: "orderId, txHash, depositorAddress, sellerAddress, and amount are required" });
      }
      const verification = await verifyTransaction(txHash);
      const escrow = await storage.createEscrowTransaction({
        orderId,
        depositorAddress,
        sellerAddress,
        amount: amount.toString(),
        txHash,
        status: verification.success ? "deposited" : "deposited",
        chainId: BASE_CHAIN_ID,
      });
      res.status(201).json(escrow);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to confirm escrow" });
    }
  });

  app.post("/api/escrow/release", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const escrow = await storage.getEscrowByOrderId(orderId);
      if (!escrow) return res.status(404).json({ message: "Escrow not found for this order" });
      const updated = await storage.updateEscrowStatus(escrow.id, "released", { releasedAt: new Date() });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to release escrow" });
    }
  });

  app.get("/api/escrow/order/:orderId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const escrow = await storage.getEscrowByOrderId(getParam(req.params.orderId));
      res.json(escrow || null);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/escrow/history", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const transactions = await storage.getEscrowTransactions(req.user!.id);
      res.json(transactions);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== BLOCKCHAIN: NFT REWARDS ===================
  app.get("/api/nft/my", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const nfts = await storage.getNftsByUserId(req.user!.id);
      res.json(nfts);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/nft/milestones", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const customerMilestones = [
        { count: 10, name: "Foodie Explorer", type: "customer" },
        { count: 25, name: "Crypto Connoisseur", type: "customer" },
        { count: 50, name: "Diamond Diner", type: "customer" },
        { count: 100, name: "CryptoEats Legend", type: "customer" },
      ];
      const driverMilestones = [
        { count: 10, name: "Rising Star", type: "driver" },
        { count: 50, name: "Road Warrior", type: "driver" },
        { count: 100, name: "Delivery Hero", type: "driver" },
        { count: 500, name: "Legendary Driver", type: "driver" },
      ];

      let orderCount = 0;
      let deliveryCount = 0;

      const customer = await storage.getCustomerByUserId(req.user!.id);
      if (customer) {
        const customerOrders = await storage.getOrdersByCustomerId(customer.id);
        orderCount = customerOrders.filter(o => o.status === "delivered").length;
      }

      const driver = await storage.getDriverByUserId(req.user!.id);
      if (driver) {
        deliveryCount = driver.totalDeliveries || 0;
      }

      const existingNfts = await storage.getNftsByUserId(req.user!.id);
      const earnedNames = existingNfts.map(n => n.name);

      const allMilestones = [...customerMilestones, ...driverMilestones].map(m => ({
        ...m,
        earned: earnedNames.includes(m.name),
        progress: m.type === "customer"
          ? Math.min(orderCount / m.count, 1)
          : Math.min(deliveryCount / m.count, 1),
      }));

      res.json({
        milestones: allMilestones,
        progress: { orders: orderCount, deliveries: deliveryCount },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/nft/mint", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { nftRewardId } = req.body;
      if (!nftRewardId) return res.status(400).json({ message: "nftRewardId is required" });
      const nft = await storage.getNftsByUserId(req.user!.id);
      const reward = nft.find(n => n.id === nftRewardId);
      if (!reward) return res.status(404).json({ message: "NFT reward not found" });

      const userWallets = await storage.getWalletsByUserId(req.user!.id);
      if (userWallets.length === 0) return res.status(400).json({ message: "No wallet connected" });

      const walletAddress = userWallets[0].walletAddress;
      const metadataUri = reward.metadataUri || `ipfs://cryptoeats/${reward.milestoneType}/${reward.name}`;
      const mintOrderId = `nft-mint-${nftRewardId}-${Date.now()}`;
      const txData = prepareNFTMint(mintOrderId, walletAddress, walletAddress, metadataUri);
      res.json(txData);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to prepare mint" });
    }
  });

  app.post("/api/nft/confirm-mint", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { nftRewardId, txHash, tokenId } = req.body;
      if (!nftRewardId || !txHash) return res.status(400).json({ message: "nftRewardId and txHash are required" });

      const verification = await verifyTransaction(txHash);
      const updated = await storage.updateNftStatus(nftRewardId, "minted", {
        txHash,
        tokenId: tokenId || null,
        contractAddress: MARKETPLACE_NFT_ADDRESS,
        mintedAt: new Date(),
        chainId: BASE_CHAIN_ID,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to confirm mint" });
    }
  });

  // =================== BLOCKCHAIN: MARKETPLACE ===================
  app.get("/api/marketplace/listings", async (_req: Request, res: Response) => {
    try {
      const listings = await storage.getActiveNftListings();
      const listingsWithNfts = await Promise.all(
        listings.map(async (listing) => {
          const nfts = await storage.getNftsByUserId(listing.sellerUserId);
          const nft = nfts.find(n => n.id === listing.nftId);
          return { ...listing, nft: nft || null };
        })
      );
      res.json(listingsWithNfts);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/marketplace/list", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { nftId, price, currency } = req.body;
      if (!nftId || !price) return res.status(400).json({ message: "nftId and price are required" });

      const userNfts = await storage.getNftsByUserId(req.user!.id);
      const nft = userNfts.find(n => n.id === nftId);
      if (!nft) return res.status(404).json({ message: "NFT not found or not owned by you" });
      if (nft.status !== "minted") return res.status(400).json({ message: "NFT must be minted before listing" });

      const listing = await storage.createNftListing({
        nftId,
        sellerUserId: req.user!.id,
        price: price.toString(),
        currency: currency || "USDC",
        status: "active",
      });

      await storage.updateNftStatus(nftId, "listed", { listedPrice: price.toString() });
      res.status(201).json(listing);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to create listing" });
    }
  });

  app.post("/api/marketplace/buy", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { listingId, txHash } = req.body;
      if (!listingId || !txHash) return res.status(400).json({ message: "listingId and txHash are required" });

      const listing = await storage.getNftListingById(listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.status !== "active") return res.status(400).json({ message: "Listing is not active" });

      const verification = await verifyTransaction(txHash);

      const updated = await storage.updateNftListing(listingId, {
        buyerUserId: req.user!.id,
        status: "sold",
        txHash,
        soldAt: new Date(),
      });

      await storage.updateNftStatus(listing.nftId, "sold");
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message || "Failed to buy NFT" });
    }
  });

  app.delete("/api/marketplace/listing/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const listingId = getParam(req.params.id);
      const listing = await storage.getNftListingById(listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerUserId !== req.user!.id) return res.status(403).json({ message: "Not authorized to cancel this listing" });

      await storage.updateNftListing(listingId, { status: "cancelled" });
      await storage.updateNftStatus(listing.nftId, "minted", { listedPrice: null });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== PHASE 3: COINBASE ONRAMP ===================
  app.get("/api/onramp/buy-options", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const country = (req.query.country as string) || "US";
      const subdivision = (req.query.subdivision as string) || "FL";
      res.json({
        paymentMethods: [
          { id: "CARD", name: "Credit/Debit Card", minAmount: 5, maxAmount: 5000 },
          { id: "APPLE_PAY", name: "Apple Pay", minAmount: 1, maxAmount: 10000 },
          { id: "GOOGLE_PAY", name: "Google Pay", minAmount: 1, maxAmount: 10000 },
          { id: "PAYPAL", name: "PayPal", minAmount: 5, maxAmount: 2500 },
        ],
        purchaseCurrencies: [
          { code: "USDC", name: "USD Coin", network: "base", decimals: 6, minAmount: 1, contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
          { code: "ETH", name: "Ethereum", network: "base", decimals: 18, minAmount: 0.001 },
          { code: "cbBTC", name: "Coinbase Wrapped BTC", network: "base", decimals: 8, minAmount: 0.0001 },
        ],
        country,
        subdivision,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/onramp/buy-quote", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { purchaseCurrency, paymentAmount, paymentCurrency, paymentMethod, network } = req.body;
      if (!purchaseCurrency || !paymentAmount) {
        return res.status(400).json({ message: "purchaseCurrency and paymentAmount are required" });
      }
      const fiatAmount = parseFloat(paymentAmount);
      let rate = 1.0;
      let fee = 0;
      if (purchaseCurrency === "USDC") {
        fee = Math.max(0.99, fiatAmount * 0.015);
        rate = 1.0;
      } else if (purchaseCurrency === "ETH") {
        rate = 0.000385;
        fee = Math.max(0.99, fiatAmount * 0.02);
      } else if (purchaseCurrency === "cbBTC") {
        rate = 0.0000105;
        fee = Math.max(0.99, fiatAmount * 0.02);
      }
      const netAmount = fiatAmount - fee;
      const cryptoAmount = netAmount * rate;
      res.json({
        purchaseCurrency: purchaseCurrency || "USDC",
        purchaseNetwork: network || "base",
        paymentAmount: fiatAmount.toFixed(2),
        paymentCurrency: paymentCurrency || "USD",
        quotePrice: cryptoAmount.toFixed(8),
        coinbaseFee: fee.toFixed(2),
        networkFee: "0.00",
        totalFee: fee.toFixed(2),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        paymentMethod: paymentMethod || "CARD",
        gasless: purchaseCurrency === "USDC" && (network || "base") === "base",
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/onramp/initiate", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { fiatAmount, cryptoCurrency, paymentMethod, walletAddress } = req.body;
      if (!fiatAmount || !walletAddress) {
        return res.status(400).json({ message: "fiatAmount and walletAddress are required" });
      }
      const tx = await storage.createOnrampTransaction({
        userId: req.user!.id,
        walletAddress,
        fiatAmount: fiatAmount.toString(),
        cryptoCurrency: cryptoCurrency || "USDC",
        paymentMethod: paymentMethod || "CARD",
        network: "base",
        status: "pending",
      });
      const onrampUrl = `https://pay.coinbase.com/buy/select-asset?appId=CryptoEats&addresses={"${walletAddress}":["base"]}&assets=["USDC"]&presetFiatAmount=${fiatAmount}&fiatCurrency=USD`;
      res.status(201).json({ transaction: tx, onrampUrl });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/onramp/webhook", async (req: Request, res: Response) => {
    try {
      const { transactionId, status, cryptoAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const tx = await storage.getOnrampTransactionById(transactionId);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      const updateData: any = { status };
      if (cryptoAmount) updateData.cryptoAmount = cryptoAmount.toString();
      if (status === "completed") updateData.completedAt = new Date();
      await storage.updateOnrampTransaction(transactionId, updateData);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/onramp/simulate-complete", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId, cryptoAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const updated = await storage.updateOnrampTransaction(transactionId, {
        status: "completed",
        cryptoAmount: cryptoAmount?.toString() || "0",
        completedAt: new Date(),
        coinbaseTransactionId: `cb_sim_${Date.now()}`,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/onramp/history", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const txs = await storage.getOnrampTransactionsByUser(req.user!.id);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== PUSH NOTIFICATIONS ===================
  app.post("/api/push/register", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { token, platform } = req.body;
      if (!token) return res.status(400).json({ message: "token is required" });
      const saved = await storage.savePushToken(req.user!.id, token, platform);
      res.status(201).json(saved);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.delete("/api/push/unregister", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "token is required" });
      await storage.deactivatePushToken(token);
      res.json({ success: true });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // =================== GASLESS TRANSACTION INFO ===================
  app.get("/api/gasless/info", async (_req: Request, res: Response) => {
    const status = getPaymasterStatus();
    res.json({
      supported: true,
      ...status,
      description: "Gas fees are sponsored for USDC transfers on Base network. No ETH needed for transactions.",
      maxSponsoredAmount: "10000",
      currency: "USDC",
    });
  });

  // =================== CHAIN VALIDATION ===================
  app.post("/api/chain/validate", async (req: Request, res: Response) => {
    const { chainId } = req.body;
    if (!chainId) return res.status(400).json({ message: "chainId is required" });
    const result = validateChainId(Number(chainId));
    res.json(result);
  });

  // =================== CONTRACT ALLOWLIST ===================
  app.get("/api/contracts/allowlist", async (_req: Request, res: Response) => {
    res.json({
      contracts: getAllowlistedContracts(),
      chainId: BASE_CHAIN_ID,
    });
  });

  app.get("/api/contracts/check/:address", async (req: Request, res: Response) => {
    const address = getParam(req.params.address);
    const info = getContractInfo(address);
    res.json({
      address,
      allowlisted: !!info,
      info: info || null,
      gasSponsored: isGasSponsored(address),
    });
  });

  // =================== GAS ESTIMATION ===================
  app.post("/api/gas/estimate", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { from, to, data, value } = req.body;
      if (!from || !to || !data) return res.status(400).json({ message: "from, to, and data are required" });
      const result = await estimateGas(from, to, data, value);
      res.json(result);
    } catch (error: any) {
      const classified = classifyPaymasterError(error);
      res.status(500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
        suggestion: classified.suggestion,
      });
    }
  });

  // =================== PAYMASTER STATUS ===================
  app.get("/api/paymaster/status", async (_req: Request, res: Response) => {
    res.json(getPaymasterStatus());
  });

  // =================== ESCROW RELEASE (with Paymaster error handling) ===================
  app.post("/api/escrow/release", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const txData = prepareEscrowRelease(orderId);
      res.json({
        ...txData,
        message: txData.gasSponsored
          ? "Transaction gas will be sponsored by Base Paymaster. No ETH needed."
          : "This transaction requires ETH for gas fees.",
      });
    } catch (error: any) {
      const classified = error.paymasterError || classifyPaymasterError(error);
      res.status(classified.code === 402 ? 402 : 500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
        suggestion: classified.suggestion,
      });
    }
  });

  app.post("/api/escrow/dispute", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const txData = prepareEscrowDispute(orderId);
      res.json({
        ...txData,
        message: "Dispute transaction prepared. The escrow will be flagged for admin review.",
      });
    } catch (error: any) {
      const classified = error.paymasterError || classifyPaymasterError(error);
      res.status(500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
      });
    }
  });

  app.post("/api/escrow/refund", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const txData = prepareAdminRefund(orderId);
      res.json({
        ...txData,
        message: "Admin refund transaction prepared. Funds will be returned to the buyer.",
      });
    } catch (error: any) {
      const classified = error.paymasterError || classifyPaymasterError(error);
      res.status(500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
      });
    }
  });

  app.get("/api/escrow/status/:orderId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const orderId = getParam(req.params.orderId);
      const details = await getEscrowDetails(orderId);
      if (!details) return res.status(404).json({ message: "Escrow not found for this order" });
      res.json(details);
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Failed to get escrow status" });
    }
  });

  // =================== STRIPE PAYMENTS ===================
  app.get("/api/payments/status", (_req: Request, res: Response) => {
    res.json({
      stripe: isStripeConfigured(),
      sendgrid: isSendGridConfigured(),
      twilio: isTwilioConfigured(),
    });
  });

  app.post("/api/payments/create-intent", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { amount, orderId, metadata } = req.body;
      if (!amount || !orderId) return res.status(400).json({ message: "amount and orderId are required" });
      const result = await createPaymentIntent(amount, orderId, req.user!.email, metadata);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/create-intent", userId: req.user?.id });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/capture", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { intentId } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const result = await capturePayment(intentId);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/capture" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/cancel", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { intentId, reason } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const result = await cancelPayment(intentId, reason);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/cancel" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/refund", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { intentId, amount } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const result = await createRefund(intentId, amount);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/refund" });
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/payments/:intentId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const intentId = getParam(req.params.intentId);
      const result = await getPaymentStatus(intentId);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/webhook", async (req: Request, res: Response) => {
    try {
      const sig = req.headers["stripe-signature"] as string;
      if (!sig || !req.rawBody) return res.status(400).json({ message: "Missing signature" });
      const event = await constructWebhookEvent(req.rawBody as Buffer, sig);
      console.log(`[Stripe Webhook] ${event.type}:`, (event.data.object as any).id);
      res.json({ received: true });
    } catch (err: any) {
      reportError(err, { route: "payments/webhook" });
      res.status(400).json({ message: err.message });
    }
  });

  // =================== NOTIFICATIONS ===================
  app.post("/api/notifications/email", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { to, subject, html } = req.body;
      if (!to || !subject || !html) return res.status(400).json({ message: "to, subject, and html are required" });
      const result = await sendEmail(to, subject, html);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "notifications/email" });
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/notifications/sms", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { to, body } = req.body;
      if (!to || !body) return res.status(400).json({ message: "to and body are required" });
      const result = await sendSMS(to, body);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "notifications/sms" });
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/notifications/push", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { tokens, title, body, data } = req.body;
      if (!tokens || !title || !body) return res.status(400).json({ message: "tokens, title, and body are required" });
      const result = await sendPushNotification(tokens, title, body, data);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "notifications/push" });
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/push-tokens", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { token, platform } = req.body;
      if (!token) return res.status(400).json({ message: "token is required" });
      await storage.savePushToken(req.user!.id, token, platform || "unknown");
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== FILE UPLOADS ===================
  app.get("/api/uploads/categories", (_req: Request, res: Response) => {
    res.json(getUploadCategories());
  });

  app.post("/api/uploads/:category", authMiddleware as any, upload.single("file"), async (req: AuthRequest, res: Response) => {
    try {
      const category = getParam(req.params.category) as any;
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const validation = validateUpload(file.size, file.mimetype, category);
      if (!validation.valid) return res.status(400).json({ message: validation.error });

      const result = await saveUpload(file.buffer, file.originalname, file.mimetype, category);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "uploads", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });

  // =================== TRACKING ===================
  app.get("/api/tracking/:orderId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const orderId = getParam(req.params.orderId);
      const location = getOrderDriverLocation(orderId);
      if (!location) return res.json({ tracking: false, message: "Driver location not available yet" });
      res.json({ tracking: true, ...location });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/tracking/drivers/active", authMiddleware as any, async (_req: AuthRequest, res: Response) => {
    res.json({
      count: getActiveDriverCount(),
      drivers: getAllActiveDrivers(),
    });
  });

  app.post("/api/tracking/eta", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { originLat, originLng, destLat, destLng } = req.body;
      if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({ message: "Origin and destination coordinates required" });
      }
      const eta = await getDirectionsETA(originLat, originLng, destLat, destLng);
      res.json(eta);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/tracking/assign", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { orderId, driverId } = req.body;
      if (!orderId || !driverId) return res.status(400).json({ message: "orderId and driverId required" });
      assignDriverToOrder(orderId, driverId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== IDENTITY VERIFICATION ===================
  app.post("/api/verify/start", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { type } = req.body;
      if (!type || !["alcohol", "driver"].includes(type)) {
        return res.status(400).json({ message: "type must be 'alcohol' or 'driver'" });
      }
      const result = await startIdentityVerification(req.user!.id, type);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "verify/start", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/verify/status", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const type = (req.query.type as string) || "alcohol";
      if (!["alcohol", "driver"].includes(type)) {
        return res.status(400).json({ message: "type must be 'alcohol' or 'driver'" });
      }
      const status = await getVerificationStatus(req.user!.id, type as "alcohol" | "driver");
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/verify/alcohol-eligibility", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const eligibility = await checkAlcoholEligibility(req.user!.id);
      res.json(eligibility);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/webhooks/persona", async (req: Request, res: Response) => {
    try {
      const { event, data } = req.body;
      const result = await handleVerificationWebhook(event, data);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "webhooks/persona" });
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/webhooks/checkr", async (req: Request, res: Response) => {
    try {
      const { type: event, data } = req.body;
      const result = await handleCheckrWebhook(event, data);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "webhooks/checkr" });
      res.status(500).json({ message: err.message });
    }
  });

  // =================== CLOUD STORAGE ===================
  app.post("/api/cloud/upload-url", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { fileName, mimeType, category } = req.body;
      if (!fileName || !mimeType || !category) {
        return res.status(400).json({ message: "fileName, mimeType, and category are required" });
      }
      const validation = validateCloudUpload(0, mimeType, category);
      if (!validation.valid) return res.status(400).json({ message: validation.error });

      const result = await getPresignedUploadUrl(fileName, mimeType, category);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "cloud/upload-url", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/cloud/upload/:category", authMiddleware as any, upload.single("file"), async (req: AuthRequest, res: Response) => {
    try {
      const category = getParam(req.params.category);
      const file = (req as any).file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });

      const validation = validateCloudUpload(file.size, file.mimetype, category);
      if (!validation.valid) return res.status(400).json({ message: validation.error });

      const result = await uploadToCloud(file.buffer, file.originalname, file.mimetype, category);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "cloud/upload", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/cloud/download-url", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { fileKey } = req.query;
      if (!fileKey) return res.status(400).json({ message: "fileKey is required" });
      const result = await getPresignedDownloadUrl(fileKey as string);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete("/api/cloud/file", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const fileKey = req.query.fileKey as string;
      if (!fileKey) return res.status(400).json({ message: "fileKey query parameter is required" });
      const deleted = await deleteFromCloud(fileKey);
      res.json({ deleted });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== CACHE MANAGEMENT ===================
  app.get("/api/cache/stats", authMiddleware as any, async (_req: AuthRequest, res: Response) => {
    res.json(getCacheStats());
  });

  app.post("/api/cache/invalidate", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { type, restaurantId } = req.body;
      if (type === "menu" && restaurantId) {
        await invalidateMenuCache(restaurantId);
      } else if (type === "restaurants") {
        await invalidateRestaurantsCache();
      } else {
        await invalidateRestaurantsCache();
      }
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== SERVICES STATUS ===================
  app.get("/api/services/status", (_req: Request, res: Response) => {
    res.json({
      payments: {
        stripe: isStripeConfigured(),
        crypto: true,
        escrow: true,
      },
      notifications: {
        email: isSendGridConfigured(),
        sms: isTwilioConfigured(),
        push: true,
      },
      tracking: {
        gps: true,
        googleMaps: !!process.env.GOOGLE_MAPS_API_KEY,
        activeDrivers: getActiveDriverCount(),
      },
      verification: {
        persona: isPersonaConfigured(),
        checkr: isCheckrConfigured(),
      },
      cache: getCacheStats(),
      cloudStorage: getCloudStorageStatus(),
      blockchain: {
        network: process.env.BASE_NETWORK || "mainnet",
        nftContract: MARKETPLACE_NFT_ADDRESS,
        escrowContract: MARKETPLACE_ESCROW_ADDRESS,
      },
    });
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

  setupTrackingSocket(io);

  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);

    socket.on("join:order", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("order:status:changed", async (data: { orderId: string; status: string; driverName?: string }) => {
      io.to(`order:${data.orderId}`).emit("order:status:changed", data);

      try {
        const order = await storage.getOrderById(data.orderId);
        if (order) {
          const customer = await storage.getCustomerById(order.customerId);
          if (customer) {
            const user = await storage.getUserById(customer.userId);
            if (user) {
              const tokens = await storage.getPushTokensByUserId(user.id);
              if (tokens.length > 0) {
                await sendPushNotification(
                  tokens.map(t => t.token),
                  `Order ${data.status.replace("_", " ")}`,
                  buildOrderStatusSMS(data.orderId, data.status)
                );
              }
              if (user.email && isSendGridConfigured()) {
                await sendEmail(
                  user.email,
                  `Order Update: ${data.status.replace("_", " ")}`,
                  buildOrderStatusEmail(data.orderId, data.status, data.driverName)
                ).catch(err => console.warn("[Notification] Email failed:", err));
              }
              if (user.phone && isTwilioConfigured()) {
                await sendSMS(user.phone, buildOrderStatusSMS(data.orderId, data.status))
                  .catch(err => console.warn("[Notification] SMS failed:", err));
              }
            }
          }
        }
      } catch (err) {
        console.error("[Notification] Error sending order notifications:", err);
      }
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
