import { sql } from "drizzle-orm";
import {
  pgTable, text, varchar, integer, boolean, timestamp, decimal,
  json, pgEnum, serial, real
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["customer", "driver", "admin", "restaurant"]);
export const orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "preparing", "picked_up", "arriving", "delivered", "cancelled"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "refunded"]);
export const taxStatusEnum = pgEnum("tax_status", ["collected", "remitted", "pending"]);
export const remittanceStatusEnum = pgEnum("remittance_status", ["pending", "filed", "paid"]);
export const driverStatusEnum = pgEnum("driver_status", ["active", "on_break", "suspended_review", "suspended_safety", "offline"]);
export const engagementTierEnum = pgEnum("engagement_tier", ["active", "regular", "casual", "on_break"]);
export const interactionTypeEnum = pgEnum("interaction_type", ["wellness_check", "education", "investigation", "appeal"]);
export const complianceTypeEnum = pgEnum("compliance_type", ["license", "tax_filing", "agreement", "insurance"]);
export const chatTypeEnum = pgEnum("chat_type", ["text", "image", "system"]);
export const verificationMethodEnum = pgEnum("verification_method", ["checkout", "delivery"]);

// =================== USERS ===================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =================== CUSTOMERS ===================
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  idVerified: boolean("id_verified").default(false),
  idVerificationData: text("id_verification_data"),
  tastePreferences: json("taste_preferences").$type<string[]>().default([]),
  dietaryRestrictions: json("dietary_restrictions").$type<string[]>().default([]),
  referralCode: text("referral_code"),
  savedAddresses: json("saved_addresses").$type<{ label: string; address: string }[]>().default([]),
  favoriteRestaurants: json("favorite_restaurants").$type<string[]>().default([]),
  favoriteItems: json("favorite_items").$type<string[]>().default([]),
});

// =================== DRIVERS ===================
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  licenseNumber: text("license_number"),
  vehicleInfo: text("vehicle_info"),
  backgroundCheckStatus: text("background_check_status").default("pending"),
  isAvailable: boolean("is_available").default(false),
  currentLat: real("current_lat"),
  currentLng: real("current_lng"),
  rating: real("rating").default(5.0),
  totalDeliveries: integer("total_deliveries").default(0),
  earningsData: json("earnings_data").$type<{ totalEarnings: number; weeklyEarnings: number }>(),
  insuranceData: json("insurance_data").$type<{ policyNumber: string; expiryDate: string; provider: string }>(),
  photoUrl: text("photo_url"),
  bio: text("bio"),
});

