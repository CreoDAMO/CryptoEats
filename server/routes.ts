import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { storage } from "./storage";
import { seedDatabase } from "./seed";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import { passwordResetTokens, users } from "../shared/schema";
const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
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
import { generateNftArt, getStylePresets, type NftArtCategory } from "./services/nft-ai";
import {
  paymentRouter, getPaymentRouter,
  type PaymentProviderKey, type PaymentOrder,
} from "./services/payment-router";
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
import {
  verifyFloridaLiquorLicense, checkAlcoholDeliveryCompliance,
  getComplianceRequirements, isDBPRConfigured,
} from "./services/license-verification";
import { initCache, getCachedMenu, getCachedRestaurants, invalidateMenuCache, invalidateRestaurantsCache, getCacheStats } from "./services/cache";
import {
  getPresignedUploadUrl, getPresignedDownloadUrl, uploadToCloud, deleteFromCloud,
  validateCloudUpload, isS3Configured, getCloudStorageStatus,
} from "./services/cloud-storage";

const JWT_SECRET = process.env.SESSION_SECRET || (process.env.NODE_ENV === "production" ? (() => { throw new Error("SESSION_SECRET must be set in production"); })() : "dev-only-secret-not-for-production");

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

function adminMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    if (req.user?.role !== "admin") {
      res.status(403).json({ message: "Admin access required" });
      return;
    }
    next();
  });
}

function merchantMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  authMiddleware(req, res, () => {
    if (req.user?.role !== "restaurant" && req.user?.role !== "admin") {
      res.status(403).json({ message: "Merchant or admin access required" });
      return;
    }
    next();
  });
}

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests, please try again later" },
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export async function registerRoutes(app: Express): Promise<Server> {
  if (!isServerless) {
    await seedDatabase();
  }
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

  app.post("/api/auth/forgot-password", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({ message: "If an account with that email exists, a reset code has been sent." });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedCode = await bcrypt.hash(code, 10);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: hashedCode,
        expiresAt,
      });

      const { sendEmail } = await import("./services/notifications");
      await sendEmail(
        email,
        "CryptoEats — Password Reset Code",
        `<div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0A0A0F; color: #ffffff; border-radius: 12px;">
          <h2 style="color: #00D4AA; margin-bottom: 8px;">Password Reset</h2>
          <p>Your password reset code is:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 20px; background: #14141F; border-radius: 8px; color: #00D4AA; margin: 16px 0;">
            ${code}
          </div>
          <p style="color: #888;">This code expires in 15 minutes. If you didn't request this, please ignore this email.</p>
          <p style="color: #555; font-size: 12px; margin-top: 24px;">CryptoEats — Miami's Crypto-Native Delivery</p>
        </div>`
      );

      console.log(`[Auth] Password reset code generated for ${email}${!process.env.SENDGRID_API_KEY ? ` (code: ${code})` : ""}`);
      res.json({ message: "If an account with that email exists, a reset code has been sent." });
    } catch (err: any) {
      console.error("[Auth] Forgot password error:", err.message);
      res.status(500).json({ message: "Something went wrong. Please try again." });
    }
  });

  app.post("/api/auth/reset-password", authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body;
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) return res.status(400).json({ message: "Invalid or expired reset code" });

      const tokens = await db.select().from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.userId, user.id),
          eq(passwordResetTokens.used, false),
        ))
        .orderBy(desc(passwordResetTokens.createdAt))
        .limit(5);

      let validToken = null;
      for (const t of tokens) {
        if (new Date() > t.expiresAt) continue;
        const match = await bcrypt.compare(code, t.token);
        if (match) { validToken = t; break; }
      }

      if (!validToken) {
        return res.status(400).json({ message: "Invalid or expired reset code" });
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await db.update(users).set({ passwordHash: newHash, updatedAt: new Date() }).where(eq(users.id, user.id));
      await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, validToken.id));

      res.json({ message: "Password has been reset successfully. You can now sign in." });
    } catch (err: any) {
      console.error("[Auth] Reset password error:", err.message);
      res.status(500).json({ message: "Something went wrong. Please try again." });
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
        const newRestaurant = await storage.createRestaurant({
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

        if (onboarding.hasAlcoholLicense && onboarding.alcoholLicenseNumber) {
          const licenseResult = await verifyFloridaLiquorLicense(
            onboarding.alcoholLicenseNumber,
            onboarding.businessName
          );
          await storage.createLicenseVerification({
            restaurantId: newRestaurant.id,
            onboardingId: onboarding.id,
            licenseNumber: onboarding.alcoholLicenseNumber,
            businessName: onboarding.businessName,
            verificationMethod: licenseResult.method,
            status: licenseResult.valid ? "verified" : licenseResult.status || "pending_review",
            licenseType: licenseResult.licenseType,
            expirationDate: licenseResult.expirationDate,
            county: licenseResult.county,
            details: licenseResult.details,
          });
          await storage.createComplianceLog({
            type: "license_verification",
            entityId: newRestaurant.id,
            details: {
              action: "restaurant_license_auto_verified",
              licenseNumber: onboarding.alcoholLicenseNumber,
              method: licenseResult.method,
              valid: licenseResult.valid,
            },
            status: licenseResult.valid ? "approved" : "pending",
          });
        }
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
  app.get("/api/admin/restaurants", adminMiddleware as any, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllRestaurants();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/restaurants/:id/approve", adminMiddleware as any, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateRestaurant(getParam(req.params.id), { isApproved: true });
      if (!updated) return res.status(404).json({ message: "Restaurant not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/drivers", adminMiddleware as any, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllDrivers();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/drivers/:id/approve", adminMiddleware as any, async (req: Request, res: Response) => {
    try {
      const updated = await storage.updateDriver(getParam(req.params.id), { backgroundCheckStatus: "approved" });
      if (!updated) return res.status(404).json({ message: "Driver not found" });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/orders", adminMiddleware as any, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getAllOrders();
      res.json(list);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/tax/summary", adminMiddleware as any, async (_req: Request, res: Response) => {
    try {
      const summary = await storage.getTaxSummary();
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/admin/tax/file", adminMiddleware as any, async (req: Request, res: Response) => {
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

  app.get("/api/admin/compliance", adminMiddleware as any, async (_req: Request, res: Response) => {
    try {
      const logs = await storage.getComplianceLogs();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== LEGAL & COMPLIANCE ===================

  app.post("/api/legal/accept", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { agreementType, version } = req.body;
      const validTypes = ["terms_of_service", "privacy_policy", "contractor_agreement", "restaurant_partner_agreement", "alcohol_delivery_consent"];
      if (!validTypes.includes(agreementType)) {
        return res.status(400).json({ message: `Invalid agreement type. Must be one of: ${validTypes.join(", ")}` });
      }

      const already = await storage.hasAcceptedAgreement(req.user!.id, agreementType, version || "1.0");
      if (already) {
        return res.json({ message: "Agreement already accepted", alreadyAccepted: true });
      }

      const agreement = await storage.createLegalAgreement({
        userId: req.user!.id,
        agreementType,
        version: version || "1.0",
        ipAddress: (req.headers["x-forwarded-for"] as string) || req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown",
      });

      await storage.createComplianceLog({
        type: "agreement",
        entityId: req.user!.id,
        details: { action: "agreement_accepted", agreementType, version: version || "1.0" },
        status: "approved",
      });

      res.status(201).json({ message: "Agreement accepted", agreement });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/legal/status", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const agreements = await storage.getLegalAgreementsByUser(req.user!.id);
      const accepted: Record<string, { version: string; acceptedAt: Date }> = {};
      for (const a of agreements) {
        if (!accepted[a.agreementType]) {
          accepted[a.agreementType] = { version: a.version, acceptedAt: a.acceptedAt };
        }
      }
      const required = ["terms_of_service", "privacy_policy"];
      if (req.user!.role === "driver") required.push("contractor_agreement");
      if (req.user!.role === "restaurant") required.push("restaurant_partner_agreement");

      const missing = required.filter(t => !accepted[t]);
      res.json({
        accepted,
        required,
        missing,
        compliant: missing.length === 0,
        totalAccepted: agreements.length,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/legal/agreements", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const agreements = await storage.getLegalAgreementsByUser(req.user!.id);
      res.json(agreements);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/legal/agreements", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const agreements = await storage.getAllLegalAgreements();
      res.json(agreements);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== LICENSE VERIFICATION ===================

  app.post("/api/license/verify", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (!["admin", "restaurant"].includes(req.user!.role)) {
        return res.status(403).json({ message: "Access restricted" });
      }
      const { licenseNumber, businessName, restaurantId, onboardingId } = req.body;
      if (!licenseNumber) {
        return res.status(400).json({ message: "License number is required" });
      }

      const result = await verifyFloridaLiquorLicense(licenseNumber, businessName);

      const verification = await storage.createLicenseVerification({
        restaurantId: restaurantId || null,
        onboardingId: onboardingId || null,
        licenseNumber,
        businessName: result.businessName,
        verificationMethod: result.method,
        status: result.valid ? "verified" : result.status || "failed",
        licenseType: result.licenseType,
        expirationDate: result.expirationDate,
        county: result.county,
        details: result.details,
      });

      await storage.createComplianceLog({
        type: "license_verification",
        entityId: restaurantId || onboardingId || req.user!.id,
        details: {
          action: "license_verified",
          licenseNumber,
          method: result.method,
          valid: result.valid,
          status: result.status,
        },
        status: result.valid ? "approved" : "pending",
      });

      res.json({ verification, result });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/license/status/:restaurantId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const restaurantId = getParam(req.params.restaurantId);
      const verifications = await storage.getLicenseVerificationsByRestaurant(restaurantId);
      const latest = verifications[0] || null;
      res.json({
        restaurantId,
        verified: latest?.status === "verified",
        latestVerification: latest,
        totalVerifications: verifications.length,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/licenses", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const verifications = await storage.getAllLicenseVerifications();
      res.json(verifications);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // =================== ALCOHOL DELIVERY COMPLIANCE CHECK ===================

  app.post("/api/compliance/alcohol-check", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { restaurantId, items, deliveryTime } = req.body;
      if (!restaurantId || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "restaurantId and items array are required" });
      }

      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const customer = await storage.getCustomerByUserId(req.user!.id);
      const customerAgeVerified = customer?.idVerified || false;

      const result = checkAlcoholDeliveryCompliance({
        restaurantHasLicense: restaurant.alcoholLicense || false,
        alcoholLicenseNumber: undefined,
        orderItems: items,
        deliveryTime: deliveryTime ? new Date(deliveryTime) : undefined,
        customerAgeVerified,
        driverBackgroundChecked: true,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/compliance/requirements", (_req: Request, res: Response) => {
    res.json(getComplianceRequirements());
  });

  app.get("/api/compliance/pci-status", (_req: Request, res: Response) => {
    res.json({
      compliant: true,
      level: "SAQ-A",
      provider: "Stripe",
      stripeConfigured: isStripeConfigured(),
      details: {
        cardDataHandling: "Stripe Elements/Checkout — card data goes directly to Stripe, never touches our servers",
        certification: "Stripe is PCI DSS Level 1 certified (highest level)",
        scope: "SAQ-A (Self-Assessment Questionnaire A) — simplest form for merchants using hosted payment pages",
        requirements: [
          "No raw card data stored, processed, or transmitted on our servers",
          "TLS/HTTPS encryption for all connections",
          "Access controls and role-based permissions",
          "Security monitoring via Sentry",
          "Adaptive rate limiting and request fingerprinting",
          "Regular security audits and vulnerability scanning",
        ],
        annualValidation: "SAQ-A submitted annually via Stripe Dashboard PCI wizard",
      },
    });
  });

  app.get("/api/services/status", (_req: Request, res: Response) => {
    try {
      res.json({
        payments: {
          stripe: isStripeConfigured(),
          crypto: true,
          escrow: true,
          multiProvider: true,
          providers: getPaymentRouter().getProviderStatus(),
        },
        notifications: { email: isSendGridConfigured(), sms: isTwilioConfigured(), push: true },
        tracking: { gps: true, googleMaps: !!process.env.GOOGLE_MAPS_API_KEY, activeDrivers: getActiveDriverCount() },
        verification: { persona: isPersonaConfigured(), checkr: isCheckrConfigured() },
        cache: getCacheStats(),
        cloudStorage: getCloudStorageStatus(),
        licenseVerification: { dbpr: isDBPRConfigured(), method: isDBPRConfigured() ? "dbpr_api" : "simulated_with_manual_review" },
        legal: {
          termsOfService: "/legal/tos",
          privacyPolicy: "/legal/privacy",
          contractorAgreement: "/legal/contractor",
        },
        pciCompliance: { level: "SAQ-A", provider: "Stripe", configured: isStripeConfigured() },
        blockchain: {
          network: "mainnet",
          nftContract: MARKETPLACE_NFT_ADDRESS,
          escrowContract: MARKETPLACE_ESCROW_ADDRESS,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/admin/delivery-windows", adminMiddleware as any, async (req: Request, res: Response) => {
    try {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ message: "Window ID required" });
      const updated = await storage.updateDeliveryWindow(id, data);
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/admin/drivers/status", adminMiddleware as any, async (_req: Request, res: Response) => {
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

  // =================== AI NFT GENERATION ===================
  app.get("/api/nft/styles", async (_req: Request, res: Response) => {
    res.json(getStylePresets());
  });

  app.post("/api/nft/generate-art", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { category, name, description, dishName, cuisine, restaurantName, milestoneType, milestoneValue, driverName, style } = req.body;
      if (!category || !name) return res.status(400).json({ message: "category and name are required" });

      const validCategories: NftArtCategory[] = ["merchant_dish", "driver_avatar", "customer_loyalty", "marketplace_art"];
      if (!validCategories.includes(category)) return res.status(400).json({ message: "Invalid category" });

      const result = await generateNftArt({
        category, name, description, dishName, cuisine, restaurantName,
        milestoneType, milestoneValue, driverName, style,
      });

      const nft = await storage.createNftReward({
        userId: req.user!.id,
        name,
        description: description || `AI-generated ${category.replace("_", " ")} NFT`,
        imageUrl: result.imageUrl,
        milestoneType: category,
        milestoneValue: 0,
        status: "pending",
        nftCategory: category,
        aiGenerated: true,
        aiPrompt: result.prompt,
        restaurantId: restaurantName || null,
        dishName: dishName || null,
      });

      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err: any) {
      console.error("[NFT AI] Generation error:", err);
      res.status(500).json({ message: err.message || "Failed to generate NFT art" });
    }
  });

  app.post("/api/nft/merchant-dish", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { dishName, cuisine, restaurantName, style } = req.body;
      if (!dishName) return res.status(400).json({ message: "dishName is required" });

      const result = await generateNftArt({
        category: "merchant_dish",
        name: dishName,
        dishName,
        cuisine,
        restaurantName,
        style,
      });

      const nft = await storage.createNftReward({
        userId: req.user!.id,
        name: `${dishName} Signature NFT`,
        description: `Signature dish NFT${restaurantName ? ` from ${restaurantName}` : ""}`,
        imageUrl: result.imageUrl,
        milestoneType: "merchant_dish",
        milestoneValue: 0,
        status: "pending",
        nftCategory: "merchant_dish",
        aiGenerated: true,
        aiPrompt: result.prompt,
        restaurantId: restaurantName || null,
        dishName,
      });

      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err: any) {
      console.error("[NFT AI] Merchant dish error:", err);
      res.status(500).json({ message: err.message || "Failed to generate dish NFT" });
    }
  });

  app.post("/api/nft/driver-avatar", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { driverName, style } = req.body;

      const result = await generateNftArt({
        category: "driver_avatar",
        name: driverName || "Delivery Driver",
        driverName,
        style,
      });

      const nft = await storage.createNftReward({
        userId: req.user!.id,
        name: `${driverName || "Driver"} Avatar NFT`,
        description: "AI-generated unique driver avatar NFT",
        imageUrl: result.imageUrl,
        milestoneType: "driver_avatar",
        milestoneValue: 0,
        status: "pending",
        nftCategory: "driver_avatar",
        aiGenerated: true,
        aiPrompt: result.prompt,
      });

      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err: any) {
      console.error("[NFT AI] Driver avatar error:", err);
      res.status(500).json({ message: err.message || "Failed to generate driver avatar NFT" });
    }
  });

  app.post("/api/nft/customer-loyalty", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { name, description, milestoneType, milestoneValue, style } = req.body;
      if (!name) return res.status(400).json({ message: "name is required" });

      const result = await generateNftArt({
        category: "customer_loyalty",
        name,
        description,
        milestoneType: milestoneType || "customer",
        milestoneValue: milestoneValue || 0,
        style,
      });

      const nft = await storage.createNftReward({
        userId: req.user!.id,
        name,
        description: description || `Loyalty reward: ${name}`,
        imageUrl: result.imageUrl,
        milestoneType: milestoneType || "customer",
        milestoneValue: milestoneValue || 0,
        status: "pending",
        nftCategory: "customer_loyalty",
        aiGenerated: true,
        aiPrompt: result.prompt,
      });

      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err: any) {
      console.error("[NFT AI] Customer loyalty error:", err);
      res.status(500).json({ message: err.message || "Failed to generate loyalty NFT" });
    }
  });

  app.post("/api/nft/regenerate-art", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { nftId, style } = req.body;
      if (!nftId) return res.status(400).json({ message: "nftId is required" });

      const userNfts = await storage.getNftsByUserId(req.user!.id);
      const nft = userNfts.find(n => n.id === nftId);
      if (!nft) return res.status(404).json({ message: "NFT not found" });
      if (nft.status === "minted" || nft.status === "listed") {
        return res.status(400).json({ message: "Cannot regenerate art for minted/listed NFTs" });
      }

      const category = (nft as any).nftCategory || nft.milestoneType || "marketplace_art";
      const result = await generateNftArt({
        category,
        name: nft.name,
        description: nft.description || undefined,
        dishName: (nft as any).dishName || undefined,
        style,
      });

      await storage.updateNftStatus(nftId, nft.status || "pending", {
        imageUrl: result.imageUrl,
      });

      res.json({ imageUrl: result.imageUrl, prompt: result.prompt });
    } catch (err: any) {
      console.error("[NFT AI] Regenerate error:", err);
      res.status(500).json({ message: err.message || "Failed to regenerate NFT art" });
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

  // =================== COINBASE OFFRAMP (Cash Out) ===================
  app.get("/api/offramp/sell-options", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      res.json({
        cashoutMethods: [
          { id: "BANK_ACCOUNT", name: "Bank Account (ACH)", estimatedDays: "1-3 business days", minAmount: 5, maxAmount: 25000 },
          { id: "INSTANT_BANK", name: "Instant Bank Transfer", estimatedDays: "Minutes", minAmount: 10, maxAmount: 5000, fee: "1.5%" },
        ],
        sellCurrencies: [
          { code: "USDC", name: "USD Coin", network: "base", decimals: 6, minAmount: 1, contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
          { code: "ETH", name: "Ethereum", network: "base", decimals: 18, minAmount: 0.001 },
        ],
        supportedFiat: ["USD"],
        limits: { daily: 25000, weekly: 100000, monthly: 250000 },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/offramp/sell-quote", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { sellCurrency, sellAmount, cashoutMethod } = req.body;
      if (!sellCurrency || !sellAmount) {
        return res.status(400).json({ message: "sellCurrency and sellAmount are required" });
      }
      const cryptoAmount = parseFloat(sellAmount);
      let rate = 1.0;
      let fee = 0;
      if (sellCurrency === "USDC") {
        rate = 1.0;
        fee = cashoutMethod === "INSTANT_BANK" ? Math.max(0.50, cryptoAmount * 0.015) : Math.max(0.25, cryptoAmount * 0.005);
      } else if (sellCurrency === "ETH") {
        rate = 2600;
        fee = Math.max(0.99, cryptoAmount * rate * 0.02);
      }
      const grossFiat = cryptoAmount * rate;
      const netFiat = grossFiat - fee;
      const estimatedDays = cashoutMethod === "INSTANT_BANK" ? "Minutes" : "1-3 business days";
      res.json({
        sellCurrency,
        sellAmount: cryptoAmount.toFixed(8),
        fiatCurrency: "USD",
        grossAmount: grossFiat.toFixed(2),
        fee: fee.toFixed(2),
        netAmount: netFiat.toFixed(2),
        exchangeRate: rate.toFixed(8),
        cashoutMethod: cashoutMethod || "BANK_ACCOUNT",
        estimatedArrival: estimatedDays,
        quoteId: `quote_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/offramp/initiate", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { cryptoAmount, cryptoCurrency, cashoutMethod, walletAddress, quoteId, fee, exchangeRate, estimatedArrival } = req.body;
      if (!cryptoAmount || !walletAddress) {
        return res.status(400).json({ message: "cryptoAmount and walletAddress are required" });
      }
      const amt = parseFloat(cryptoAmount);
      const rate = parseFloat(exchangeRate || "1");
      const feeAmt = parseFloat(fee || "0");
      const fiatAmount = (amt * rate - feeAmt).toFixed(2);

      const tx = await storage.createOfframpTransaction({
        userId: req.user!.id,
        walletAddress,
        cryptoCurrency: cryptoCurrency || "USDC",
        cryptoAmount: cryptoAmount.toString(),
        fiatAmount,
        fiatCurrency: "USD",
        cashoutMethod: cashoutMethod || "BANK_ACCOUNT",
        network: "base",
        quoteId: quoteId || null,
        fee: feeAmt.toFixed(2),
        exchangeRate: rate.toFixed(8),
        estimatedArrival: estimatedArrival || "1-3 business days",
        status: "pending",
      });

      const offrampUrl = `https://pay.coinbase.com/v3/sell/input?addresses={"${walletAddress}":["base"]}&defaultAsset=USDC&defaultNetwork=base&defaultCryptoAmount=${cryptoAmount}&partnerUserRef=${req.user!.id}&redirectUrl=https://cryptoeats.net/cashout/success`;
      res.status(201).json({ transaction: tx, offrampUrl });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/offramp/webhook", async (req: Request, res: Response) => {
    try {
      const { transactionId, status, fiatAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const tx = await storage.getOfframpTransactionById(transactionId);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      const updateData: any = { status };
      if (fiatAmount) updateData.fiatAmount = fiatAmount.toString();
      if (status === "completed") updateData.completedAt = new Date();
      await storage.updateOfframpTransaction(transactionId, updateData);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/offramp/simulate-complete", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { transactionId, fiatAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const updated = await storage.updateOfframpTransaction(transactionId, {
        status: "completed",
        fiatAmount: fiatAmount?.toString() || "0",
        completedAt: new Date(),
        coinbaseTransactionId: `cb_sell_${Date.now()}`,
      });
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/offramp/history", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const txs = await storage.getOfframpTransactionsByUser(req.user!.id);
      res.json(txs);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/offramp/status/:id", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const tx = await storage.getOfframpTransactionById(req.params.id as string);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.userId !== req.user!.id) return res.status(403).json({ message: "Unauthorized" });
      res.json(tx);
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

  // =================== MULTI-PROVIDER PAYMENT SYSTEM ===================
  app.get("/api/payments/status", (_req: Request, res: Response) => {
    const router = getPaymentRouter();
    res.json({
      stripe: isStripeConfigured(),
      sendgrid: isSendGridConfigured(),
      twilio: isTwilioConfigured(),
      providers: router.getProviderStatus(),
      routing: router.getRoutingConfig(),
    });
  });

  app.get("/api/payments/providers", (_req: Request, res: Response) => {
    const router = getPaymentRouter();
    res.json({
      providers: router.getProviderStatus(),
      routing: router.getRoutingConfig(),
      stats: router.getRoutingStats(),
    });
  });

  app.get("/api/payments/fee-comparison", (req: Request, res: Response) => {
    const amount = parseFloat(req.query.amount as string) || 30;
    const type = (req.query.type as string) || "online";
    const router = getPaymentRouter();
    res.json({
      amount,
      type,
      providers: router.getFeeComparison(amount, type),
    });
  });

  app.post("/api/payments/create-intent", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { amount, orderId, metadata, provider, type, isInternational } = req.body;
      if (!amount || !orderId) return res.status(400).json({ message: "amount and orderId are required" });

      const router = getPaymentRouter();
      const order: PaymentOrder = {
        id: orderId,
        amount,
        currency: "usd",
        isInternational: isInternational || false,
        type: type || "online",
        customerEmail: req.user!.email,
        metadata,
      };

      if (provider && ["stripe", "adyen", "godaddy", "square", "coinbase"].includes(provider)) {
        order.type = provider === "coinbase" ? "crypto" : order.type;
      }

      const result = await router.createPayment(order);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/create-intent", userId: req.user?.id });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/capture", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { intentId, provider } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const providerKey: PaymentProviderKey = provider || "stripe";
      const router = getPaymentRouter();
      const result = await router.capturePayment(intentId, providerKey);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/capture" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/cancel", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { intentId, provider } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const providerKey: PaymentProviderKey = provider || "stripe";
      const router = getPaymentRouter();
      const result = await router.cancelPayment(intentId, providerKey);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/cancel" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/refund", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const { intentId, amount, provider, reason } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const providerKey: PaymentProviderKey = provider || "stripe";
      const router = getPaymentRouter();
      const result = await router.refundPayment(intentId, amount, providerKey, reason);
      res.json(result);
    } catch (err: any) {
      reportError(err, { route: "payments/refund" });
      res.status(400).json({ message: err.message });
    }
  });

  app.get("/api/payments/:intentId", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      const intentId = getParam(req.params.intentId);
      const provider: PaymentProviderKey = (req.query.provider as PaymentProviderKey) || "stripe";
      const router = getPaymentRouter();
      const result = await router.getStatus(intentId, provider);
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

      if (event.type.startsWith("charge.dispute")) {
        const router = getPaymentRouter();
        const disputeResult = await router.handleDispute(event, "stripe");
        console.log(`[PaymentRouter] Dispute handled:`, disputeResult);
      }

      res.json({ received: true });
    } catch (err: any) {
      reportError(err, { route: "payments/webhook" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/webhook/adyen", async (req: Request, res: Response) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "adyen");
      console.log(`[Adyen Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err: any) {
      reportError(err, { route: "payments/webhook/adyen" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/webhook/square", async (req: Request, res: Response) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "square");
      console.log(`[Square Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err: any) {
      reportError(err, { route: "payments/webhook/square" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/webhook/godaddy", async (req: Request, res: Response) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "godaddy");
      console.log(`[GoDaddy Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err: any) {
      reportError(err, { route: "payments/webhook/godaddy" });
      res.status(400).json({ message: err.message });
    }
  });

  app.post("/api/payments/webhook/coinbase", async (req: Request, res: Response) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "coinbase");
      console.log(`[Coinbase Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err: any) {
      reportError(err, { route: "payments/webhook/coinbase" });
      res.status(400).json({ message: err.message });
    }
  });

  app.put("/api/payments/routing-config", authMiddleware as any, async (req: AuthRequest, res: Response) => {
    try {
      if (req.user!.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      const router = getPaymentRouter();
      router.updateRoutingConfig(req.body);
      res.json({ message: "Routing config updated", config: router.getRoutingConfig() });
    } catch (err: any) {
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

  app.get("/api/admin/stats", adminMiddleware as any, async (_req: Request, res: Response) => {
    try {
      const allOrders = await storage.getAllOrders();
      const allRestaurants = await storage.getAllRestaurants();
      const allDrivers = await storage.getAllDrivers();
      const taxSummary = await storage.getTaxSummary();
      const complianceLogs = await storage.getComplianceLogs();

      const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const totalDeliveryFees = allOrders.reduce((sum, o) => sum + parseFloat(o.deliveryFee || "0"), 0);
      const totalTips = allOrders.reduce((sum, o) => sum + parseFloat(o.tip || "0"), 0);
      const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;

      const ordersByStatus: Record<string, number> = {};
      allOrders.forEach(o => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);

      const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= todayStart);
      const weekOrders = allOrders.filter(o => new Date(o.createdAt) >= weekStart);
      const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const weekRevenue = weekOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);

      const activeDrivers = allDrivers.filter(d => d.isAvailable);
      const approvedRestaurants = allRestaurants.filter(r => r.isApproved);

      const dailyOrders: Record<string, { count: number; revenue: number }> = {};
      allOrders.forEach(o => {
        const day = new Date(o.createdAt).toISOString().split("T")[0];
        if (!dailyOrders[day]) dailyOrders[day] = { count: 0, revenue: 0 };
        dailyOrders[day].count++;
        dailyOrders[day].revenue += parseFloat(o.total || "0");
      });

      const pilotBudget = {
        total: 19745,
        driverGuarantees: { budget: 10000, label: "Driver Guarantees" },
        customerPromos: { budget: 3000, label: "Customer Promos" },
        merchantIncentives: { budget: 2000, label: "Merchant Incentives" },
        marketing: { budget: 3000, label: "Marketing" },
        operations: { budget: 1745, label: "Operations" },
        techHosting: { budget: 1000, label: "Tech/Hosting" },
      };

      res.json({
        overview: {
          totalOrders: allOrders.length,
          totalRevenue: totalRevenue.toFixed(2),
          avgOrderValue: avgOrderValue.toFixed(2),
          totalDeliveryFees: totalDeliveryFees.toFixed(2),
          totalTips: totalTips.toFixed(2),
          todayOrders: todayOrders.length,
          todayRevenue: todayRevenue.toFixed(2),
          weekOrders: weekOrders.length,
          weekRevenue: weekRevenue.toFixed(2),
        },
        ordersByStatus,
        restaurants: {
          total: allRestaurants.length,
          approved: approvedRestaurants.length,
          pending: allRestaurants.length - approvedRestaurants.length,
          cuisineBreakdown: allRestaurants.reduce((acc: Record<string, number>, r) => {
            acc[r.cuisineType] = (acc[r.cuisineType] || 0) + 1;
            return acc;
          }, {}),
        },
        drivers: {
          total: allDrivers.length,
          active: activeDrivers.length,
          avgRating: allDrivers.length > 0 ? (allDrivers.reduce((s, d) => s + (d.rating || 0), 0) / allDrivers.length).toFixed(1) : "0",
          totalDeliveries: allDrivers.reduce((s, d) => s + (d.totalDeliveries || 0), 0),
        },
        tax: taxSummary,
        compliance: {
          total: complianceLogs.length,
          recent: complianceLogs.slice(0, 10),
        },
        dailyOrders,
        pilotBudget,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/merchant/restaurants", merchantMiddleware as any, async (req: Request, res: Response) => {
    try {
      const allRestaurants = await storage.getAllRestaurants();
      res.json(allRestaurants);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get("/api/merchant/stats/:restaurantId", merchantMiddleware as any, async (req: Request, res: Response) => {
    try {
      const restaurantId = getParam(req.params.restaurantId);
      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });

      const allOrders = await storage.getAllOrders();
      const restaurantOrders = allOrders.filter(o => o.restaurantId === restaurantId);
      const menuItemsList = await storage.getMenuItems(restaurantId);
      const reviewsList = await storage.getReviewsByRestaurant(restaurantId);

      const totalRevenue = restaurantOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const avgOrderValue = restaurantOrders.length > 0 ? totalRevenue / restaurantOrders.length : 0;
      const deliveredOrders = restaurantOrders.filter(o => o.status === "delivered");
      const avgRating = reviewsList.length > 0 ? reviewsList.reduce((s, r) => s + (r.restaurantRating || 0), 0) / reviewsList.length : 0;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayOrders = restaurantOrders.filter(o => new Date(o.createdAt) >= todayStart);
      const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);

      const ordersByStatus: Record<string, number> = {};
      restaurantOrders.forEach(o => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });

      const popularItems: Record<string, { count: number; revenue: number; name: string }> = {};
      restaurantOrders.forEach(o => {
        const items = o.items as any[];
        if (items) {
          items.forEach(item => {
            const key = item.menuItemId || item.name;
            if (!popularItems[key]) popularItems[key] = { count: 0, revenue: 0, name: item.name };
            popularItems[key].count += item.quantity;
            popularItems[key].revenue += item.price * item.quantity;
          });
        }
      });

      const dailyRevenue: Record<string, { orders: number; revenue: number }> = {};
      restaurantOrders.forEach(o => {
        const day = new Date(o.createdAt).toISOString().split("T")[0];
        if (!dailyRevenue[day]) dailyRevenue[day] = { orders: 0, revenue: 0 };
        dailyRevenue[day].orders++;
        dailyRevenue[day].revenue += parseFloat(o.total || "0");
      });

      res.json({
        restaurant,
        overview: {
          totalOrders: restaurantOrders.length,
          deliveredOrders: deliveredOrders.length,
          totalRevenue: totalRevenue.toFixed(2),
          avgOrderValue: avgOrderValue.toFixed(2),
          avgRating: avgRating.toFixed(1),
          totalReviews: reviewsList.length,
          todayOrders: todayOrders.length,
          todayRevenue: todayRevenue.toFixed(2),
          menuItemCount: menuItemsList.length,
        },
        ordersByStatus,
        popularItems: Object.values(popularItems).sort((a, b) => b.count - a.count).slice(0, 10),
        recentOrders: restaurantOrders.slice(0, 20),
        reviews: reviewsList.slice(0, 20),
        dailyRevenue,
        menuItems: menuItemsList,
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
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