// =================== DRIVER STATUS ===================
export const driverStatusTable = pgTable("driver_status_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => drivers.id),
  status: driverStatusEnum("status").notNull().default("active"),
  engagementTier: engagementTierEnum("engagement_tier").notNull().default("active"),
  suspensionReason: text("suspension_reason"),
  suspensionDate: timestamp("suspension_date"),
  reviewStatus: text("review_status"),
  appealDeadline: timestamp("appeal_deadline"),
  supportNotes: text("support_notes"),
  returnDate: timestamp("return_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =================== DRIVER SUPPORT LOG ===================
export const driverSupportLog = pgTable("driver_support_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => drivers.id),
  interactionType: interactionTypeEnum("interaction_type").notNull(),
  notes: text("notes"),
  outcome: text("outcome"),
  supportRep: text("support_rep"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== DRIVER EARNINGS ===================
export const driverEarnings = pgTable("driver_earnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull().references(() => drivers.id),
  orderId: varchar("order_id"),
  basePay: decimal("base_pay", { precision: 10, scale: 2 }).default("0"),
  mileagePay: decimal("mileage_pay", { precision: 10, scale: 2 }).default("0"),
  timePay: decimal("time_pay", { precision: 10, scale: 2 }).default("0"),
  tipAmount: decimal("tip_amount", { precision: 10, scale: 2 }).default("0"),
  bonusAmount: decimal("bonus_amount", { precision: 10, scale: 2 }).default("0"),
  totalPayout: decimal("total_payout", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: text("payment_method"),
  cryptoCurrency: text("crypto_currency"),
  cryptoAmount: decimal("crypto_amount", { precision: 18, scale: 8 }),
  usdValue: decimal("usd_value", { precision: 10, scale: 2 }),
  payoutStatus: text("payout_status").default("pending"),
  paidAt: timestamp("paid_at"),
  taxYear: integer("tax_year"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== RESTAURANTS ===================
export const restaurants = pgTable("restaurants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  name: text("name").notNull(),
  cuisineType: text("cuisine_type").notNull(),
  address: text("address").notNull(),
  phone: text("phone"),
  rating: real("rating").default(4.5),
  reviewCount: integer("review_count").default(0),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).default("2.99"),
  minOrder: decimal("min_order", { precision: 10, scale: 2 }).default("10"),
  estimatedPrepTime: text("estimated_prep_time").default("25-35 min"),
  alcoholLicense: boolean("alcohol_license").default(false),
  operatingHours: json("operating_hours").$type<{ open: string; close: string; days: string[] }>(),
  imageUrl: text("image_url"),
  featured: boolean("featured").default(false),
  distance: text("distance"),
  isApproved: boolean("is_approved").default(false),
  isSuspended: boolean("is_suspended").default(false),
  agreementSignedDate: timestamp("agreement_signed_date"),
  agreementData: text("agreement_data"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== MENU ITEMS ===================
export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  category: text("category").notNull(),
  isAlcohol: boolean("is_alcohol").default(false),
  ageVerificationRequired: boolean("age_verification_required").default(false),
  dietaryTags: json("dietary_tags").$type<string[]>().default([]),
  available: boolean("available").default(true),
  pairingSuggestions: json("pairing_suggestions").$type<string[]>().default([]),
  imageUrl: text("image_url"),
});

// =================== ORDERS ===================
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  restaurantId: varchar("restaurant_id").notNull().references(() => restaurants.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  items: json("items").$type<{ menuItemId: string; name: string; price: number; quantity: number; isAlcohol: boolean }[]>().notNull(),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  tip: decimal("tip", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentIntentId: text("payment_intent_id"),
  deliveryAddress: text("delivery_address").notNull(),
  specialInstructions: text("special_instructions"),
  requiresAgeVerification: boolean("requires_age_verification").default(false),
  ageVerifiedAtDelivery: boolean("age_verified_at_delivery").default(false),
  signatureData: text("signature_data"),
  taxableAmount: decimal("taxable_amount", { precision: 10, scale: 2 }),
  taxCollected: decimal("tax_collected", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),
  eta: text("eta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
});

// =================== BUNDLES ===================
export const bundles = pgTable("bundles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  items: json("items").$type<string[]>().notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  active: boolean("active").default(true),
  conditions: json("conditions").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== CHATS ===================
export const chats = pgTable("chats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: chatTypeEnum("type").default("text"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// =================== ID VERIFICATIONS ===================
export const idVerifications = pgTable("id_verifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  orderId: varchar("order_id").references(() => orders.id),
  scanData: text("scan_data"),
  verified: boolean("verified").default(false),
  verifiedAt: timestamp("verified_at"),
  method: verificationMethodEnum("method").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== REVIEWS ===================
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  customerId: varchar("customer_id").notNull().references(() => customers.id),
  restaurantId: varchar("restaurant_id").references(() => restaurants.id),
  driverId: varchar("driver_id").references(() => drivers.id),
  restaurantRating: integer("restaurant_rating"),
  driverRating: integer("driver_rating"),
  comment: text("comment"),
  restaurantResponse: text("restaurant_response"),
  flagged: boolean("flagged").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== ANALYTICS ===================
export const analytics = pgTable("analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricType: text("metric_type").notNull(),
  value: decimal("value", { precision: 15, scale: 2 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// =================== TAX JURISDICTIONS ===================
export const taxJurisdictions = pgTable("tax_jurisdictions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  zipCode: text("zip_code").notNull(),
  city: text("city").notNull(),
  county: text("county").notNull(),
  state: text("state").notNull(),
  stateRate: decimal("state_rate", { precision: 5, scale: 4 }).notNull(),
  localRate: decimal("local_rate", { precision: 5, scale: 4 }).notNull(),
  totalRate: decimal("total_rate", { precision: 5, scale: 4 }).notNull(),
  effectiveDate: timestamp("effective_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// =================== TAX TRANSACTIONS ===================
export const taxTransactions = pgTable("tax_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  jurisdictionId: varchar("jurisdiction_id").references(() => taxJurisdictions.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  deliveryFee: decimal("delivery_fee", { precision: 10, scale: 2 }),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }),
  taxableAmount: decimal("taxable_amount", { precision: 10, scale: 2 }),
  taxRate: decimal("tax_rate", { precision: 5, scale: 4 }),
  taxCollected: decimal("tax_collected", { precision: 10, scale: 2 }),
  taxStatus: taxStatusEnum("tax_status").default("collected"),
  paymentMethod: text("payment_method"),
  cryptoCurrency: text("crypto_currency"),
  cryptoAmount: decimal("crypto_amount", { precision: 18, scale: 8 }),
  usdValue: decimal("usd_value", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== TAX REMITTANCES ===================
export const taxRemittances = pgTable("tax_remittances", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jurisdictionId: varchar("jurisdiction_id").references(() => taxJurisdictions.id),
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  totalCollected: decimal("total_collected", { precision: 10, scale: 2 }),
  totalCryptoUsd: decimal("total_crypto_usd", { precision: 10, scale: 2 }),
  totalFiatUsd: decimal("total_fiat_usd", { precision: 10, scale: 2 }),
  remittanceStatus: remittanceStatusEnum("remittance_status").default("pending"),
  confirmationNumber: text("confirmation_number"),
  filedDate: timestamp("filed_date"),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== COMPLIANCE LOGS ===================
export const complianceLogs = pgTable("compliance_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: complianceTypeEnum("type").notNull(),
  entityId: varchar("entity_id"),
  details: json("details").$type<Record<string, unknown>>(),
  status: text("status").notNull(),
  expiryDate: timestamp("expiry_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// =================== DELIVERY WINDOWS ===================
export const deliveryWindows = pgTable("delivery_windows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: text("region").notNull(),
  alcoholStartHour: integer("alcohol_start_hour").default(8),
  alcoholEndHour: integer("alcohol_end_hour").default(22),
  isActive: boolean("is_active").default(true),
});

// =================== REFERRALS ===================
export const referrals = pgTable("referrals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => customers.id),
  referredId: varchar("referred_id").references(() => customers.id),
  code: text("code").notNull().unique(),
  credited: boolean("credited").default(false),
  creditAmount: decimal("credit_amount", { precision: 10, scale: 2 }).default("10.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== DIGITAL AGREEMENTS ===================
export const digitalAgreements = pgTable("digital_agreements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: text("entity_type").notNull(),
  entityId: varchar("entity_id").notNull(),
  agreementType: text("agreement_type").notNull(),
  agreementText: text("agreement_text").notNull(),
  signedAt: timestamp("signed_at"),
  signatureData: text("signature_data"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== BLOCKCHAIN: WALLETS ===================
export const escrowStatusEnum = pgEnum("escrow_status", ["deposited", "released", "disputed", "refunded", "expired"]);
export const nftStatusEnum = pgEnum("nft_status", ["pending", "minted", "transferred", "listed", "sold"]);

export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  walletAddress: text("wallet_address").notNull(),
  walletType: text("wallet_type").default("coinbase"),
  chainId: integer("chain_id").default(8453),
  isDefault: boolean("is_default").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== BLOCKCHAIN: ESCROW TRANSACTIONS ===================
export const escrowTransactions = pgTable("escrow_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => orders.id),
  depositorAddress: text("depositor_address").notNull(),
  sellerAddress: text("seller_address").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  tokenAddress: text("token_address"),
  txHash: text("tx_hash"),
  escrowId: text("escrow_id"),
  status: escrowStatusEnum("status").default("deposited"),
  depositedAt: timestamp("deposited_at").defaultNow().notNull(),
  releasedAt: timestamp("released_at"),
  disputedAt: timestamp("disputed_at"),
  refundedAt: timestamp("refunded_at"),
  chainId: integer("chain_id").default(8453),
});

// =================== BLOCKCHAIN: NFT REWARDS ===================
export const nftRewards = pgTable("nft_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  tokenId: text("token_id"),
  contractAddress: text("contract_address"),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  metadataUri: text("metadata_uri"),
  milestoneType: text("milestone_type").notNull(),
  milestoneValue: integer("milestone_value"),
  txHash: text("tx_hash"),
  status: nftStatusEnum("status").default("pending"),
  mintedAt: timestamp("minted_at"),
  listedPrice: decimal("listed_price", { precision: 18, scale: 8 }),
  chainId: integer("chain_id").default(8453),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// =================== BLOCKCHAIN: NFT MARKETPLACE LISTINGS ===================
export const nftListings = pgTable("nft_listings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nftId: varchar("nft_id").notNull().references(() => nftRewards.id),
  sellerUserId: varchar("seller_user_id").notNull().references(() => users.id),
  buyerUserId: varchar("buyer_user_id").references(() => users.id),
  price: decimal("price", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").default("USDC"),
  status: text("listing_status").default("active"),
  txHash: text("tx_hash"),
  listedAt: timestamp("listed_at").defaultNow().notNull(),
  soldAt: timestamp("sold_at"),
});

// =================== ZOD SCHEMAS ===================
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  phone: true,
  passwordHash: true,
  role: true,
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["customer", "driver"]).default("customer"),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const createOrderSchema = z.object({
  restaurantId: z.string(),
  items: z.array(z.object({
    menuItemId: z.string(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().min(1),
    isAlcohol: z.boolean().default(false),
  })),
  deliveryAddress: z.string(),
  specialInstructions: z.string().optional(),
  paymentMethod: z.string(),
  tip: z.number().default(0),
  ageVerified: z.boolean().default(false),
});

export const rateOrderSchema = z.object({
  restaurantRating: z.number().min(1).max(5).optional(),
  driverRating: z.number().min(1).max(5).optional(),
  comment: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Driver = typeof drivers.$inferSelect;
export type Restaurant = typeof restaurants.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Review = typeof reviews.$inferSelect;
export type TaxJurisdiction = typeof taxJurisdictions.$inferSelect;
export type TaxTransaction = typeof taxTransactions.$inferSelect;
export type DriverStatus = typeof driverStatusTable.$inferSelect;
export type DriverSupportLogEntry = typeof driverSupportLog.$inferSelect;
export type ComplianceLog = typeof complianceLogs.$inferSelect;
export type Wallet = typeof wallets.$inferSelect;
export type EscrowTransaction = typeof escrowTransactions.$inferSelect;
export type NftReward = typeof nftRewards.$inferSelect;
export type NftListing = typeof nftListings.$inferSelect;
