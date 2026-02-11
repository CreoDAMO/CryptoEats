"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc3) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc3 = __getOwnPropDesc(from, key)) || desc3.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// server/vercel-entry.ts
var vercel_entry_exports = {};
__export(vercel_entry_exports, {
  default: () => vercel_entry_default
});
module.exports = __toCommonJS(vercel_entry_exports);
var import_express = __toESM(require("express"));

// server/routes.ts
var import_node_http = require("node:http");
var import_socket = require("socket.io");
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));
var import_express_rate_limit = __toESM(require("express-rate-limit"));
var import_multer = __toESM(require("multer"));

// server/storage.ts
var import_drizzle_orm3 = require("drizzle-orm");

// server/db.ts
var import_pg = require("pg");
var import_node_postgres = require("drizzle-orm/node-postgres");

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  agreementTypeEnum: () => agreementTypeEnum,
  analytics: () => analytics,
  apiAuditLogs: () => apiAuditLogs,
  apiKeyTierEnum: () => apiKeyTierEnum,
  apiKeys: () => apiKeys,
  bundles: () => bundles,
  chatTypeEnum: () => chatTypeEnum,
  chats: () => chats,
  complianceLogs: () => complianceLogs,
  complianceTypeEnum: () => complianceTypeEnum,
  conversations: () => conversations,
  createOrderSchema: () => createOrderSchema,
  customers: () => customers,
  deliveryWindows: () => deliveryWindows,
  digitalAgreements: () => digitalAgreements,
  driverEarnings: () => driverEarnings,
  driverOnboardingSchema: () => driverOnboardingSchema,
  driverStatusEnum: () => driverStatusEnum,
  driverStatusTable: () => driverStatusTable,
  driverSupportLog: () => driverSupportLog,
  drivers: () => drivers,
  engagementTierEnum: () => engagementTierEnum,
  escrowStatusEnum: () => escrowStatusEnum,
  escrowTransactions: () => escrowTransactions,
  idVerifications: () => idVerifications,
  inboundOrders: () => inboundOrders,
  insertConversationSchema: () => insertConversationSchema,
  insertMessageSchema: () => insertMessageSchema,
  insertUserSchema: () => insertUserSchema,
  integrationPartners: () => integrationPartners,
  interactionTypeEnum: () => interactionTypeEnum,
  legalAgreements: () => legalAgreements,
  licenseVerifications: () => licenseVerifications,
  loginSchema: () => loginSchema,
  menuItems: () => menuItems,
  merchantOnboardingSchema: () => merchantOnboardingSchema,
  messages: () => messages,
  nftCategoryEnum: () => nftCategoryEnum,
  nftListings: () => nftListings,
  nftRewards: () => nftRewards,
  nftStatusEnum: () => nftStatusEnum,
  offrampStatusEnum: () => offrampStatusEnum,
  offrampTransactions: () => offrampTransactions,
  onboardingApplications: () => onboardingApplications,
  onboardingStatusEnum: () => onboardingStatusEnum,
  onrampStatusEnum: () => onrampStatusEnum,
  onrampTransactions: () => onrampTransactions,
  orderStatusEnum: () => orderStatusEnum,
  orders: () => orders,
  paymentStatusEnum: () => paymentStatusEnum,
  pushTokens: () => pushTokens,
  rateOrderSchema: () => rateOrderSchema,
  referrals: () => referrals,
  registerSchema: () => registerSchema,
  remittanceStatusEnum: () => remittanceStatusEnum,
  restaurants: () => restaurants,
  reviews: () => reviews,
  taxJurisdictions: () => taxJurisdictions,
  taxRemittances: () => taxRemittances,
  taxStatusEnum: () => taxStatusEnum,
  taxTransactions: () => taxTransactions,
  userRoleEnum: () => userRoleEnum,
  users: () => users,
  verificationMethodEnum: () => verificationMethodEnum,
  wallets: () => wallets,
  webhookDeliveries: () => webhookDeliveries,
  webhookEventEnum: () => webhookEventEnum,
  webhooks: () => webhooks,
  whiteLabelConfigs: () => whiteLabelConfigs
});
var import_drizzle_orm2 = require("drizzle-orm");
var import_pg_core2 = require("drizzle-orm/pg-core");
var import_drizzle_zod2 = require("drizzle-zod");
var import_zod = require("zod");

// shared/models/chat.ts
var import_pg_core = require("drizzle-orm/pg-core");
var import_drizzle_zod = require("drizzle-zod");
var import_drizzle_orm = require("drizzle-orm");
var conversations = (0, import_pg_core.pgTable)("conversations", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  title: (0, import_pg_core.text)("title").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`).notNull()
});
var messages = (0, import_pg_core.pgTable)("messages", {
  id: (0, import_pg_core.serial)("id").primaryKey(),
  conversationId: (0, import_pg_core.integer)("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: (0, import_pg_core.text)("role").notNull(),
  content: (0, import_pg_core.text)("content").notNull(),
  createdAt: (0, import_pg_core.timestamp)("created_at").default(import_drizzle_orm.sql`CURRENT_TIMESTAMP`).notNull()
});
var insertConversationSchema = (0, import_drizzle_zod.createInsertSchema)(conversations).omit({
  id: true,
  createdAt: true
});
var insertMessageSchema = (0, import_drizzle_zod.createInsertSchema)(messages).omit({
  id: true,
  createdAt: true
});

// shared/schema.ts
var userRoleEnum = (0, import_pg_core2.pgEnum)("user_role", ["customer", "driver", "admin", "restaurant"]);
var orderStatusEnum = (0, import_pg_core2.pgEnum)("order_status", ["pending", "confirmed", "preparing", "picked_up", "arriving", "delivered", "cancelled"]);
var paymentStatusEnum = (0, import_pg_core2.pgEnum)("payment_status", ["pending", "processing", "completed", "failed", "refunded"]);
var taxStatusEnum = (0, import_pg_core2.pgEnum)("tax_status", ["collected", "remitted", "pending"]);
var remittanceStatusEnum = (0, import_pg_core2.pgEnum)("remittance_status", ["pending", "filed", "paid"]);
var driverStatusEnum = (0, import_pg_core2.pgEnum)("driver_status", ["active", "on_break", "suspended_review", "suspended_safety", "offline"]);
var engagementTierEnum = (0, import_pg_core2.pgEnum)("engagement_tier", ["active", "regular", "casual", "on_break"]);
var interactionTypeEnum = (0, import_pg_core2.pgEnum)("interaction_type", ["wellness_check", "education", "investigation", "appeal"]);
var complianceTypeEnum = (0, import_pg_core2.pgEnum)("compliance_type", ["license", "tax_filing", "agreement", "insurance"]);
var chatTypeEnum = (0, import_pg_core2.pgEnum)("chat_type", ["text", "image", "system"]);
var verificationMethodEnum = (0, import_pg_core2.pgEnum)("verification_method", ["checkout", "delivery"]);
var onrampStatusEnum = (0, import_pg_core2.pgEnum)("onramp_status", ["pending", "processing", "completed", "failed"]);
var offrampStatusEnum = (0, import_pg_core2.pgEnum)("offramp_status", ["pending", "quote_ready", "processing", "completed", "failed"]);
var onboardingStatusEnum = (0, import_pg_core2.pgEnum)("onboarding_status", ["not_started", "in_progress", "pending_review", "approved", "rejected"]);
var users = (0, import_pg_core2.pgTable)("users", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  email: (0, import_pg_core2.text)("email").notNull().unique(),
  phone: (0, import_pg_core2.text)("phone"),
  passwordHash: (0, import_pg_core2.text)("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("customer"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
}, (table) => [
  (0, import_pg_core2.index)("users_email_idx").on(table.email),
  (0, import_pg_core2.index)("users_role_idx").on(table.role)
]);
var customers = (0, import_pg_core2.pgTable)("customers", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  firstName: (0, import_pg_core2.text)("first_name").notNull(),
  lastName: (0, import_pg_core2.text)("last_name").notNull(),
  idVerified: (0, import_pg_core2.boolean)("id_verified").default(false),
  idVerificationData: (0, import_pg_core2.text)("id_verification_data"),
  tastePreferences: (0, import_pg_core2.json)("taste_preferences").$type().default([]),
  dietaryRestrictions: (0, import_pg_core2.json)("dietary_restrictions").$type().default([]),
  referralCode: (0, import_pg_core2.text)("referral_code"),
  savedAddresses: (0, import_pg_core2.json)("saved_addresses").$type().default([]),
  favoriteRestaurants: (0, import_pg_core2.json)("favorite_restaurants").$type().default([]),
  favoriteItems: (0, import_pg_core2.json)("favorite_items").$type().default([])
}, (table) => [
  (0, import_pg_core2.index)("customers_user_idx").on(table.userId)
]);
var drivers = (0, import_pg_core2.pgTable)("drivers", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  firstName: (0, import_pg_core2.text)("first_name").notNull(),
  lastName: (0, import_pg_core2.text)("last_name").notNull(),
  licenseNumber: (0, import_pg_core2.text)("license_number"),
  vehicleInfo: (0, import_pg_core2.text)("vehicle_info"),
  backgroundCheckStatus: (0, import_pg_core2.text)("background_check_status").default("pending"),
  isAvailable: (0, import_pg_core2.boolean)("is_available").default(false),
  currentLat: (0, import_pg_core2.real)("current_lat"),
  currentLng: (0, import_pg_core2.real)("current_lng"),
  rating: (0, import_pg_core2.real)("rating").default(5),
  totalDeliveries: (0, import_pg_core2.integer)("total_deliveries").default(0),
  earningsData: (0, import_pg_core2.json)("earnings_data").$type(),
  insuranceData: (0, import_pg_core2.json)("insurance_data").$type(),
  photoUrl: (0, import_pg_core2.text)("photo_url"),
  bio: (0, import_pg_core2.text)("bio")
}, (table) => [
  (0, import_pg_core2.index)("drivers_user_idx").on(table.userId),
  (0, import_pg_core2.index)("drivers_available_idx").on(table.isAvailable)
]);
var driverStatusTable = (0, import_pg_core2.pgTable)("driver_status_records", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  driverId: (0, import_pg_core2.varchar)("driver_id").notNull().references(() => drivers.id),
  status: driverStatusEnum("status").notNull().default("active"),
  engagementTier: engagementTierEnum("engagement_tier").notNull().default("active"),
  suspensionReason: (0, import_pg_core2.text)("suspension_reason"),
  suspensionDate: (0, import_pg_core2.timestamp)("suspension_date"),
  reviewStatus: (0, import_pg_core2.text)("review_status"),
  appealDeadline: (0, import_pg_core2.timestamp)("appeal_deadline"),
  supportNotes: (0, import_pg_core2.text)("support_notes"),
  returnDate: (0, import_pg_core2.timestamp)("return_date"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var driverSupportLog = (0, import_pg_core2.pgTable)("driver_support_log", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  driverId: (0, import_pg_core2.varchar)("driver_id").notNull().references(() => drivers.id),
  interactionType: interactionTypeEnum("interaction_type").notNull(),
  notes: (0, import_pg_core2.text)("notes"),
  outcome: (0, import_pg_core2.text)("outcome"),
  supportRep: (0, import_pg_core2.text)("support_rep"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var driverEarnings = (0, import_pg_core2.pgTable)("driver_earnings", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  driverId: (0, import_pg_core2.varchar)("driver_id").notNull().references(() => drivers.id),
  orderId: (0, import_pg_core2.varchar)("order_id"),
  basePay: (0, import_pg_core2.decimal)("base_pay", { precision: 10, scale: 2 }).default("0"),
  mileagePay: (0, import_pg_core2.decimal)("mileage_pay", { precision: 10, scale: 2 }).default("0"),
  timePay: (0, import_pg_core2.decimal)("time_pay", { precision: 10, scale: 2 }).default("0"),
  tipAmount: (0, import_pg_core2.decimal)("tip_amount", { precision: 10, scale: 2 }).default("0"),
  bonusAmount: (0, import_pg_core2.decimal)("bonus_amount", { precision: 10, scale: 2 }).default("0"),
  totalPayout: (0, import_pg_core2.decimal)("total_payout", { precision: 10, scale: 2 }).default("0"),
  paymentMethod: (0, import_pg_core2.text)("payment_method"),
  cryptoCurrency: (0, import_pg_core2.text)("crypto_currency"),
  cryptoAmount: (0, import_pg_core2.decimal)("crypto_amount", { precision: 18, scale: 8 }),
  usdValue: (0, import_pg_core2.decimal)("usd_value", { precision: 10, scale: 2 }),
  payoutStatus: (0, import_pg_core2.text)("payout_status").default("pending"),
  paidAt: (0, import_pg_core2.timestamp)("paid_at"),
  taxYear: (0, import_pg_core2.integer)("tax_year"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var restaurants = (0, import_pg_core2.pgTable)("restaurants", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").references(() => users.id),
  name: (0, import_pg_core2.text)("name").notNull(),
  cuisineType: (0, import_pg_core2.text)("cuisine_type").notNull(),
  address: (0, import_pg_core2.text)("address").notNull(),
  phone: (0, import_pg_core2.text)("phone"),
  rating: (0, import_pg_core2.real)("rating").default(4.5),
  reviewCount: (0, import_pg_core2.integer)("review_count").default(0),
  deliveryFee: (0, import_pg_core2.decimal)("delivery_fee", { precision: 10, scale: 2 }).default("2.99"),
  minOrder: (0, import_pg_core2.decimal)("min_order", { precision: 10, scale: 2 }).default("10"),
  estimatedPrepTime: (0, import_pg_core2.text)("estimated_prep_time").default("25-35 min"),
  alcoholLicense: (0, import_pg_core2.boolean)("alcohol_license").default(false),
  operatingHours: (0, import_pg_core2.json)("operating_hours").$type(),
  imageUrl: (0, import_pg_core2.text)("image_url"),
  featured: (0, import_pg_core2.boolean)("featured").default(false),
  distance: (0, import_pg_core2.text)("distance"),
  isApproved: (0, import_pg_core2.boolean)("is_approved").default(false),
  isSuspended: (0, import_pg_core2.boolean)("is_suspended").default(false),
  agreementSignedDate: (0, import_pg_core2.timestamp)("agreement_signed_date"),
  agreementData: (0, import_pg_core2.text)("agreement_data"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var menuItems = (0, import_pg_core2.pgTable)("menu_items", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  restaurantId: (0, import_pg_core2.varchar)("restaurant_id").notNull().references(() => restaurants.id),
  name: (0, import_pg_core2.text)("name").notNull(),
  description: (0, import_pg_core2.text)("description"),
  price: (0, import_pg_core2.decimal)("price", { precision: 10, scale: 2 }).notNull(),
  category: (0, import_pg_core2.text)("category").notNull(),
  isAlcohol: (0, import_pg_core2.boolean)("is_alcohol").default(false),
  ageVerificationRequired: (0, import_pg_core2.boolean)("age_verification_required").default(false),
  dietaryTags: (0, import_pg_core2.json)("dietary_tags").$type().default([]),
  available: (0, import_pg_core2.boolean)("available").default(true),
  pairingSuggestions: (0, import_pg_core2.json)("pairing_suggestions").$type().default([]),
  imageUrl: (0, import_pg_core2.text)("image_url")
}, (table) => [
  (0, import_pg_core2.index)("menu_items_restaurant_idx").on(table.restaurantId),
  (0, import_pg_core2.index)("menu_items_category_idx").on(table.category),
  (0, import_pg_core2.index)("menu_items_available_idx").on(table.available)
]);
var orders = (0, import_pg_core2.pgTable)("orders", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  customerId: (0, import_pg_core2.varchar)("customer_id").notNull().references(() => customers.id),
  driverId: (0, import_pg_core2.varchar)("driver_id").references(() => drivers.id),
  restaurantId: (0, import_pg_core2.varchar)("restaurant_id").notNull().references(() => restaurants.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  items: (0, import_pg_core2.json)("items").$type().notNull(),
  subtotal: (0, import_pg_core2.decimal)("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: (0, import_pg_core2.decimal)("delivery_fee", { precision: 10, scale: 2 }).notNull(),
  serviceFee: (0, import_pg_core2.decimal)("service_fee", { precision: 10, scale: 2 }).notNull(),
  tip: (0, import_pg_core2.decimal)("tip", { precision: 10, scale: 2 }).default("0"),
  total: (0, import_pg_core2.decimal)("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: (0, import_pg_core2.text)("payment_method").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending"),
  paymentIntentId: (0, import_pg_core2.text)("payment_intent_id"),
  paymentProvider: (0, import_pg_core2.text)("payment_provider").default("stripe"),
  deliveryAddress: (0, import_pg_core2.text)("delivery_address").notNull(),
  specialInstructions: (0, import_pg_core2.text)("special_instructions"),
  requiresAgeVerification: (0, import_pg_core2.boolean)("requires_age_verification").default(false),
  ageVerifiedAtDelivery: (0, import_pg_core2.boolean)("age_verified_at_delivery").default(false),
  signatureData: (0, import_pg_core2.text)("signature_data"),
  taxableAmount: (0, import_pg_core2.decimal)("taxable_amount", { precision: 10, scale: 2 }),
  taxCollected: (0, import_pg_core2.decimal)("tax_collected", { precision: 10, scale: 2 }),
  taxRate: (0, import_pg_core2.decimal)("tax_rate", { precision: 5, scale: 4 }),
  eta: (0, import_pg_core2.text)("eta"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  deliveredAt: (0, import_pg_core2.timestamp)("delivered_at")
}, (table) => [
  (0, import_pg_core2.index)("orders_status_idx").on(table.status),
  (0, import_pg_core2.index)("orders_customer_idx").on(table.customerId),
  (0, import_pg_core2.index)("orders_driver_idx").on(table.driverId),
  (0, import_pg_core2.index)("orders_restaurant_idx").on(table.restaurantId),
  (0, import_pg_core2.index)("orders_created_at_idx").on(table.createdAt),
  (0, import_pg_core2.index)("orders_payment_status_idx").on(table.paymentStatus)
]);
var bundles = (0, import_pg_core2.pgTable)("bundles", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  name: (0, import_pg_core2.text)("name").notNull(),
  items: (0, import_pg_core2.json)("items").$type().notNull(),
  discountPercentage: (0, import_pg_core2.integer)("discount_percentage").notNull(),
  active: (0, import_pg_core2.boolean)("active").default(true),
  conditions: (0, import_pg_core2.json)("conditions").$type(),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var chats = (0, import_pg_core2.pgTable)("chats", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  orderId: (0, import_pg_core2.varchar)("order_id").notNull().references(() => orders.id),
  senderId: (0, import_pg_core2.varchar)("sender_id").notNull().references(() => users.id),
  message: (0, import_pg_core2.text)("message").notNull(),
  type: chatTypeEnum("type").default("text"),
  timestamp: (0, import_pg_core2.timestamp)("timestamp").defaultNow().notNull()
}, (table) => [
  (0, import_pg_core2.index)("chats_order_idx").on(table.orderId),
  (0, import_pg_core2.index)("chats_timestamp_idx").on(table.timestamp)
]);
var idVerifications = (0, import_pg_core2.pgTable)("id_verifications", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  customerId: (0, import_pg_core2.varchar)("customer_id").notNull().references(() => customers.id),
  orderId: (0, import_pg_core2.varchar)("order_id").references(() => orders.id),
  scanData: (0, import_pg_core2.text)("scan_data"),
  verified: (0, import_pg_core2.boolean)("verified").default(false),
  verifiedAt: (0, import_pg_core2.timestamp)("verified_at"),
  method: verificationMethodEnum("method").notNull(),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var reviews = (0, import_pg_core2.pgTable)("reviews", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  orderId: (0, import_pg_core2.varchar)("order_id").notNull().references(() => orders.id),
  customerId: (0, import_pg_core2.varchar)("customer_id").notNull().references(() => customers.id),
  restaurantId: (0, import_pg_core2.varchar)("restaurant_id").references(() => restaurants.id),
  driverId: (0, import_pg_core2.varchar)("driver_id").references(() => drivers.id),
  restaurantRating: (0, import_pg_core2.integer)("restaurant_rating"),
  driverRating: (0, import_pg_core2.integer)("driver_rating"),
  comment: (0, import_pg_core2.text)("comment"),
  restaurantResponse: (0, import_pg_core2.text)("restaurant_response"),
  flagged: (0, import_pg_core2.boolean)("flagged").default(false),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var analytics = (0, import_pg_core2.pgTable)("analytics", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  metricType: (0, import_pg_core2.text)("metric_type").notNull(),
  value: (0, import_pg_core2.decimal)("value", { precision: 15, scale: 2 }).notNull(),
  timestamp: (0, import_pg_core2.timestamp)("timestamp").defaultNow().notNull()
});
var taxJurisdictions = (0, import_pg_core2.pgTable)("tax_jurisdictions", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  zipCode: (0, import_pg_core2.text)("zip_code").notNull(),
  city: (0, import_pg_core2.text)("city").notNull(),
  county: (0, import_pg_core2.text)("county").notNull(),
  state: (0, import_pg_core2.text)("state").notNull(),
  stateRate: (0, import_pg_core2.decimal)("state_rate", { precision: 5, scale: 4 }).notNull(),
  localRate: (0, import_pg_core2.decimal)("local_rate", { precision: 5, scale: 4 }).notNull(),
  totalRate: (0, import_pg_core2.decimal)("total_rate", { precision: 5, scale: 4 }).notNull(),
  effectiveDate: (0, import_pg_core2.timestamp)("effective_date").defaultNow(),
  lastUpdated: (0, import_pg_core2.timestamp)("last_updated").defaultNow()
});
var taxTransactions = (0, import_pg_core2.pgTable)("tax_transactions", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  orderId: (0, import_pg_core2.varchar)("order_id").notNull().references(() => orders.id),
  jurisdictionId: (0, import_pg_core2.varchar)("jurisdiction_id").references(() => taxJurisdictions.id),
  subtotal: (0, import_pg_core2.decimal)("subtotal", { precision: 10, scale: 2 }),
  deliveryFee: (0, import_pg_core2.decimal)("delivery_fee", { precision: 10, scale: 2 }),
  serviceFee: (0, import_pg_core2.decimal)("service_fee", { precision: 10, scale: 2 }),
  taxableAmount: (0, import_pg_core2.decimal)("taxable_amount", { precision: 10, scale: 2 }),
  taxRate: (0, import_pg_core2.decimal)("tax_rate", { precision: 5, scale: 4 }),
  taxCollected: (0, import_pg_core2.decimal)("tax_collected", { precision: 10, scale: 2 }),
  taxStatus: taxStatusEnum("tax_status").default("collected"),
  paymentMethod: (0, import_pg_core2.text)("payment_method"),
  cryptoCurrency: (0, import_pg_core2.text)("crypto_currency"),
  cryptoAmount: (0, import_pg_core2.decimal)("crypto_amount", { precision: 18, scale: 8 }),
  usdValue: (0, import_pg_core2.decimal)("usd_value", { precision: 10, scale: 2 }),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var taxRemittances = (0, import_pg_core2.pgTable)("tax_remittances", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  jurisdictionId: (0, import_pg_core2.varchar)("jurisdiction_id").references(() => taxJurisdictions.id),
  periodStart: (0, import_pg_core2.timestamp)("period_start").notNull(),
  periodEnd: (0, import_pg_core2.timestamp)("period_end").notNull(),
  totalCollected: (0, import_pg_core2.decimal)("total_collected", { precision: 10, scale: 2 }),
  totalCryptoUsd: (0, import_pg_core2.decimal)("total_crypto_usd", { precision: 10, scale: 2 }),
  totalFiatUsd: (0, import_pg_core2.decimal)("total_fiat_usd", { precision: 10, scale: 2 }),
  remittanceStatus: remittanceStatusEnum("remittance_status").default("pending"),
  confirmationNumber: (0, import_pg_core2.text)("confirmation_number"),
  filedDate: (0, import_pg_core2.timestamp)("filed_date"),
  paidDate: (0, import_pg_core2.timestamp)("paid_date"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var complianceLogs = (0, import_pg_core2.pgTable)("compliance_logs", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  type: complianceTypeEnum("type").notNull(),
  entityId: (0, import_pg_core2.varchar)("entity_id"),
  details: (0, import_pg_core2.json)("details").$type(),
  status: (0, import_pg_core2.text)("status").notNull(),
  expiryDate: (0, import_pg_core2.timestamp)("expiry_date"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
}, (table) => [
  (0, import_pg_core2.index)("compliance_entity_idx").on(table.entityId),
  (0, import_pg_core2.index)("compliance_type_idx").on(table.type),
  (0, import_pg_core2.index)("compliance_status_idx").on(table.status)
]);
var deliveryWindows = (0, import_pg_core2.pgTable)("delivery_windows", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  region: (0, import_pg_core2.text)("region").notNull(),
  alcoholStartHour: (0, import_pg_core2.integer)("alcohol_start_hour").default(8),
  alcoholEndHour: (0, import_pg_core2.integer)("alcohol_end_hour").default(22),
  isActive: (0, import_pg_core2.boolean)("is_active").default(true)
});
var referrals = (0, import_pg_core2.pgTable)("referrals", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  referrerId: (0, import_pg_core2.varchar)("referrer_id").notNull().references(() => customers.id),
  referredId: (0, import_pg_core2.varchar)("referred_id").references(() => customers.id),
  code: (0, import_pg_core2.text)("code").notNull().unique(),
  credited: (0, import_pg_core2.boolean)("credited").default(false),
  creditAmount: (0, import_pg_core2.decimal)("credit_amount", { precision: 10, scale: 2 }).default("10.00"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var digitalAgreements = (0, import_pg_core2.pgTable)("digital_agreements", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  entityType: (0, import_pg_core2.text)("entity_type").notNull(),
  entityId: (0, import_pg_core2.varchar)("entity_id").notNull(),
  agreementType: (0, import_pg_core2.text)("agreement_type").notNull(),
  agreementText: (0, import_pg_core2.text)("agreement_text").notNull(),
  signedAt: (0, import_pg_core2.timestamp)("signed_at"),
  signatureData: (0, import_pg_core2.text)("signature_data"),
  ipAddress: (0, import_pg_core2.text)("ip_address"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var escrowStatusEnum = (0, import_pg_core2.pgEnum)("escrow_status", ["deposited", "released", "disputed", "refunded", "expired"]);
var nftStatusEnum = (0, import_pg_core2.pgEnum)("nft_status", ["pending", "minted", "transferred", "listed", "sold"]);
var wallets = (0, import_pg_core2.pgTable)("wallets", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  walletAddress: (0, import_pg_core2.text)("wallet_address").notNull(),
  walletType: (0, import_pg_core2.text)("wallet_type").default("coinbase"),
  chainId: (0, import_pg_core2.integer)("chain_id").default(8453),
  isDefault: (0, import_pg_core2.boolean)("is_default").default(true),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var escrowTransactions = (0, import_pg_core2.pgTable)("escrow_transactions", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  orderId: (0, import_pg_core2.varchar)("order_id").notNull().references(() => orders.id),
  depositorAddress: (0, import_pg_core2.text)("depositor_address").notNull(),
  sellerAddress: (0, import_pg_core2.text)("seller_address").notNull(),
  amount: (0, import_pg_core2.decimal)("amount", { precision: 18, scale: 8 }).notNull(),
  tokenAddress: (0, import_pg_core2.text)("token_address"),
  txHash: (0, import_pg_core2.text)("tx_hash"),
  escrowId: (0, import_pg_core2.text)("escrow_id"),
  status: escrowStatusEnum("status").default("deposited"),
  depositedAt: (0, import_pg_core2.timestamp)("deposited_at").defaultNow().notNull(),
  releasedAt: (0, import_pg_core2.timestamp)("released_at"),
  disputedAt: (0, import_pg_core2.timestamp)("disputed_at"),
  refundedAt: (0, import_pg_core2.timestamp)("refunded_at"),
  chainId: (0, import_pg_core2.integer)("chain_id").default(8453)
});
var nftCategoryEnum = (0, import_pg_core2.pgEnum)("nft_category", ["milestone", "merchant_dish", "driver_avatar", "customer_loyalty", "marketplace_art"]);
var nftRewards = (0, import_pg_core2.pgTable)("nft_rewards", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  tokenId: (0, import_pg_core2.text)("token_id"),
  contractAddress: (0, import_pg_core2.text)("contract_address"),
  name: (0, import_pg_core2.text)("name").notNull(),
  description: (0, import_pg_core2.text)("description"),
  imageUrl: (0, import_pg_core2.text)("image_url"),
  metadataUri: (0, import_pg_core2.text)("metadata_uri"),
  milestoneType: (0, import_pg_core2.text)("milestone_type").notNull(),
  milestoneValue: (0, import_pg_core2.integer)("milestone_value"),
  txHash: (0, import_pg_core2.text)("tx_hash"),
  status: nftStatusEnum("status").default("pending"),
  mintedAt: (0, import_pg_core2.timestamp)("minted_at"),
  listedPrice: (0, import_pg_core2.decimal)("listed_price", { precision: 18, scale: 8 }),
  chainId: (0, import_pg_core2.integer)("chain_id").default(8453),
  nftCategory: nftCategoryEnum("nft_category").default("milestone"),
  aiGenerated: (0, import_pg_core2.boolean)("ai_generated").default(false),
  aiPrompt: (0, import_pg_core2.text)("ai_prompt"),
  restaurantId: (0, import_pg_core2.varchar)("restaurant_id"),
  dishName: (0, import_pg_core2.text)("dish_name"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var nftListings = (0, import_pg_core2.pgTable)("nft_listings", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  nftId: (0, import_pg_core2.varchar)("nft_id").notNull().references(() => nftRewards.id),
  sellerUserId: (0, import_pg_core2.varchar)("seller_user_id").notNull().references(() => users.id),
  buyerUserId: (0, import_pg_core2.varchar)("buyer_user_id").references(() => users.id),
  price: (0, import_pg_core2.decimal)("price", { precision: 18, scale: 8 }).notNull(),
  currency: (0, import_pg_core2.text)("currency").default("USDC"),
  status: (0, import_pg_core2.text)("listing_status").default("active"),
  txHash: (0, import_pg_core2.text)("tx_hash"),
  listedAt: (0, import_pg_core2.timestamp)("listed_at").defaultNow().notNull(),
  soldAt: (0, import_pg_core2.timestamp)("sold_at")
});
var onrampTransactions = (0, import_pg_core2.pgTable)("onramp_transactions", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  walletAddress: (0, import_pg_core2.text)("wallet_address").notNull(),
  fiatCurrency: (0, import_pg_core2.text)("fiat_currency").default("USD"),
  fiatAmount: (0, import_pg_core2.decimal)("fiat_amount", { precision: 18, scale: 2 }).notNull(),
  cryptoCurrency: (0, import_pg_core2.text)("crypto_currency").default("USDC"),
  cryptoAmount: (0, import_pg_core2.decimal)("crypto_amount", { precision: 18, scale: 8 }),
  network: (0, import_pg_core2.text)("network").default("base"),
  paymentMethod: (0, import_pg_core2.text)("payment_method"),
  coinbaseTransactionId: (0, import_pg_core2.text)("coinbase_transaction_id"),
  status: onrampStatusEnum("status").default("pending"),
  completedAt: (0, import_pg_core2.timestamp)("completed_at"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var offrampTransactions = (0, import_pg_core2.pgTable)("offramp_transactions", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  walletAddress: (0, import_pg_core2.text)("wallet_address").notNull(),
  cryptoCurrency: (0, import_pg_core2.text)("crypto_currency").default("USDC"),
  cryptoAmount: (0, import_pg_core2.decimal)("crypto_amount", { precision: 18, scale: 8 }).notNull(),
  fiatCurrency: (0, import_pg_core2.text)("fiat_currency").default("USD"),
  fiatAmount: (0, import_pg_core2.decimal)("fiat_amount", { precision: 18, scale: 2 }),
  network: (0, import_pg_core2.text)("network").default("base"),
  cashoutMethod: (0, import_pg_core2.text)("cashout_method").default("BANK_ACCOUNT"),
  coinbaseTransactionId: (0, import_pg_core2.text)("coinbase_transaction_id"),
  quoteId: (0, import_pg_core2.text)("quote_id"),
  fee: (0, import_pg_core2.decimal)("fee", { precision: 18, scale: 2 }),
  exchangeRate: (0, import_pg_core2.decimal)("exchange_rate", { precision: 18, scale: 8 }),
  status: offrampStatusEnum("status").default("pending"),
  estimatedArrival: (0, import_pg_core2.text)("estimated_arrival"),
  completedAt: (0, import_pg_core2.timestamp)("completed_at"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var pushTokens = (0, import_pg_core2.pgTable)("push_tokens", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  token: (0, import_pg_core2.text)("token").notNull(),
  platform: (0, import_pg_core2.text)("platform").default("expo"),
  active: (0, import_pg_core2.boolean)("active").default(true),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var onboardingApplications = (0, import_pg_core2.pgTable)("onboarding_applications", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  role: (0, import_pg_core2.text)("role").notNull(),
  status: onboardingStatusEnum("status").notNull().default("not_started"),
  step: (0, import_pg_core2.integer)("step").default(1),
  businessName: (0, import_pg_core2.text)("business_name"),
  businessAddress: (0, import_pg_core2.text)("business_address"),
  businessPhone: (0, import_pg_core2.text)("business_phone"),
  einNumber: (0, import_pg_core2.text)("ein_number"),
  cuisineType: (0, import_pg_core2.text)("cuisine_type"),
  hasAlcoholLicense: (0, import_pg_core2.boolean)("has_alcohol_license").default(false),
  alcoholLicenseNumber: (0, import_pg_core2.text)("alcohol_license_number"),
  operatingHoursData: (0, import_pg_core2.json)("operating_hours_data").$type(),
  licenseNumber: (0, import_pg_core2.text)("license_number"),
  vehicleType: (0, import_pg_core2.text)("vehicle_type"),
  vehicleMake: (0, import_pg_core2.text)("vehicle_make"),
  vehicleModel: (0, import_pg_core2.text)("vehicle_model"),
  vehicleYear: (0, import_pg_core2.text)("vehicle_year"),
  vehicleColor: (0, import_pg_core2.text)("vehicle_color"),
  licensePlate: (0, import_pg_core2.text)("license_plate"),
  insuranceProvider: (0, import_pg_core2.text)("insurance_provider"),
  insurancePolicyNumber: (0, import_pg_core2.text)("insurance_policy_number"),
  insuranceExpiry: (0, import_pg_core2.text)("insurance_expiry"),
  backgroundCheckConsent: (0, import_pg_core2.boolean)("background_check_consent").default(false),
  agreementSigned: (0, import_pg_core2.boolean)("agreement_signed").default(false),
  agreementSignedAt: (0, import_pg_core2.timestamp)("agreement_signed_at"),
  documents: (0, import_pg_core2.json)("documents").$type().default([]),
  reviewNotes: (0, import_pg_core2.text)("review_notes"),
  reviewedBy: (0, import_pg_core2.varchar)("reviewed_by"),
  reviewedAt: (0, import_pg_core2.timestamp)("reviewed_at"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var apiKeyTierEnum = (0, import_pg_core2.pgEnum)("api_key_tier", ["free", "starter", "pro", "enterprise"]);
var apiKeys = (0, import_pg_core2.pgTable)("api_keys", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  name: (0, import_pg_core2.text)("name").notNull(),
  publicKey: (0, import_pg_core2.text)("public_key").notNull().unique(),
  secretKeyHash: (0, import_pg_core2.text)("secret_key_hash").notNull(),
  tier: apiKeyTierEnum("tier").notNull().default("free"),
  isActive: (0, import_pg_core2.boolean)("is_active").default(true),
  isSandbox: (0, import_pg_core2.boolean)("is_sandbox").default(true),
  rateLimit: (0, import_pg_core2.integer)("rate_limit").default(100),
  dailyRequests: (0, import_pg_core2.integer)("daily_requests").default(0),
  lastResetAt: (0, import_pg_core2.timestamp)("last_reset_at").defaultNow(),
  permissions: (0, import_pg_core2.json)("permissions").$type().default(["read"]),
  allowedOrigins: (0, import_pg_core2.json)("allowed_origins").$type().default([]),
  metadata: (0, import_pg_core2.json)("metadata").$type(),
  expiresAt: (0, import_pg_core2.timestamp)("expires_at"),
  lastUsedAt: (0, import_pg_core2.timestamp)("last_used_at"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var webhookEventEnum = (0, import_pg_core2.pgEnum)("webhook_event", [
  "order.created",
  "order.confirmed",
  "order.preparing",
  "order.picked_up",
  "order.delivered",
  "order.cancelled",
  "delivery.started",
  "delivery.completed",
  "payment.completed",
  "payment.failed",
  "nft.minted",
  "nft.transferred",
  "escrow.deposited",
  "escrow.released",
  "driver.assigned",
  "inventory.sync"
]);
var webhooks = (0, import_pg_core2.pgTable)("webhooks", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  apiKeyId: (0, import_pg_core2.varchar)("api_key_id").notNull().references(() => apiKeys.id),
  url: (0, import_pg_core2.text)("url").notNull(),
  events: (0, import_pg_core2.json)("events").$type().notNull(),
  secret: (0, import_pg_core2.text)("secret").notNull(),
  isActive: (0, import_pg_core2.boolean)("is_active").default(true),
  failureCount: (0, import_pg_core2.integer)("failure_count").default(0),
  lastDeliveredAt: (0, import_pg_core2.timestamp)("last_delivered_at"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var webhookDeliveries = (0, import_pg_core2.pgTable)("webhook_deliveries", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  webhookId: (0, import_pg_core2.varchar)("webhook_id").notNull().references(() => webhooks.id),
  event: (0, import_pg_core2.text)("event").notNull(),
  payload: (0, import_pg_core2.json)("payload").$type().notNull(),
  responseStatus: (0, import_pg_core2.integer)("response_status"),
  responseBody: (0, import_pg_core2.text)("response_body"),
  attempts: (0, import_pg_core2.integer)("attempts").default(1),
  success: (0, import_pg_core2.boolean)("success").default(false),
  deliveredAt: (0, import_pg_core2.timestamp)("delivered_at").defaultNow().notNull()
});
var integrationPartners = (0, import_pg_core2.pgTable)("integration_partners", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  apiKeyId: (0, import_pg_core2.varchar)("api_key_id").notNull().references(() => apiKeys.id),
  name: (0, import_pg_core2.text)("name").notNull(),
  type: (0, import_pg_core2.text)("type").notNull(),
  platform: (0, import_pg_core2.text)("platform"),
  config: (0, import_pg_core2.json)("config").$type(),
  isActive: (0, import_pg_core2.boolean)("is_active").default(true),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var whiteLabelConfigs = (0, import_pg_core2.pgTable)("white_label_configs", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  apiKeyId: (0, import_pg_core2.varchar)("api_key_id").notNull().references(() => apiKeys.id),
  brandName: (0, import_pg_core2.text)("brand_name").notNull(),
  primaryColor: (0, import_pg_core2.text)("primary_color").default("#FF6B00"),
  secondaryColor: (0, import_pg_core2.text)("secondary_color").default("#1A1A2E"),
  accentColor: (0, import_pg_core2.text)("accent_color").default("#00D4AA"),
  logoUrl: (0, import_pg_core2.text)("logo_url"),
  faviconUrl: (0, import_pg_core2.text)("favicon_url"),
  customDomain: (0, import_pg_core2.text)("custom_domain"),
  customCss: (0, import_pg_core2.text)("custom_css"),
  footerText: (0, import_pg_core2.text)("footer_text"),
  supportEmail: (0, import_pg_core2.text)("support_email"),
  isActive: (0, import_pg_core2.boolean)("is_active").default(true),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var apiAuditLogs = (0, import_pg_core2.pgTable)("api_audit_logs", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  apiKeyId: (0, import_pg_core2.varchar)("api_key_id").references(() => apiKeys.id),
  method: (0, import_pg_core2.text)("method").notNull(),
  path: (0, import_pg_core2.text)("path").notNull(),
  statusCode: (0, import_pg_core2.integer)("status_code"),
  requestBody: (0, import_pg_core2.json)("request_body").$type(),
  responseTime: (0, import_pg_core2.integer)("response_time"),
  ipAddress: (0, import_pg_core2.text)("ip_address"),
  userAgent: (0, import_pg_core2.text)("user_agent"),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var inboundOrders = (0, import_pg_core2.pgTable)("inbound_orders", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  apiKeyId: (0, import_pg_core2.varchar)("api_key_id").notNull().references(() => apiKeys.id),
  externalOrderId: (0, import_pg_core2.text)("external_order_id").notNull(),
  source: (0, import_pg_core2.text)("source").notNull(),
  customerName: (0, import_pg_core2.text)("customer_name").notNull(),
  customerPhone: (0, import_pg_core2.text)("customer_phone"),
  customerEmail: (0, import_pg_core2.text)("customer_email"),
  deliveryAddress: (0, import_pg_core2.text)("delivery_address").notNull(),
  items: (0, import_pg_core2.json)("items").$type().notNull(),
  subtotal: (0, import_pg_core2.decimal)("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: (0, import_pg_core2.decimal)("delivery_fee", { precision: 10, scale: 2 }).default("0"),
  tip: (0, import_pg_core2.decimal)("tip", { precision: 10, scale: 2 }).default("0"),
  total: (0, import_pg_core2.decimal)("total", { precision: 10, scale: 2 }).notNull(),
  specialInstructions: (0, import_pg_core2.text)("special_instructions"),
  status: (0, import_pg_core2.text)("status").default("received"),
  internalOrderId: (0, import_pg_core2.varchar)("internal_order_id"),
  metadata: (0, import_pg_core2.json)("metadata").$type(),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull(),
  updatedAt: (0, import_pg_core2.timestamp)("updated_at").defaultNow().notNull()
});
var agreementTypeEnum = (0, import_pg_core2.pgEnum)("agreement_type", [
  "terms_of_service",
  "privacy_policy",
  "contractor_agreement",
  "restaurant_partner_agreement",
  "alcohol_delivery_consent"
]);
var legalAgreements = (0, import_pg_core2.pgTable)("legal_agreements", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  userId: (0, import_pg_core2.varchar)("user_id").notNull().references(() => users.id),
  agreementType: agreementTypeEnum("agreement_type").notNull(),
  version: (0, import_pg_core2.text)("version").notNull().default("1.0"),
  acceptedAt: (0, import_pg_core2.timestamp)("accepted_at").defaultNow().notNull(),
  ipAddress: (0, import_pg_core2.text)("ip_address"),
  userAgent: (0, import_pg_core2.text)("user_agent"),
  documentHash: (0, import_pg_core2.text)("document_hash"),
  metadata: (0, import_pg_core2.json)("metadata").$type()
});
var licenseVerifications = (0, import_pg_core2.pgTable)("license_verifications", {
  id: (0, import_pg_core2.varchar)("id").primaryKey().default(import_drizzle_orm2.sql`gen_random_uuid()`),
  restaurantId: (0, import_pg_core2.varchar)("restaurant_id"),
  onboardingId: (0, import_pg_core2.varchar)("onboarding_id"),
  licenseNumber: (0, import_pg_core2.text)("license_number").notNull(),
  businessName: (0, import_pg_core2.text)("business_name"),
  verificationMethod: (0, import_pg_core2.text)("verification_method").notNull(),
  status: (0, import_pg_core2.text)("status").notNull().default("pending"),
  licenseType: (0, import_pg_core2.text)("license_type"),
  expirationDate: (0, import_pg_core2.text)("expiration_date"),
  county: (0, import_pg_core2.text)("county"),
  details: (0, import_pg_core2.json)("details").$type(),
  verifiedAt: (0, import_pg_core2.timestamp)("verified_at").defaultNow().notNull(),
  createdAt: (0, import_pg_core2.timestamp)("created_at").defaultNow().notNull()
});
var insertUserSchema = (0, import_drizzle_zod2.createInsertSchema)(users).pick({
  email: true,
  phone: true,
  passwordHash: true,
  role: true
});
var registerSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string().min(6),
  phone: import_zod.z.string().optional(),
  role: import_zod.z.enum(["customer", "driver", "restaurant"]).default("customer"),
  firstName: import_zod.z.string().min(1),
  lastName: import_zod.z.string().min(1)
});
var merchantOnboardingSchema = import_zod.z.object({
  businessName: import_zod.z.string().min(1),
  businessAddress: import_zod.z.string().min(1),
  businessPhone: import_zod.z.string().min(1),
  einNumber: import_zod.z.string().optional(),
  cuisineType: import_zod.z.string().min(1),
  hasAlcoholLicense: import_zod.z.boolean().default(false),
  alcoholLicenseNumber: import_zod.z.string().optional(),
  operatingHours: import_zod.z.object({
    open: import_zod.z.string(),
    close: import_zod.z.string(),
    days: import_zod.z.array(import_zod.z.string())
  }).optional(),
  agreementSigned: import_zod.z.boolean()
});
var driverOnboardingSchema = import_zod.z.object({
  licenseNumber: import_zod.z.string().min(1),
  vehicleType: import_zod.z.enum(["car", "motorcycle", "bicycle", "scooter"]),
  vehicleMake: import_zod.z.string().min(1),
  vehicleModel: import_zod.z.string().min(1),
  vehicleYear: import_zod.z.string().min(1),
  vehicleColor: import_zod.z.string().min(1),
  licensePlate: import_zod.z.string().min(1),
  insuranceProvider: import_zod.z.string().min(1),
  insurancePolicyNumber: import_zod.z.string().min(1),
  insuranceExpiry: import_zod.z.string().min(1),
  backgroundCheckConsent: import_zod.z.boolean(),
  agreementSigned: import_zod.z.boolean()
});
var loginSchema = import_zod.z.object({
  email: import_zod.z.string().email(),
  password: import_zod.z.string()
});
var createOrderSchema = import_zod.z.object({
  restaurantId: import_zod.z.string(),
  items: import_zod.z.array(import_zod.z.object({
    menuItemId: import_zod.z.string(),
    name: import_zod.z.string(),
    price: import_zod.z.number(),
    quantity: import_zod.z.number().min(1),
    isAlcohol: import_zod.z.boolean().default(false)
  })),
  deliveryAddress: import_zod.z.string(),
  specialInstructions: import_zod.z.string().optional(),
  paymentMethod: import_zod.z.string(),
  tip: import_zod.z.number().default(0),
  ageVerified: import_zod.z.boolean().default(false)
});
var rateOrderSchema = import_zod.z.object({
  restaurantRating: import_zod.z.number().min(1).max(5).optional(),
  driverRating: import_zod.z.number().min(1).max(5).optional(),
  comment: import_zod.z.string().optional()
});

// server/db.ts
var hasDatabase = !!process.env.DATABASE_URL;
if (!hasDatabase) {
  console.warn("[DB] DATABASE_URL is not set. The server will start but database operations will fail.");
  console.warn("[DB] Set DATABASE_URL in your Vercel project settings to connect a PostgreSQL database.");
}
var pool = hasDatabase ? new import_pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 3e4,
  connectionTimeoutMillis: 5e3,
  allowExitOnIdle: false
}) : null;
if (pool) {
  pool.on("error", (err) => {
    console.error("[DB Pool] Unexpected error on idle client:", err.message);
  });
}
var db = hasDatabase ? (0, import_node_postgres.drizzle)(pool, { schema: schema_exports }) : null;

// server/storage.ts
var storage = {
  async createUser(data) {
    const [user] = await db.insert(users).values({
      email: data.email,
      passwordHash: data.passwordHash,
      phone: data.phone || null,
      role: data.role || "customer"
    }).returning();
    return user;
  },
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.email, email)).limit(1);
    return user;
  },
  async getUserById(id) {
    const [user] = await db.select().from(users).where((0, import_drizzle_orm3.eq)(users.id, id)).limit(1);
    return user;
  },
  async createCustomer(data) {
    const [customer] = await db.insert(customers).values({
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName
    }).returning();
    return customer;
  },
  async getCustomerByUserId(userId) {
    const [customer] = await db.select().from(customers).where((0, import_drizzle_orm3.eq)(customers.userId, userId)).limit(1);
    return customer;
  },
  async getCustomerById(id) {
    const [customer] = await db.select().from(customers).where((0, import_drizzle_orm3.eq)(customers.id, id)).limit(1);
    return customer;
  },
  async updateCustomer(id, data) {
    const [customer] = await db.update(customers).set(data).where((0, import_drizzle_orm3.eq)(customers.id, id)).returning();
    return customer;
  },
  async toggleFavoriteRestaurant(customerId, restaurantId) {
    const customer = await storage.getCustomerByUserId(customerId);
    if (!customer) return void 0;
    const favs = customer.favoriteRestaurants || [];
    const idx = favs.indexOf(restaurantId);
    const newFavs = idx >= 0 ? favs.filter((id) => id !== restaurantId) : [...favs, restaurantId];
    const [updated] = await db.update(customers).set({ favoriteRestaurants: newFavs }).where((0, import_drizzle_orm3.eq)(customers.id, customer.id)).returning();
    return updated;
  },
  async toggleFavoriteItem(customerId, itemId) {
    const customer = await storage.getCustomerByUserId(customerId);
    if (!customer) return void 0;
    const favs = customer.favoriteItems || [];
    const idx = favs.indexOf(itemId);
    const newFavs = idx >= 0 ? favs.filter((id) => id !== itemId) : [...favs, itemId];
    const [updated] = await db.update(customers).set({ favoriteItems: newFavs }).where((0, import_drizzle_orm3.eq)(customers.id, customer.id)).returning();
    return updated;
  },
  async getAllRestaurants(filters) {
    let query = db.select().from(restaurants);
    const conditions = [];
    if (filters?.cuisine) {
      conditions.push((0, import_drizzle_orm3.ilike)(restaurants.cuisineType, `%${filters.cuisine}%`));
    }
    if (filters?.search) {
      conditions.push((0, import_drizzle_orm3.ilike)(restaurants.name, `%${filters.search}%`));
    }
    if (filters?.featured !== void 0) {
      conditions.push((0, import_drizzle_orm3.eq)(restaurants.featured, filters.featured));
    }
    if (conditions.length > 0) {
      return db.select().from(restaurants).where((0, import_drizzle_orm3.and)(...conditions));
    }
    return db.select().from(restaurants);
  },
  async getRestaurantById(id) {
    const [restaurant] = await db.select().from(restaurants).where((0, import_drizzle_orm3.eq)(restaurants.id, id)).limit(1);
    return restaurant;
  },
  async getMenuItems(restaurantId) {
    return db.select().from(menuItems).where((0, import_drizzle_orm3.eq)(menuItems.restaurantId, restaurantId));
  },
  async getMenuItem(id) {
    const [item] = await db.select().from(menuItems).where((0, import_drizzle_orm3.eq)(menuItems.id, id)).limit(1);
    return item;
  },
  async createOrder(data) {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  },
  async getOrderById(id) {
    const [order] = await db.select().from(orders).where((0, import_drizzle_orm3.eq)(orders.id, id)).limit(1);
    return order;
  },
  async getOrdersByCustomerId(customerId) {
    return db.select().from(orders).where((0, import_drizzle_orm3.eq)(orders.customerId, customerId)).orderBy((0, import_drizzle_orm3.desc)(orders.createdAt));
  },
  async getOrdersByDriverId(driverId) {
    return db.select().from(orders).where((0, import_drizzle_orm3.eq)(orders.driverId, driverId)).orderBy((0, import_drizzle_orm3.desc)(orders.createdAt));
  },
  async updateOrderStatus(id, status, extra) {
    const updateData = { status };
    if (extra) Object.assign(updateData, extra);
    const [order] = await db.update(orders).set(updateData).where((0, import_drizzle_orm3.eq)(orders.id, id)).returning();
    return order;
  },
  async assignDriver(orderId, driverId) {
    const [order] = await db.update(orders).set({ driverId, status: "confirmed" }).where((0, import_drizzle_orm3.eq)(orders.id, orderId)).returning();
    return order;
  },
  async createReview(data) {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  },
  async getReviewsByRestaurant(restaurantId) {
    return db.select().from(reviews).where((0, import_drizzle_orm3.eq)(reviews.restaurantId, restaurantId)).orderBy((0, import_drizzle_orm3.desc)(reviews.createdAt));
  },
  async getReviewsByDriver(driverId) {
    return db.select().from(reviews).where((0, import_drizzle_orm3.eq)(reviews.driverId, driverId)).orderBy((0, import_drizzle_orm3.desc)(reviews.createdAt));
  },
  async addRestaurantResponse(reviewId, response) {
    const [review] = await db.update(reviews).set({ restaurantResponse: response }).where((0, import_drizzle_orm3.eq)(reviews.id, reviewId)).returning();
    return review;
  },
  calculateTax(subtotal, rate = 0.07) {
    const taxAmount = Math.round(subtotal * rate * 100) / 100;
    return { taxAmount, taxRate: rate, taxableAmount: subtotal };
  },
  async createTaxTransaction(data) {
    const [tx] = await db.insert(taxTransactions).values(data).returning();
    return tx;
  },
  async getTaxSummary() {
    const transactions = await db.select().from(taxTransactions);
    const totalCollected = transactions.reduce((sum, t) => sum + parseFloat(t.taxCollected || "0"), 0);
    const totalTaxable = transactions.reduce((sum, t) => sum + parseFloat(t.taxableAmount || "0"), 0);
    return {
      totalCollected: totalCollected.toFixed(2),
      totalTaxable: totalTaxable.toFixed(2),
      transactionCount: transactions.length,
      transactions
    };
  },
  async getJurisdictions() {
    return db.select().from(taxJurisdictions);
  },
  async createRemittance(data) {
    const [remittance] = await db.insert(taxRemittances).values(data).returning();
    return remittance;
  },
  async createDriver(data) {
    const [driver] = await db.insert(drivers).values({
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      licenseNumber: data.licenseNumber || null,
      vehicleInfo: data.vehicleInfo || null
    }).returning();
    return driver;
  },
  async getDriverByUserId(userId) {
    const [driver] = await db.select().from(drivers).where((0, import_drizzle_orm3.eq)(drivers.userId, userId)).limit(1);
    return driver;
  },
  async getAllDrivers() {
    return db.select().from(drivers);
  },
  async updateDriverLocation(driverId, lat, lng) {
    const [driver] = await db.update(drivers).set({ currentLat: lat, currentLng: lng }).where((0, import_drizzle_orm3.eq)(drivers.id, driverId)).returning();
    return driver;
  },
  async updateDriverAvailability(driverId, isAvailable) {
    const [driver] = await db.update(drivers).set({ isAvailable }).where((0, import_drizzle_orm3.eq)(drivers.id, driverId)).returning();
    return driver;
  },
  async getAvailableDrivers() {
    return db.select().from(drivers).where((0, import_drizzle_orm3.eq)(drivers.isAvailable, true));
  },
  async getDriverEarnings(driverId) {
    return db.select().from(driverEarnings).where((0, import_drizzle_orm3.eq)(driverEarnings.driverId, driverId)).orderBy((0, import_drizzle_orm3.desc)(driverEarnings.createdAt));
  },
  async createDriverEarning(data) {
    const [earning] = await db.insert(driverEarnings).values(data).returning();
    return earning;
  },
  async getDriverStatus(driverId) {
    const [status] = await db.select().from(driverStatusTable).where((0, import_drizzle_orm3.eq)(driverStatusTable.driverId, driverId)).orderBy((0, import_drizzle_orm3.desc)(driverStatusTable.createdAt)).limit(1);
    return status;
  },
  async updateDriverStatus(driverId, data) {
    const existing = await storage.getDriverStatus(driverId);
    if (existing) {
      const [status2] = await db.update(driverStatusTable).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(driverStatusTable.id, existing.id)).returning();
      return status2;
    }
    const [status] = await db.insert(driverStatusTable).values({ driverId, ...data }).returning();
    return status;
  },
  async createDriverSupportLog(data) {
    const [log] = await db.insert(driverSupportLog).values(data).returning();
    return log;
  },
  async getDriverSupportLogs(driverId) {
    return db.select().from(driverSupportLog).where((0, import_drizzle_orm3.eq)(driverSupportLog.driverId, driverId)).orderBy((0, import_drizzle_orm3.desc)(driverSupportLog.createdAt));
  },
  async createChatMessage(data) {
    const [chat] = await db.insert(chats).values({
      orderId: data.orderId,
      senderId: data.senderId,
      message: data.message,
      type: data.type || "text"
    }).returning();
    return chat;
  },
  async getChatMessages(orderId) {
    return db.select().from(chats).where((0, import_drizzle_orm3.eq)(chats.orderId, orderId)).orderBy(chats.timestamp);
  },
  async createBundle(data) {
    const [bundle] = await db.insert(bundles).values(data).returning();
    return bundle;
  },
  async getActiveBundles() {
    return db.select().from(bundles).where((0, import_drizzle_orm3.eq)(bundles.active, true));
  },
  async createComplianceLog(data) {
    const [log] = await db.insert(complianceLogs).values(data).returning();
    return log;
  },
  async getComplianceLogs() {
    return db.select().from(complianceLogs).orderBy((0, import_drizzle_orm3.desc)(complianceLogs.createdAt));
  },
  async getDeliveryWindows() {
    return db.select().from(deliveryWindows);
  },
  async updateDeliveryWindow(id, data) {
    const [window] = await db.update(deliveryWindows).set(data).where((0, import_drizzle_orm3.eq)(deliveryWindows.id, id)).returning();
    return window;
  },
  isAlcoholDeliveryAllowed(startHour, endHour) {
    const now = /* @__PURE__ */ new Date();
    const currentHour = now.getHours();
    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    }
    return currentHour >= startHour || currentHour < endHour;
  },
  async createReferral(data) {
    const [referral] = await db.insert(referrals).values({
      referrerId: data.referrerId,
      code: data.code
    }).returning();
    return referral;
  },
  async getReferralByCode(code) {
    const [referral] = await db.select().from(referrals).where((0, import_drizzle_orm3.eq)(referrals.code, code)).limit(1);
    return referral;
  },
  async applyReferral(code, referredId) {
    const referral = await storage.getReferralByCode(code);
    if (!referral || referral.credited) return void 0;
    const [updated] = await db.update(referrals).set({ referredId, credited: true }).where((0, import_drizzle_orm3.eq)(referrals.id, referral.id)).returning();
    return updated;
  },
  async createAgreement(data) {
    const [agreement] = await db.insert(digitalAgreements).values(data).returning();
    return agreement;
  },
  async getAgreements(entityId) {
    return db.select().from(digitalAgreements).where((0, import_drizzle_orm3.eq)(digitalAgreements.entityId, entityId));
  },
  async createIdVerification(data) {
    const [verification] = await db.insert(idVerifications).values(data).returning();
    return verification;
  },
  async getIdVerifications(customerId) {
    return db.select().from(idVerifications).where((0, import_drizzle_orm3.eq)(idVerifications.customerId, customerId));
  },
  async getPendingOrders() {
    return db.select().from(orders).where((0, import_drizzle_orm3.eq)(orders.status, "pending")).orderBy((0, import_drizzle_orm3.desc)(orders.createdAt));
  },
  async getAllOrders() {
    return db.select().from(orders).orderBy((0, import_drizzle_orm3.desc)(orders.createdAt));
  },
  async createRestaurant(data) {
    const [restaurant] = await db.insert(restaurants).values(data).returning();
    return restaurant;
  },
  async updateRestaurant(id, data) {
    const [restaurant] = await db.update(restaurants).set(data).where((0, import_drizzle_orm3.eq)(restaurants.id, id)).returning();
    return restaurant;
  },
  async updateDriver(id, data) {
    const [driver] = await db.update(drivers).set(data).where((0, import_drizzle_orm3.eq)(drivers.id, id)).returning();
    return driver;
  },
  async getAllDriverStatuses() {
    return db.select().from(driverStatusTable).orderBy((0, import_drizzle_orm3.desc)(driverStatusTable.createdAt));
  },
  async createWallet(data) {
    const [wallet] = await db.insert(wallets).values({
      userId: data.userId,
      walletAddress: data.walletAddress,
      walletType: data.walletType || "coinbase",
      chainId: data.chainId || 8453
    }).returning();
    return wallet;
  },
  async getWalletsByUserId(userId) {
    return db.select().from(wallets).where((0, import_drizzle_orm3.eq)(wallets.userId, userId));
  },
  async getWalletByAddress(address) {
    const [wallet] = await db.select().from(wallets).where((0, import_drizzle_orm3.eq)(wallets.walletAddress, address)).limit(1);
    return wallet;
  },
  async createEscrowTransaction(data) {
    const [tx] = await db.insert(escrowTransactions).values(data).returning();
    return tx;
  },
  async getEscrowByOrderId(orderId) {
    const [escrow] = await db.select().from(escrowTransactions).where((0, import_drizzle_orm3.eq)(escrowTransactions.orderId, orderId)).limit(1);
    return escrow;
  },
  async updateEscrowStatus(id, status, extra) {
    const updateData = { status };
    if (extra) Object.assign(updateData, extra);
    const [escrow] = await db.update(escrowTransactions).set(updateData).where((0, import_drizzle_orm3.eq)(escrowTransactions.id, id)).returning();
    return escrow;
  },
  async getEscrowTransactions(userId) {
    const userWallets = await storage.getWalletsByUserId(userId);
    if (userWallets.length === 0) return [];
    const addresses = userWallets.map((w) => w.walletAddress);
    const results = [];
    for (const addr of addresses) {
      const depositorTxs = await db.select().from(escrowTransactions).where((0, import_drizzle_orm3.eq)(escrowTransactions.depositorAddress, addr));
      const sellerTxs = await db.select().from(escrowTransactions).where((0, import_drizzle_orm3.eq)(escrowTransactions.sellerAddress, addr));
      results.push(...depositorTxs, ...sellerTxs);
    }
    const unique = Array.from(new Map(results.map((r) => [r.id, r])).values());
    return unique.sort((a, b) => new Date(b.depositedAt).getTime() - new Date(a.depositedAt).getTime());
  },
  async createNftReward(data) {
    const [nft] = await db.insert(nftRewards).values(data).returning();
    return nft;
  },
  async getNftsByUserId(userId) {
    return db.select().from(nftRewards).where((0, import_drizzle_orm3.eq)(nftRewards.userId, userId)).orderBy((0, import_drizzle_orm3.desc)(nftRewards.createdAt));
  },
  async updateNftStatus(id, status, extra) {
    const updateData = { status };
    if (extra) Object.assign(updateData, extra);
    const [nft] = await db.update(nftRewards).set(updateData).where((0, import_drizzle_orm3.eq)(nftRewards.id, id)).returning();
    return nft;
  },
  async createNftListing(data) {
    const [listing] = await db.insert(nftListings).values(data).returning();
    return listing;
  },
  async getActiveNftListings() {
    return db.select().from(nftListings).where((0, import_drizzle_orm3.eq)(nftListings.status, "active")).orderBy((0, import_drizzle_orm3.desc)(nftListings.listedAt));
  },
  async getNftListingById(id) {
    const [listing] = await db.select().from(nftListings).where((0, import_drizzle_orm3.eq)(nftListings.id, id)).limit(1);
    return listing;
  },
  async updateNftListing(id, data) {
    const [listing] = await db.update(nftListings).set(data).where((0, import_drizzle_orm3.eq)(nftListings.id, id)).returning();
    return listing;
  },
  async checkAndMintMilestoneNFT(userId, type) {
    const customerMilestones = [
      { count: 10, name: "Foodie Explorer", description: "Completed 10 orders on CryptoEats" },
      { count: 25, name: "Crypto Connoisseur", description: "Completed 25 orders on CryptoEats" },
      { count: 50, name: "Diamond Diner", description: "Completed 50 orders on CryptoEats" },
      { count: 100, name: "CryptoEats Legend", description: "Completed 100 orders on CryptoEats" }
    ];
    const driverMilestones = [
      { count: 10, name: "Rising Star", description: "Completed 10 deliveries on CryptoEats" },
      { count: 50, name: "Road Warrior", description: "Completed 50 deliveries on CryptoEats" },
      { count: 100, name: "Delivery Hero", description: "Completed 100 deliveries on CryptoEats" },
      { count: 500, name: "Legendary Driver", description: "Completed 500 deliveries on CryptoEats" }
    ];
    try {
      let currentCount = 0;
      const milestones = type === "customer" ? customerMilestones : driverMilestones;
      if (type === "customer") {
        const customer = await storage.getCustomerByUserId(userId);
        if (!customer) return null;
        const customerOrders = await storage.getOrdersByCustomerId(customer.id);
        currentCount = customerOrders.filter((o) => o.status === "delivered").length;
      } else {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) return null;
        currentCount = driver.totalDeliveries || 0;
      }
      const existingNfts = await storage.getNftsByUserId(userId);
      const existingMilestoneNames = existingNfts.map((n) => n.name);
      for (const milestone of milestones) {
        if (currentCount >= milestone.count && !existingMilestoneNames.includes(milestone.name)) {
          const nft = await storage.createNftReward({
            userId,
            name: milestone.name,
            description: milestone.description,
            milestoneType: type,
            milestoneValue: milestone.count,
            status: "pending"
          });
          return nft;
        }
      }
      return null;
    } catch (error) {
      console.error("Error checking milestone NFT:", error.message);
      return null;
    }
  },
  // =================== ONRAMP TRANSACTIONS ===================
  async createOnrampTransaction(data) {
    const [tx] = await db.insert(onrampTransactions).values(data).returning();
    return tx;
  },
  async getOnrampTransactionsByUser(userId) {
    return db.select().from(onrampTransactions).where((0, import_drizzle_orm3.eq)(onrampTransactions.userId, userId)).orderBy((0, import_drizzle_orm3.desc)(onrampTransactions.createdAt));
  },
  async updateOnrampTransaction(id, data) {
    const [tx] = await db.update(onrampTransactions).set(data).where((0, import_drizzle_orm3.eq)(onrampTransactions.id, id)).returning();
    return tx;
  },
  async getOnrampTransactionById(id) {
    const [tx] = await db.select().from(onrampTransactions).where((0, import_drizzle_orm3.eq)(onrampTransactions.id, id)).limit(1);
    return tx;
  },
  // =================== OFFRAMP TRANSACTIONS ===================
  async createOfframpTransaction(data) {
    const [tx] = await db.insert(offrampTransactions).values(data).returning();
    return tx;
  },
  async getOfframpTransactionsByUser(userId) {
    return db.select().from(offrampTransactions).where((0, import_drizzle_orm3.eq)(offrampTransactions.userId, userId)).orderBy((0, import_drizzle_orm3.desc)(offrampTransactions.createdAt));
  },
  async updateOfframpTransaction(id, data) {
    const [tx] = await db.update(offrampTransactions).set(data).where((0, import_drizzle_orm3.eq)(offrampTransactions.id, id)).returning();
    return tx;
  },
  async getOfframpTransactionById(id) {
    const [tx] = await db.select().from(offrampTransactions).where((0, import_drizzle_orm3.eq)(offrampTransactions.id, id)).limit(1);
    return tx;
  },
  // =================== PUSH TOKENS ===================
  async savePushToken(userId, token, platform) {
    const existing = await db.select().from(pushTokens).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(pushTokens.userId, userId), (0, import_drizzle_orm3.eq)(pushTokens.token, token))).limit(1);
    if (existing.length > 0) {
      const [updated] = await db.update(pushTokens).set({ active: true, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(pushTokens.id, existing[0].id)).returning();
      return updated;
    }
    const [pt] = await db.insert(pushTokens).values({ userId, token, platform: platform || "expo" }).returning();
    return pt;
  },
  async getPushTokensByUserId(userId) {
    return db.select().from(pushTokens).where((0, import_drizzle_orm3.and)((0, import_drizzle_orm3.eq)(pushTokens.userId, userId), (0, import_drizzle_orm3.eq)(pushTokens.active, true)));
  },
  async deactivatePushToken(token) {
    await db.update(pushTokens).set({ active: false }).where((0, import_drizzle_orm3.eq)(pushTokens.token, token));
  },
  async createOnboardingApplication(data) {
    const [app2] = await db.insert(onboardingApplications).values({
      userId: data.userId,
      role: data.role,
      status: "not_started",
      step: 1
    }).returning();
    return app2;
  },
  async getOnboardingByUserId(userId) {
    const [app2] = await db.select().from(onboardingApplications).where((0, import_drizzle_orm3.eq)(onboardingApplications.userId, userId)).limit(1);
    return app2;
  },
  async getOnboardingById(id) {
    const [app2] = await db.select().from(onboardingApplications).where((0, import_drizzle_orm3.eq)(onboardingApplications.id, id)).limit(1);
    return app2;
  },
  async updateOnboarding(id, data) {
    const [app2] = await db.update(onboardingApplications).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm3.eq)(onboardingApplications.id, id)).returning();
    return app2;
  },
  async getPendingOnboardings() {
    return db.select().from(onboardingApplications).where((0, import_drizzle_orm3.eq)(onboardingApplications.status, "pending_review")).orderBy((0, import_drizzle_orm3.desc)(onboardingApplications.createdAt));
  },
  async getAllOnboardings() {
    return db.select().from(onboardingApplications).orderBy((0, import_drizzle_orm3.desc)(onboardingApplications.createdAt));
  },
  async createLegalAgreement(data) {
    const [agreement] = await db.insert(legalAgreements).values(data).returning();
    return agreement;
  },
  async getLegalAgreementsByUser(userId) {
    return db.select().from(legalAgreements).where((0, import_drizzle_orm3.eq)(legalAgreements.userId, userId)).orderBy((0, import_drizzle_orm3.desc)(legalAgreements.acceptedAt));
  },
  async hasAcceptedAgreement(userId, agreementType, version) {
    const conditions = [
      (0, import_drizzle_orm3.eq)(legalAgreements.userId, userId),
      (0, import_drizzle_orm3.eq)(legalAgreements.agreementType, agreementType)
    ];
    if (version) conditions.push((0, import_drizzle_orm3.eq)(legalAgreements.version, version));
    const results = await db.select().from(legalAgreements).where((0, import_drizzle_orm3.and)(...conditions)).limit(1);
    return results.length > 0;
  },
  async getAllLegalAgreements() {
    return db.select().from(legalAgreements).orderBy((0, import_drizzle_orm3.desc)(legalAgreements.acceptedAt));
  },
  async createLicenseVerification(data) {
    const [verification] = await db.insert(licenseVerifications).values(data).returning();
    return verification;
  },
  async getLicenseVerificationsByRestaurant(restaurantId) {
    return db.select().from(licenseVerifications).where((0, import_drizzle_orm3.eq)(licenseVerifications.restaurantId, restaurantId)).orderBy((0, import_drizzle_orm3.desc)(licenseVerifications.createdAt));
  },
  async getAllLicenseVerifications() {
    return db.select().from(licenseVerifications).orderBy((0, import_drizzle_orm3.desc)(licenseVerifications.createdAt));
  }
};

// server/seed.ts
async function seedDatabase() {
  try {
    const existingRestaurants = await db.select().from(restaurants).limit(1);
    if (existingRestaurants.length > 0) return;
  } catch (err) {
    if (err?.code === "42P01") {
      console.warn("[Seed] Tables not created yet. Run database migrations first (npx drizzle-kit push).");
      console.warn("[Seed] Skipping seed \u2014 tables will be created on next deployment.");
      return;
    }
    throw err;
  }
  console.log("Seeding database...");
  const [r1] = await db.insert(restaurants).values({
    name: "La Carreta Cuban Cuisine",
    cuisineType: "Cuban",
    address: "3632 SW 8th St, Miami, FL 33135",
    phone: "(305) 444-7501",
    rating: 4.6,
    reviewCount: 342,
    deliveryFee: "3.99",
    minOrder: "15",
    estimatedPrepTime: "25-35 min",
    alcoholLicense: true,
    imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400",
    featured: true,
    distance: "1.2 mi",
    isApproved: true,
    operatingHours: { open: "10:00", close: "23:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  const [r2] = await db.insert(restaurants).values({
    name: "Joe's Stone Crab",
    cuisineType: "Seafood",
    address: "11 Washington Ave, Miami Beach, FL 33139",
    phone: "(305) 673-0365",
    rating: 4.8,
    reviewCount: 1205,
    deliveryFee: "4.99",
    minOrder: "25",
    estimatedPrepTime: "30-45 min",
    alcoholLicense: true,
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400",
    featured: true,
    distance: "3.5 mi",
    isApproved: true,
    operatingHours: { open: "11:00", close: "22:00", days: ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  const [r3] = await db.insert(restaurants).values({
    name: "Matsuri Sushi Bar",
    cuisineType: "Sushi",
    address: "5759 Bird Rd, Miami, FL 33155",
    phone: "(305) 663-1615",
    rating: 4.7,
    reviewCount: 567,
    deliveryFee: "3.49",
    minOrder: "20",
    estimatedPrepTime: "20-30 min",
    alcoholLicense: true,
    imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400",
    featured: false,
    distance: "2.1 mi",
    isApproved: true,
    operatingHours: { open: "11:30", close: "22:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  const [r4] = await db.insert(restaurants).values({
    name: "Fratelli Milano",
    cuisineType: "Italian",
    address: "213 SE 1st St, Miami, FL 33131",
    phone: "(305) 373-2300",
    rating: 4.5,
    reviewCount: 289,
    deliveryFee: "2.99",
    minOrder: "15",
    estimatedPrepTime: "25-40 min",
    alcoholLicense: true,
    imageUrl: "https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=400",
    featured: true,
    distance: "1.8 mi",
    isApproved: true,
    operatingHours: { open: "11:00", close: "23:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  const [r5] = await db.insert(restaurants).values({
    name: "Taqueria El Mexicano",
    cuisineType: "Mexican",
    address: "521 SW 8th St, Miami, FL 33130",
    phone: "(305) 858-1160",
    rating: 4.4,
    reviewCount: 198,
    deliveryFee: "2.49",
    minOrder: "10",
    estimatedPrepTime: "15-25 min",
    alcoholLicense: true,
    imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
    featured: false,
    distance: "0.8 mi",
    isApproved: true,
    operatingHours: { open: "10:00", close: "22:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  const [r6] = await db.insert(restaurants).values({
    name: "Bangkok Bangkok",
    cuisineType: "Thai",
    address: "157 Giralda Ave, Coral Gables, FL 33134",
    phone: "(305) 444-2397",
    rating: 4.3,
    reviewCount: 176,
    deliveryFee: "3.49",
    minOrder: "12",
    estimatedPrepTime: "20-35 min",
    alcoholLicense: true,
    imageUrl: "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400",
    featured: false,
    distance: "2.5 mi",
    isApproved: true,
    operatingHours: { open: "11:00", close: "22:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  const [r7] = await db.insert(restaurants).values({
    name: "Pita Loca Mediterranean",
    cuisineType: "Mediterranean",
    address: "3500 Main Hwy, Miami, FL 33133",
    phone: "(305) 441-4141",
    rating: 4.6,
    reviewCount: 234,
    deliveryFee: "2.99",
    minOrder: "12",
    estimatedPrepTime: "20-30 min",
    alcoholLicense: false,
    imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=400",
    featured: true,
    distance: "1.5 mi",
    isApproved: true,
    operatingHours: { open: "10:30", close: "21:30", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  const [r8] = await db.insert(restaurants).values({
    name: "Smokin' Joe's BBQ",
    cuisineType: "BBQ",
    address: "1951 NW 7th Ave, Miami, FL 33136",
    phone: "(305) 573-5800",
    rating: 4.5,
    reviewCount: 312,
    deliveryFee: "3.99",
    minOrder: "15",
    estimatedPrepTime: "30-45 min",
    alcoholLicense: true,
    imageUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400",
    featured: false,
    distance: "2.0 mi",
    isApproved: true,
    operatingHours: { open: "11:00", close: "22:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] }
  }).returning();
  await db.insert(menuItems).values([
    { restaurantId: r1.id, name: "Ropa Vieja", description: "Shredded beef in tomato-based sauce with peppers and onions", price: "18.99", category: "Entrees", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300" },
    { restaurantId: r1.id, name: "Cuban Sandwich", description: "Ham, roasted pork, Swiss cheese, pickles, mustard on Cuban bread", price: "12.99", category: "Sandwiches", imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300" },
    { restaurantId: r1.id, name: "Lechon Asado", description: "Slow-roasted pork with mojo sauce, black beans and rice", price: "16.99", category: "Entrees", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300" },
    { restaurantId: r1.id, name: "Tres Leches Cake", description: "Classic three-milk cake with whipped cream", price: "8.99", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300" },
    { restaurantId: r1.id, name: "Mojito", description: "Classic Cuban cocktail with rum, mint, lime, sugar and soda", price: "11.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300" },
    { restaurantId: r1.id, name: "Caf\xE9 Cubano", description: "Strong espresso sweetened with sugar", price: "3.99", category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=300" },
    { restaurantId: r1.id, name: "Empanadas de Carne", description: "Beef-filled pastries with chimichurri", price: "9.99", category: "Appetizers", imageUrl: "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300" },
    { restaurantId: r2.id, name: "Stone Crab Claws", description: "Fresh Florida stone crab claws with mustard sauce", price: "49.99", category: "Entrees", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=300" },
    { restaurantId: r2.id, name: "Lobster Mac & Cheese", description: "Maine lobster with truffle mac and cheese", price: "32.99", category: "Entrees", imageUrl: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=300" },
    { restaurantId: r2.id, name: "Key Lime Pie", description: "Classic Florida Key lime pie with graham cracker crust", price: "12.99", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1519915028121-7d3463d20b13?w=300" },
    { restaurantId: r2.id, name: "Oysters Rockefeller", description: "Half dozen baked oysters with herb butter", price: "24.99", category: "Appetizers", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1606756790138-261d2b21cd75?w=300" },
    { restaurantId: r2.id, name: "Chardonnay", description: "House Chardonnay, Sonoma Valley", price: "14.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300" },
    { restaurantId: r2.id, name: "Grilled Mahi-Mahi", description: "Fresh mahi-mahi with tropical salsa and rice", price: "28.99", category: "Entrees", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300" },
    { restaurantId: r3.id, name: "Dragon Roll", description: "Eel, cucumber, avocado topped with eel sauce", price: "16.99", category: "Rolls", imageUrl: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300" },
    { restaurantId: r3.id, name: "Sashimi Platter", description: "Chef's selection of 15 pieces of fresh sashimi", price: "34.99", category: "Sashimi", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1534256958597-7fe685cbd745?w=300" },
    { restaurantId: r3.id, name: "Spicy Tuna Roll", description: "Fresh tuna with spicy mayo and tempura flakes", price: "14.99", category: "Rolls", imageUrl: "https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300" },
    { restaurantId: r3.id, name: "Miso Soup", description: "Traditional miso with tofu, seaweed and scallions", price: "4.99", category: "Appetizers", dietaryTags: ["vegetarian"], imageUrl: "https://images.unsplash.com/photo-1607301405390-d831c242f59b?w=300" },
    { restaurantId: r3.id, name: "Sake Carafe", description: "Premium Junmai sake, served warm or cold", price: "18.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=300" },
    { restaurantId: r3.id, name: "Edamame", description: "Steamed soybeans with sea salt", price: "5.99", category: "Appetizers", dietaryTags: ["vegan", "gluten-free"], imageUrl: "https://images.unsplash.com/photo-1564093497595-593b96d80180?w=300" },
    { restaurantId: r4.id, name: "Margherita Pizza", description: "San Marzano tomatoes, fresh mozzarella, basil", price: "16.99", category: "Pizza", dietaryTags: ["vegetarian"], imageUrl: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300" },
    { restaurantId: r4.id, name: "Penne Alla Vodka", description: "Penne with vodka cream sauce and pancetta", price: "18.99", category: "Pasta", imageUrl: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=300" },
    { restaurantId: r4.id, name: "Tiramisu", description: "Classic Italian coffee-flavored dessert", price: "10.99", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300" },
    { restaurantId: r4.id, name: "Bruschetta", description: "Toasted bread with fresh tomatoes, garlic and basil", price: "9.99", category: "Appetizers", dietaryTags: ["vegetarian"], imageUrl: "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=300" },
    { restaurantId: r4.id, name: "Chianti Classico", description: "Tuscan red wine, full-bodied", price: "13.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300" },
    { restaurantId: r4.id, name: "Risotto ai Funghi", description: "Creamy risotto with wild mushrooms and truffle oil", price: "22.99", category: "Pasta", dietaryTags: ["vegetarian", "gluten-free"], imageUrl: "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=300" },
    { restaurantId: r5.id, name: "Tacos al Pastor", description: "Marinated pork with pineapple, cilantro and onion", price: "11.99", category: "Tacos", imageUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=300" },
    { restaurantId: r5.id, name: "Burrito Supreme", description: "Large flour tortilla with steak, beans, rice, cheese and guac", price: "14.99", category: "Burritos", imageUrl: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300" },
    { restaurantId: r5.id, name: "Guacamole & Chips", description: "Fresh-made guacamole with tortilla chips", price: "8.99", category: "Appetizers", dietaryTags: ["vegan", "gluten-free"], imageUrl: "https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=300" },
    { restaurantId: r5.id, name: "Churros", description: "Fried dough pastry with chocolate dipping sauce", price: "6.99", category: "Desserts", dietaryTags: ["vegetarian"], imageUrl: "https://images.unsplash.com/photo-1624371414361-e670246ae8fb?w=300" },
    { restaurantId: r5.id, name: "Margarita", description: "Classic lime margarita with premium tequila", price: "12.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1556855810-ac404aa91e85?w=300" },
    { restaurantId: r5.id, name: "Quesadilla de Pollo", description: "Grilled chicken quesadilla with peppers and cheese", price: "10.99", category: "Entrees", imageUrl: "https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=300" },
    { restaurantId: r6.id, name: "Pad Thai", description: "Rice noodles with shrimp, peanuts, bean sprouts and lime", price: "15.99", category: "Noodles", imageUrl: "https://images.unsplash.com/photo-1559314809-0d155014e29e?w=300" },
    { restaurantId: r6.id, name: "Green Curry", description: "Spicy green curry with chicken, bamboo shoots and Thai basil", price: "16.99", category: "Curries", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300" },
    { restaurantId: r6.id, name: "Tom Yum Soup", description: "Hot and sour soup with shrimp and mushrooms", price: "8.99", category: "Soups", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=300" },
    { restaurantId: r6.id, name: "Mango Sticky Rice", description: "Sweet sticky rice with fresh mango and coconut cream", price: "9.99", category: "Desserts", dietaryTags: ["vegan", "gluten-free"], imageUrl: "https://images.unsplash.com/photo-1621293954908-907159247fc8?w=300" },
    { restaurantId: r6.id, name: "Thai Iced Tea", description: "Sweet Thai tea with condensed milk", price: "4.99", category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300" },
    { restaurantId: r6.id, name: "Singha Beer", description: "Premium Thai lager beer", price: "6.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300" },
    { restaurantId: r7.id, name: "Lamb Shawarma Plate", description: "Slow-roasted lamb with hummus, tabbouleh and pita", price: "17.99", category: "Entrees", imageUrl: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300" },
    { restaurantId: r7.id, name: "Falafel Wrap", description: "Crispy falafel with tahini, pickles and fresh veggies", price: "11.99", category: "Wraps", dietaryTags: ["vegan"], imageUrl: "https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=300" },
    { restaurantId: r7.id, name: "Hummus Trio", description: "Classic, roasted red pepper and garlic hummus with pita", price: "10.99", category: "Appetizers", dietaryTags: ["vegan"], imageUrl: "https://images.unsplash.com/photo-1577805947697-89e18249d767?w=300" },
    { restaurantId: r7.id, name: "Greek Salad", description: "Fresh tomatoes, cucumbers, olives, feta cheese", price: "12.99", category: "Salads", dietaryTags: ["vegetarian", "gluten-free"], imageUrl: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300" },
    { restaurantId: r7.id, name: "Baklava", description: "Layered phyllo pastry with nuts and honey syrup", price: "7.99", category: "Desserts", dietaryTags: ["vegetarian"], imageUrl: "https://images.unsplash.com/photo-1598110750624-207050c4f28c?w=300" },
    { restaurantId: r7.id, name: "Mint Lemonade", description: "Fresh-squeezed lemonade with mint", price: "4.99", category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=300" },
    { restaurantId: r8.id, name: "Brisket Platter", description: "Slow-smoked beef brisket with two sides", price: "22.99", category: "Platters", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300" },
    { restaurantId: r8.id, name: "Pulled Pork Sandwich", description: "Smoked pulled pork with tangy coleslaw", price: "14.99", category: "Sandwiches", imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=300" },
    { restaurantId: r8.id, name: "Baby Back Ribs", description: "Fall-off-the-bone ribs with signature BBQ sauce", price: "26.99", category: "Platters", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=300" },
    { restaurantId: r8.id, name: "Mac & Cheese", description: "Creamy smoked gouda mac and cheese", price: "7.99", category: "Sides", dietaryTags: ["vegetarian"], imageUrl: "https://images.unsplash.com/photo-1543339494-b4cd4f7ba686?w=300" },
    { restaurantId: r8.id, name: "Craft IPA", description: "Local Miami craft IPA beer", price: "7.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300" },
    { restaurantId: r8.id, name: "Cornbread", description: "Sweet honey butter cornbread", price: "4.99", category: "Sides", dietaryTags: ["vegetarian"], imageUrl: "https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=300" },
    { restaurantId: r8.id, name: "Smoked Wings", description: "Hickory-smoked chicken wings with ranch", price: "13.99", category: "Appetizers", imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300" }
  ]);
  await db.insert(taxJurisdictions).values([
    {
      zipCode: "33101",
      city: "Miami",
      county: "Miami-Dade",
      state: "FL",
      stateRate: "0.0600",
      localRate: "0.0100",
      totalRate: "0.0700"
    },
    {
      zipCode: "33139",
      city: "Miami Beach",
      county: "Miami-Dade",
      state: "FL",
      stateRate: "0.0600",
      localRate: "0.0100",
      totalRate: "0.0700"
    },
    {
      zipCode: "33134",
      city: "Coral Gables",
      county: "Miami-Dade",
      state: "FL",
      stateRate: "0.0600",
      localRate: "0.0100",
      totalRate: "0.0700"
    }
  ]);
  await db.insert(deliveryWindows).values([
    {
      region: "Miami-Dade",
      alcoholStartHour: 8,
      alcoholEndHour: 22,
      isActive: true
    },
    {
      region: "Miami Beach",
      alcoholStartHour: 10,
      alcoholEndHour: 2,
      isActive: true
    },
    {
      region: "Coral Gables",
      alcoholStartHour: 9,
      alcoholEndHour: 21,
      isActive: true
    }
  ]);
  await db.insert(bundles).values([
    {
      name: "Date Night Bundle",
      items: ["Wine", "Pasta", "Dessert"],
      discountPercentage: 15,
      active: true,
      conditions: { minItems: 3, validDays: ["Fri", "Sat"] }
    },
    {
      name: "Game Day Pack",
      items: ["Wings", "Beer", "Nachos"],
      discountPercentage: 10,
      active: true,
      conditions: { minItems: 3, validDays: ["Sun"] }
    },
    {
      name: "Lunch Special",
      items: ["Sandwich", "Drink", "Side"],
      discountPercentage: 20,
      active: true,
      conditions: { minItems: 2, validHours: { start: 11, end: 14 } }
    },
    {
      name: "Happy Hour Deal",
      items: ["Cocktail", "Appetizer"],
      discountPercentage: 25,
      active: true,
      conditions: { minItems: 2, validHours: { start: 16, end: 19 } }
    }
  ]);
  console.log("Database seeded successfully!");
}

// server/blockchain.ts
var import_ethers = require("ethers");
var BASE_MAINNET_CHAIN_ID = 8453;
var BASE_SEPOLIA_CHAIN_ID = 84532;
var NETWORK = process.env.BASE_NETWORK === "sepolia" ? "sepolia" : "mainnet";
var BASE_CHAIN_ID = NETWORK === "sepolia" ? BASE_SEPOLIA_CHAIN_ID : BASE_MAINNET_CHAIN_ID;
var BASE_RPC_URL = NETWORK === "sepolia" ? "https://sepolia.base.org" : "https://mainnet.base.org";
var MARKETPLACE_NFT_ADDRESS = "0x21Fb1fFaefA40c042276BB4Bcf8B826A647aE91E";
var MARKETPLACE_ESCROW_ADDRESS = "0x7e1868430e86304Aac93a8964c4a1D5C12A76ED5";
var USDC_ADDRESS = NETWORK === "sepolia" ? "0x036CbD53842c5426634e7929541eC2318f3dCF7e" : "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
var BASE_PAYMASTER_ADDRESS = "0x2FAEB0760D4230Ef2aC21496Bb4F0b47D634FD4c";
var CONTRACT_ALLOWLIST = {
  [MARKETPLACE_ESCROW_ADDRESS.toLowerCase()]: {
    name: "CryptoEats Escrow",
    type: "escrow",
    sponsoredGas: true
  },
  [MARKETPLACE_NFT_ADDRESS.toLowerCase()]: {
    name: "CryptoEats NFT Rewards",
    type: "nft",
    sponsoredGas: true
  },
  [USDC_ADDRESS.toLowerCase()]: {
    name: "USDC on Base",
    type: "token",
    sponsoredGas: true
  }
};
function classifyPaymasterError(error) {
  const msg = (error?.message || error?.reason || "").toLowerCase();
  const code = error?.code || error?.status;
  if (code === -32e3 || msg.includes("internal error") || msg.includes("internal_error")) {
    return {
      code: -32e3 /* INTERNAL_ERROR */,
      message: error.message || "Internal Paymaster service error",
      userMessage: "The gas sponsorship service is temporarily unavailable. Your transaction will be retried automatically.",
      retryable: true,
      suggestion: "This is usually a temporary issue with Coinbase's Paymaster service. Wait a moment and try again."
    };
  }
  if (msg.includes("rejected by policy") || msg.includes("policy") || msg.includes("spend limit") || msg.includes("attestation")) {
    return {
      code: -32001 /* POLICY_REJECTED */,
      message: error.message || "Transaction rejected by Paymaster policy",
      userMessage: "This transaction couldn't be sponsored. The contract or amount may not be eligible for gasless transactions.",
      retryable: false,
      suggestion: "Check that the contract is allowlisted in CDP Portal and spend limits haven't been exceeded."
    };
  }
  if (msg.includes("estimate gas") || msg.includes("gas estimation") || msg.includes("revert") || msg.includes("execution reverted")) {
    return {
      code: -32002 /* GAS_ESTIMATION_FAILED */,
      message: error.message || "Unable to estimate gas for transaction",
      userMessage: "This transaction can't be processed right now. The contract call may have invalid parameters.",
      retryable: false,
      suggestion: "Verify the contract call data is correctly encoded. Check ABI encoding and parameter types."
    };
  }
  if (code === 402 || msg.includes("payment required") || msg.includes("payment-signature")) {
    return {
      code: 402 /* PAYMENT_REQUIRED */,
      message: error.message || "Payment required by Paymaster",
      userMessage: "A payment verification is needed to complete this transaction. Please check your USDC balance.",
      retryable: false,
      suggestion: "Verify the PAYMENT-SIGNATURE header and USDC balance for required payment."
    };
  }
  if (code === 401 || msg.includes("unauthorized") || msg.includes("invalid api key")) {
    return {
      code: 401 /* UNAUTHORIZED */,
      message: error.message || "Unauthorized access to Paymaster",
      userMessage: "There's a configuration issue with the gas sponsorship service. Please try again later.",
      retryable: false,
      suggestion: "Verify the CDP API key in the Paymaster URL is valid and has the correct permissions."
    };
  }
  if (code === 429 || msg.includes("rate limit") || msg.includes("too many requests")) {
    return {
      code: 429 /* RATE_LIMITED */,
      message: error.message || "Rate limited by Paymaster",
      userMessage: "Too many transactions in a short period. Please wait a moment before trying again.",
      retryable: true,
      suggestion: "Implement exponential backoff. Consider batching operations to reduce request volume."
    };
  }
  if (msg.includes("loads indefinitely") || msg.includes("cancels") || msg.includes("custom rpc")) {
    return {
      code: -32003 /* SIMULATION_FAILED */,
      message: error.message || "Gasless transaction failed with custom RPC",
      userMessage: "The gasless transaction couldn't complete. Falling back to standard transaction.",
      retryable: true,
      suggestion: "Ensure useCdpPaymaster: true is set. Try switching to official Base Paymaster sponsor."
    };
  }
  return {
    code: -1 /* UNKNOWN */,
    message: error.message || "Unknown blockchain error",
    userMessage: "Something went wrong with the transaction. Please try again.",
    retryable: true,
    suggestion: "Check CDP Portal logs for more details."
  };
}
async function withRetry(fn, options2 = {}) {
  const { maxRetries = 3, baseDelayMs = 1e3, maxDelayMs = 1e4, onRetry } = options2;
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const classified = classifyPaymasterError(error);
      if (!classified.retryable || attempt === maxRetries) {
        throw Object.assign(error, { paymasterError: classified });
      }
      const jitter = Math.random() * 500;
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt) + jitter, maxDelayMs);
      if (onRetry) {
        onRetry(attempt + 1, classified);
      } else {
        console.warn(`[Blockchain] Retry ${attempt + 1}/${maxRetries} after ${Math.round(delay)}ms: ${classified.message}`);
      }
      await new Promise((resolve4) => setTimeout(resolve4, delay));
    }
  }
  throw lastError;
}
function validateChainId(chainId) {
  if (chainId === BASE_MAINNET_CHAIN_ID) {
    return { valid: true, network: "Base Mainnet" };
  }
  if (chainId === BASE_SEPOLIA_CHAIN_ID) {
    return { valid: true, network: "Base Sepolia" };
  }
  return {
    valid: false,
    network: "Unknown",
    error: `Invalid chain ID: ${chainId}. Expected ${BASE_MAINNET_CHAIN_ID} (Base Mainnet) or ${BASE_SEPOLIA_CHAIN_ID} (Base Sepolia).`
  };
}
function isContractAllowlisted(address) {
  return address.toLowerCase() in CONTRACT_ALLOWLIST;
}
function getContractInfo(address) {
  return CONTRACT_ALLOWLIST[address.toLowerCase()] || null;
}
function getAllowlistedContracts() {
  return Object.entries(CONTRACT_ALLOWLIST).map(([address, info]) => ({
    address,
    ...info
  }));
}
function isGasSponsored(contractAddress) {
  const info = getContractInfo(contractAddress);
  return info?.sponsoredGas === true;
}
var MARKETPLACE_NFT_ABI = [
  "function mintAndTransfer(bytes32 orderId, address creator, address to, string tokenURI, uint256 royaltyBps_) external returns (uint256)",
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)",
  "function updateEscrow(address newEscrow) external",
  "function creatorOf(uint256 tokenId) external view returns (address)",
  "function royaltyBps(uint256 tokenId) external view returns (uint256)",
  "function escrowContract() external view returns (address)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Minted(uint256 indexed tokenId, address indexed creator, bytes32 indexed orderId)",
  "event EscrowUpdated(address indexed newEscrow)",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
];
var MARKETPLACE_ESCROW_ABI = [
  "function deposit(bytes32 orderId, address seller, uint256 amount, uint256 timeout, bool isNFT) external",
  "function release(bytes32 orderId) external",
  "function dispute(bytes32 orderId) external",
  "function adminRefund(bytes32 orderId) external",
  "function updateFee(uint256 newBps) external",
  "function updateFeeRecipient(address newRecipient) external",
  "function escrows(bytes32 orderId) external view returns (address buyer, address seller, uint256 amount, uint256 timeout, uint8 status)",
  "function paymentToken() external view returns (address)",
  "function nftContract() external view returns (address)",
  "function platformFeeBps() external view returns (uint256)",
  "function feeRecipient() external view returns (address)",
  "event Deposited(bytes32 indexed orderId, address indexed buyer, uint256 amount)",
  "event Released(bytes32 indexed orderId, address indexed seller, uint256 payout, uint256 fee)",
  "event Disputed(bytes32 indexed orderId)",
  "event Refunded(bytes32 indexed orderId, address indexed buyer, uint256 amount)"
];
var USDC_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)"
];
var providerInstance = null;
function getProvider() {
  if (!providerInstance) {
    providerInstance = new import_ethers.JsonRpcProvider(BASE_RPC_URL, {
      chainId: BASE_CHAIN_ID,
      name: NETWORK === "sepolia" ? "base-sepolia" : "base"
    });
  }
  return providerInstance;
}
function getNFTContract() {
  return new import_ethers.Contract(MARKETPLACE_NFT_ADDRESS, MARKETPLACE_NFT_ABI, getProvider());
}
function getEscrowContract() {
  return new import_ethers.Contract(MARKETPLACE_ESCROW_ADDRESS, MARKETPLACE_ESCROW_ABI, getProvider());
}
function getUSDCContract() {
  return new import_ethers.Contract(USDC_ADDRESS, USDC_ABI, getProvider());
}
async function getUSDCBalance(address) {
  return withRetry(async () => {
    const contract = getUSDCContract();
    const balance = await contract.balanceOf(address);
    return (0, import_ethers.formatUnits)(balance, 6);
  }, {
    maxRetries: 2,
    onRetry: (attempt, err) => console.warn(`[USDC Balance] Retry ${attempt}: ${err.message}`)
  }).catch((error) => {
    console.error("Error getting USDC balance:", error.message);
    return "0";
  });
}
async function getBaseBalance(address) {
  return withRetry(async () => {
    const provider = getProvider();
    const balance = await provider.getBalance(address);
    return (0, import_ethers.formatUnits)(balance, 18);
  }, {
    maxRetries: 2,
    onRetry: (attempt, err) => console.warn(`[ETH Balance] Retry ${attempt}: ${err.message}`)
  }).catch((error) => {
    console.error("Error getting ETH balance:", error.message);
    return "0";
  });
}
var ESCROW_STATUS_MAP = {
  0: "none",
  1: "deposited",
  2: "disputed",
  3: "released",
  4: "refunded"
};
async function getEscrowDetails(orderId) {
  return withRetry(async () => {
    const contract = getEscrowContract();
    const orderIdBytes = import_ethers.ethers.id(orderId);
    const escrow = await contract.escrows(orderIdBytes);
    if (!escrow || escrow.buyer === import_ethers.ethers.ZeroAddress) return null;
    return {
      orderId,
      orderIdBytes,
      buyer: escrow.buyer,
      seller: escrow.seller,
      amount: (0, import_ethers.formatUnits)(escrow.amount, 6),
      timeout: Number(escrow.timeout),
      status: ESCROW_STATUS_MAP[Number(escrow.status)] || "unknown"
    };
  }, {
    maxRetries: 2,
    onRetry: (attempt, err) => console.warn(`[Escrow] Retry ${attempt}: ${err.message}`)
  }).catch((error) => {
    console.error("Error getting escrow details:", error.message);
    return null;
  });
}
function prepareEscrowDeposit(orderId, seller, amount, timeout = 86400) {
  try {
    if (!isContractAllowlisted(MARKETPLACE_ESCROW_ADDRESS)) {
      throw new Error("Escrow contract is not in the allowlist");
    }
    const contract = getEscrowContract();
    const orderIdBytes = import_ethers.ethers.id(orderId);
    const amountInUnits = (0, import_ethers.parseUnits)(amount, 6);
    const data = contract.interface.encodeFunctionData("deposit", [
      orderIdBytes,
      seller,
      amountInUnits,
      timeout,
      false
    ]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      value: "0",
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS),
      contractName: "CryptoEats Escrow"
    };
  } catch (error) {
    const classified = classifyPaymasterError(error);
    console.error("Error preparing escrow deposit:", classified.message);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}
function prepareEscrowRelease(orderId) {
  try {
    const contract = getEscrowContract();
    const orderIdBytes = import_ethers.ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("release", [orderIdBytes]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS)
    };
  } catch (error) {
    const classified = classifyPaymasterError(error);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}
function prepareEscrowDispute(orderId) {
  try {
    const contract = getEscrowContract();
    const orderIdBytes = import_ethers.ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("dispute", [orderIdBytes]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS)
    };
  } catch (error) {
    const classified = classifyPaymasterError(error);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}
function prepareAdminRefund(orderId) {
  try {
    const contract = getEscrowContract();
    const orderIdBytes = import_ethers.ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("adminRefund", [orderIdBytes]);
    return {
      to: MARKETPLACE_ESCROW_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_ESCROW_ADDRESS)
    };
  } catch (error) {
    const classified = classifyPaymasterError(error);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}
function prepareNFTMint(orderId, creator, to, metadataUri, royaltyBps = 250) {
  try {
    if (!isContractAllowlisted(MARKETPLACE_NFT_ADDRESS)) {
      throw new Error("NFT contract is not in the allowlist");
    }
    const contract = getNFTContract();
    const orderIdBytes = import_ethers.ethers.id(orderId);
    const data = contract.interface.encodeFunctionData("mintAndTransfer", [
      orderIdBytes,
      creator,
      to,
      metadataUri,
      royaltyBps
    ]);
    return {
      to: MARKETPLACE_NFT_ADDRESS,
      data,
      chainId: BASE_CHAIN_ID,
      gasSponsored: isGasSponsored(MARKETPLACE_NFT_ADDRESS),
      contractName: "CryptoEats NFT Rewards"
    };
  } catch (error) {
    const classified = classifyPaymasterError(error);
    console.error("Error preparing NFT mint:", classified.message);
    throw Object.assign(new Error(classified.userMessage), { paymasterError: classified });
  }
}
async function estimateGas(from, to, data, value = "0") {
  try {
    const provider = getProvider();
    const sponsored = isGasSponsored(to);
    const estimate = await provider.estimateGas({ from, to, data, value: value === "0" ? void 0 : value });
    return {
      gasEstimate: estimate.toString(),
      gasSponsored: sponsored
    };
  } catch (error) {
    const classified = classifyPaymasterError(error);
    return {
      gasEstimate: "0",
      gasSponsored: false,
      error: classified.userMessage
    };
  }
}
async function verifyTransaction(txHash) {
  return withRetry(async () => {
    const provider = getProvider();
    const receipt = await provider.getTransactionReceipt(txHash);
    if (!receipt) {
      return { success: false };
    }
    return {
      success: receipt.status === 1,
      blockNumber: receipt.blockNumber,
      from: receipt.from,
      to: receipt.to || void 0,
      gasUsed: receipt.gasUsed.toString(),
      chainId: BASE_CHAIN_ID
    };
  }, {
    maxRetries: 3,
    baseDelayMs: 2e3,
    onRetry: (attempt, err) => console.warn(`[Verify Tx] Retry ${attempt}: ${err.message}`)
  }).catch((error) => {
    const classified = classifyPaymasterError(error);
    console.error("Error verifying transaction:", classified.message);
    return { success: false, error: classified };
  });
}
function getPaymasterStatus() {
  return {
    network: NETWORK,
    chainId: BASE_CHAIN_ID,
    rpcUrl: BASE_RPC_URL,
    paymasterAddress: BASE_PAYMASTER_ADDRESS,
    sponsoredContracts: getAllowlistedContracts(),
    supportedChains: [
      { chainId: BASE_MAINNET_CHAIN_ID, name: "Base Mainnet", rpcUrl: "https://mainnet.base.org" },
      { chainId: BASE_SEPOLIA_CHAIN_ID, name: "Base Sepolia (Testnet)", rpcUrl: "https://sepolia.base.org" }
    ],
    gasPolicy: {
      usdcTransfers: "sponsored",
      escrowDeposits: "sponsored",
      escrowReleases: "sponsored",
      nftMints: "sponsored",
      otherContracts: "user-paid"
    }
  };
}

// server/services/payments.ts
var import_stripe = __toESM(require("stripe"));
var stripe = process.env.STRIPE_SECRET_KEY ? new import_stripe.default(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" }) : null;
function isStripeConfigured() {
  return stripe !== null;
}
async function createPaymentIntent(amount, orderId, customerEmail, metadata) {
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
      ...metadata
    },
    receipt_email: customerEmail
  });
  return {
    clientSecret: intent.client_secret,
    intentId: intent.id,
    amount: intent.amount,
    currency: intent.currency
  };
}
async function capturePayment(intentId) {
  if (!stripe) throw new Error("Stripe is not configured.");
  const captured = await stripe.paymentIntents.capture(intentId);
  return {
    success: captured.status === "succeeded",
    intentId: captured.id,
    status: captured.status
  };
}
async function cancelPayment(intentId, reason) {
  if (!stripe) throw new Error("Stripe is not configured.");
  await stripe.paymentIntents.cancel(intentId, {
    cancellation_reason: "requested_by_customer"
  });
  return { success: true };
}
async function createRefund(intentId, amount) {
  if (!stripe) throw new Error("Stripe is not configured.");
  const refund = await stripe.refunds.create({
    payment_intent: intentId,
    ...amount ? { amount: Math.round(amount * 100) } : {}
  });
  return { refundId: refund.id, status: refund.status };
}
async function getPaymentStatus(intentId) {
  if (!stripe) throw new Error("Stripe is not configured.");
  const intent = await stripe.paymentIntents.retrieve(intentId);
  return {
    intentId: intent.id,
    status: intent.status,
    amount: intent.amount / 100,
    capturedAmount: intent.amount_received / 100
  };
}
async function constructWebhookEvent(payload, signature) {
  if (!stripe) throw new Error("Stripe is not configured.");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("STRIPE_WEBHOOK_SECRET not set.");
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// server/replit_integrations/image/client.ts
var import_genai = require("@google/genai");
var ai = new import_genai.GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY,
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL
  }
});
async function generateImage(prompt) {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [import_genai.Modality.TEXT, import_genai.Modality.IMAGE]
    }
  });
  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part) => part.inlineData
  );
  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }
  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

// server/services/nft-ai.ts
var fs = __toESM(require("fs"));
var path = __toESM(require("path"));
var crypto = __toESM(require("crypto"));
var isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
var NFT_UPLOAD_DIR = isServerless ? path.join("/tmp", "uploads", "nft-art") : path.join(process.cwd(), "uploads", "nft-art");
try {
  if (!fs.existsSync(NFT_UPLOAD_DIR)) {
    fs.mkdirSync(NFT_UPLOAD_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("[NFT-AI] Could not create upload directory:", err.message);
}
function buildPrompt(params) {
  const baseStyle = params.style || "digital art, vibrant colors, detailed illustration";
  switch (params.category) {
    case "merchant_dish":
      return `Create a stunning NFT artwork of a signature dish called "${params.dishName || params.name}". ${params.cuisine ? `The cuisine style is ${params.cuisine}. ` : ""}${params.restaurantName ? `From the restaurant "${params.restaurantName}". ` : ""}Style: Premium food photography meets ${baseStyle}. The dish should look extraordinary and appetizing, presented on an elegant plate with dramatic lighting. Include subtle golden sparkle effects around the dish to give it an NFT/collectible feel. Background should be dark and moody with a warm glow. Square format, high detail. Do NOT include any text, watermarks, or logos in the image.`;
    case "driver_avatar":
      return `Create a unique, stylized avatar NFT for a delivery driver${params.driverName ? ` named "${params.driverName}"` : ""}. Style: ${baseStyle}, character portrait. The avatar should feature a cool, confident delivery person with a futuristic motorcycle helmet or delivery gear. Include subtle crypto/blockchain visual elements like circuit patterns or hex shapes in the background. Color palette: neon greens, electric blues, and warm oranges on a dark background. The design should feel like a premium profile picture or gaming avatar. Square format. Do NOT include any text, watermarks, or logos in the image.`;
    case "customer_loyalty":
      return `Create a beautiful loyalty reward NFT artwork for a food delivery achievement: "${params.name}". ${params.description ? `Achievement: ${params.description}. ` : ""}${params.milestoneType === "customer" ? `Earned after ${params.milestoneValue} orders. ` : ""}${params.milestoneType === "driver" ? `Earned after ${params.milestoneValue} deliveries. ` : ""}Style: ${baseStyle}, collectible badge design. The artwork should look like a prestigious medal or emblem with metallic textures (gold, silver, platinum). Include subtle food-related motifs and blockchain hex patterns. Background should have a radial gradient glow effect. Square format, premium collectible feel. Do NOT include any text, watermarks, or logos in the image.`;
    case "marketplace_art":
      return `Create a unique, one-of-a-kind NFT artwork for the CryptoEats marketplace. Theme: "${params.name}". ${params.description ? `Description: ${params.description}. ` : ""}Style: ${baseStyle}, premium digital collectible. Blend food culture with crypto/blockchain aesthetics. Think gourmet cuisine meets futuristic technology. Rich colors, dramatic lighting, intricate details. Square format. Do NOT include any text, watermarks, or logos in the image.`;
    default:
      return `Create a digital NFT artwork: "${params.name}". ${params.description || ""}. Style: ${baseStyle}. Square format. Do NOT include any text.`;
  }
}
function saveBase64Image(dataUrl, fileName) {
  const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) throw new Error("Invalid image data URL");
  const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
  const buffer = Buffer.from(matches[2], "base64");
  const fullFileName = `${fileName}.${ext}`;
  const filePath = path.join(NFT_UPLOAD_DIR, fullFileName);
  fs.writeFileSync(filePath, buffer);
  return `/uploads/nft-art/${fullFileName}`;
}
async function generateNftArt(params) {
  const prompt = buildPrompt(params);
  const imageDataUrl = await generateImage(prompt);
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const safeName = params.name.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30);
  const fileName = `${params.category}-${safeName}-${uniqueId}`;
  const imageUrl = saveBase64Image(imageDataUrl, fileName);
  return {
    imageUrl,
    prompt,
    fileName
  };
}
var NFT_STYLE_PRESETS = {
  "cyberpunk": "cyberpunk neon aesthetic, glowing edges, dark futuristic",
  "watercolor": "watercolor painting style, soft washes, artistic brush strokes",
  "pixel-art": "retro pixel art style, 16-bit game aesthetic, crisp pixels",
  "abstract": "abstract geometric art, bold shapes, modern art gallery feel",
  "pop-art": "pop art style, bold outlines, halftone dots, Andy Warhol inspired",
  "3d-render": "3D rendered, glossy materials, studio lighting, ultra realistic",
  "anime": "anime illustration style, detailed linework, vibrant anime colors",
  "minimalist": "minimalist clean design, simple shapes, elegant composition"
};
function getStylePresets() {
  return Object.entries(NFT_STYLE_PRESETS).map(([id, description]) => ({
    id,
    name: id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    description
  }));
}

// server/services/payment-router.ts
var StripePaymentProvider = class {
  name = "stripe";
  isConfigured() {
    return isStripeConfigured();
  }
  async createPayment(order) {
    const result = await createPaymentIntent(order.amount, order.id, order.customerEmail, order.metadata);
    return {
      clientSecret: result.clientSecret,
      intentId: result.intentId,
      provider: "stripe",
      amount: result.amount,
      currency: result.currency
    };
  }
  async capturePayment(intentId) {
    const result = await capturePayment(intentId);
    return { ...result, provider: "stripe" };
  }
  async refundPayment(intentId, amount, reason) {
    const result = await createRefund(intentId, amount);
    return { success: true, refundId: result.refundId, status: result.status, provider: "stripe" };
  }
  async cancelPayment(intentId) {
    return cancelPayment(intentId);
  }
  async getStatus(intentId) {
    const result = await getPaymentStatus(intentId);
    return { status: result.status, amount: result.amount };
  }
  async handleDispute(webhookData) {
    if (webhookData.type === "charge.dispute.created") {
      const disputeId = webhookData.data?.object?.id;
      console.log(`[PaymentRouter] Stripe dispute created: ${disputeId}`);
      return { resolution: "logged_for_review", provider: "stripe", disputeId };
    }
    return { resolution: "no_action", provider: "stripe" };
  }
  getFeeEstimate(amount, _type) {
    const fee = amount * 0.029 + 0.3;
    return { rate: "2.9% + $0.30", estimated: Math.round(fee * 100) / 100 };
  }
};
var AdyenPaymentProvider = class {
  name = "adyen";
  isConfigured() {
    return !!(process.env.ADYEN_API_KEY && process.env.ADYEN_MERCHANT_ACCOUNT);
  }
  async createPayment(order) {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");
    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY,
      environment: process.env.ADYEN_ENVIRONMENT || "TEST"
    });
    const checkout = new CheckoutAPI(client);
    const response = await checkout.PaymentsApi.payments({
      amount: { value: Math.round(order.amount * 100), currency: order.currency.toUpperCase() },
      reference: order.id,
      paymentMethod: { type: "scheme" },
      returnUrl: `${process.env.APP_URL || "https://cryptoeats.app"}/payment/return`,
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT,
      metadata: { orderId: order.id, customerEmail: order.customerEmail }
    });
    return {
      intentId: response.pspReference || order.id,
      provider: "adyen",
      amount: Math.round(order.amount * 100),
      currency: order.currency
    };
  }
  async capturePayment(intentId) {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");
    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY,
      environment: process.env.ADYEN_ENVIRONMENT || "TEST"
    });
    const checkout = new CheckoutAPI(client);
    await checkout.ModificationsApi.captureAuthorisedPayment(intentId, {
      amount: { value: 0, currency: "USD" },
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT
    });
    return { success: true, intentId, status: "captured", provider: "adyen" };
  }
  async refundPayment(intentId, amount, _reason) {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");
    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY,
      environment: process.env.ADYEN_ENVIRONMENT || "TEST"
    });
    const checkout = new CheckoutAPI(client);
    const response = await checkout.ModificationsApi.refundCapturedPayment(intentId, {
      amount: { value: Math.round(amount * 100), currency: "USD" },
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT
    });
    return {
      success: true,
      refundId: response.pspReference || `refund_${intentId}`,
      status: "refunded",
      provider: "adyen"
    };
  }
  async cancelPayment(intentId) {
    if (!this.isConfigured()) throw new Error("Adyen is not configured");
    const { default: Client, CheckoutAPI } = await import("@adyen/api-library");
    const client = new Client({
      apiKey: process.env.ADYEN_API_KEY,
      environment: process.env.ADYEN_ENVIRONMENT || "TEST"
    });
    const checkout = new CheckoutAPI(client);
    await checkout.ModificationsApi.cancelAuthorisedPaymentByPspReference(intentId, {
      merchantAccount: process.env.ADYEN_MERCHANT_ACCOUNT
    });
    return { success: true };
  }
  async getStatus(_intentId) {
    return { status: "unknown", amount: 0 };
  }
  async handleDispute(webhookData) {
    const items = webhookData.notificationItems || [];
    for (const item of items) {
      const notification = item.NotificationRequestItem || item;
      if (notification.eventCode === "CHARGEBACK" || notification.eventCode === "REQUEST_FOR_INFORMATION") {
        console.log(`[PaymentRouter] Adyen dispute: ${notification.pspReference}`);
        return {
          resolution: "defense_needed",
          provider: "adyen",
          disputeId: notification.pspReference
        };
      }
    }
    return { resolution: "no_action", provider: "adyen" };
  }
  getFeeEstimate(amount, _type) {
    const fee = amount * 0.02 + 0.13;
    return { rate: "~2.0% + $0.13 (interchange-plus)", estimated: Math.round(fee * 100) / 100 };
  }
};
var GoDaddyPaymentProvider = class {
  name = "godaddy";
  apiUrl = process.env.GODADDY_PAYMENTS_API_URL || "https://api.godaddypayments.com/v1";
  isConfigured() {
    return !!process.env.GODADDY_PAYMENTS_API_KEY;
  }
  async request(method, path5, data) {
    const url = `${this.apiUrl}${path5}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Authorization": `Bearer ${process.env.GODADDY_PAYMENTS_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: data ? JSON.stringify(data) : void 0
    });
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GoDaddy API error: ${response.status} - ${error}`);
    }
    return response.json();
  }
  async createPayment(order) {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");
    const result = await this.request("POST", "/payments", {
      amount: Math.round(order.amount * 100),
      currency: order.currency.toUpperCase(),
      reference: order.id,
      description: `CryptoEats Order #${order.id}`
    });
    return {
      intentId: result.transactionId || result.id,
      provider: "godaddy",
      amount: Math.round(order.amount * 100),
      currency: order.currency
    };
  }
  async capturePayment(intentId) {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");
    await this.request("POST", `/payments/${intentId}/capture`);
    return { success: true, intentId, status: "captured", provider: "godaddy" };
  }
  async refundPayment(intentId, amount, reason) {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");
    const result = await this.request("POST", `/payments/${intentId}/refund`, {
      amount: Math.round(amount * 100),
      reason: reason || "requested_by_customer"
    });
    return {
      success: true,
      refundId: result.refundId || `refund_${intentId}`,
      status: "refunded",
      provider: "godaddy"
    };
  }
  async cancelPayment(intentId) {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");
    await this.request("POST", `/payments/${intentId}/cancel`);
    return { success: true };
  }
  async getStatus(intentId) {
    if (!this.isConfigured()) throw new Error("GoDaddy Payments is not configured");
    const result = await this.request("GET", `/payments/${intentId}`);
    return { status: result.status, amount: (result.amount || 0) / 100 };
  }
  async handleDispute(webhookData) {
    if (webhookData.event === "dispute_created" || webhookData.type === "dispute") {
      console.log(`[PaymentRouter] GoDaddy dispute: ${webhookData.transactionId}`);
      return {
        resolution: "review_pending",
        provider: "godaddy",
        disputeId: webhookData.transactionId || webhookData.id
      };
    }
    return { resolution: "no_action", provider: "godaddy" };
  }
  getFeeEstimate(amount, type) {
    let rate;
    let rateStr;
    if (type === "in-person") {
      rate = 0.023;
      rateStr = "2.3% + $0";
    } else {
      rate = 0.027;
      rateStr = "2.7% + $0.30";
    }
    const fee = amount * rate + (type === "in-person" ? 0 : 0.3);
    return { rate: rateStr, estimated: Math.round(fee * 100) / 100 };
  }
};
var SquarePaymentProvider = class {
  name = "square";
  isConfigured() {
    return !!process.env.SQUARE_ACCESS_TOKEN;
  }
  async getClient() {
    const { Client, Environment } = await import("square");
    return new Client({
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT === "production" ? Environment.Production : Environment.Sandbox
    });
  }
  async createPayment(order) {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    const { result } = await client.paymentsApi.createPayment({
      sourceId: "cnon:card-nonce-ok",
      idempotencyKey: `ce_${order.id}_${Date.now()}`,
      amountMoney: {
        amount: BigInt(Math.round(order.amount * 100)),
        currency: order.currency.toUpperCase()
      },
      referenceId: order.id,
      note: `CryptoEats Order #${order.id}`
    });
    return {
      intentId: result.payment?.id || order.id,
      provider: "square",
      amount: Number(result.payment?.amountMoney?.amount || 0),
      currency: order.currency
    };
  }
  async capturePayment(intentId) {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    await client.paymentsApi.completePayment(intentId, {});
    return { success: true, intentId, status: "captured", provider: "square" };
  }
  async refundPayment(intentId, amount, reason) {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    const { result } = await client.refundsApi.refundPayment({
      idempotencyKey: `refund_${intentId}_${Date.now()}`,
      paymentId: intentId,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency: "USD"
      },
      reason: reason || "Customer request"
    });
    return {
      success: true,
      refundId: result.refund?.id || `refund_${intentId}`,
      status: "refunded",
      provider: "square"
    };
  }
  async cancelPayment(intentId) {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    await client.paymentsApi.cancelPayment(intentId);
    return { success: true };
  }
  async getStatus(intentId) {
    if (!this.isConfigured()) throw new Error("Square is not configured");
    const client = await this.getClient();
    const { result } = await client.paymentsApi.getPayment(intentId);
    return {
      status: result.payment?.status || "unknown",
      amount: Number(result.payment?.amountMoney?.amount || 0) / 100
    };
  }
  async handleDispute(webhookData) {
    if (webhookData.type === "dispute.created") {
      const disputeId = webhookData.data?.id || webhookData.data?.object?.dispute?.id;
      console.log(`[PaymentRouter] Square dispute: ${disputeId}`);
      return { resolution: "evidence_required", provider: "square", disputeId };
    }
    return { resolution: "no_action", provider: "square" };
  }
  getFeeEstimate(amount, type) {
    if (type === "in-person" || type === "pos") {
      const fee2 = amount * 0.026 + 0.1;
      return { rate: "2.6% + $0.10", estimated: Math.round(fee2 * 100) / 100 };
    }
    const fee = amount * 0.029 + 0.3;
    return { rate: "2.9% + $0.30", estimated: Math.round(fee * 100) / 100 };
  }
};
var CoinbasePaymentProvider = class {
  name = "coinbase";
  isConfigured() {
    return !!process.env.COINBASE_COMMERCE_API_KEY;
  }
  get headers() {
    return {
      "X-CC-Api-Key": process.env.COINBASE_COMMERCE_API_KEY,
      "X-CC-Version": "2018-03-22",
      "Content-Type": "application/json"
    };
  }
  async createPayment(order) {
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
          currency: order.currency.toUpperCase()
        },
        metadata: {
          orderId: order.id,
          customerEmail: order.customerEmail
        }
      })
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
      currency: order.currency
    };
  }
  async capturePayment(intentId) {
    return { success: true, intentId, status: "completed", provider: "coinbase" };
  }
  async refundPayment(intentId, amount, reason) {
    console.log(`[PaymentRouter] Coinbase refund requested: ${intentId}, amount: ${amount}, reason: ${reason}`);
    console.log("[PaymentRouter] Crypto refunds require manual processing via wallet transfer");
    return {
      success: true,
      refundId: `cb_refund_${intentId}_${Date.now()}`,
      status: "pending_manual_review",
      provider: "coinbase"
    };
  }
  async cancelPayment(intentId) {
    if (!this.isConfigured()) throw new Error("Coinbase Commerce is not configured");
    await fetch(`https://api.commerce.coinbase.com/charges/${intentId}/cancel`, {
      method: "POST",
      headers: this.headers
    });
    return { success: true };
  }
  async getStatus(intentId) {
    if (!this.isConfigured()) throw new Error("Coinbase Commerce is not configured");
    const response = await fetch(`https://api.commerce.coinbase.com/charges/${intentId}`, {
      headers: this.headers
    });
    if (!response.ok) throw new Error("Failed to fetch charge status");
    const data = await response.json();
    const charge = data.data;
    const timeline = charge.timeline || [];
    const lastStatus = timeline[timeline.length - 1]?.status || "NEW";
    return {
      status: lastStatus.toLowerCase(),
      amount: parseFloat(charge.pricing?.local?.amount || "0")
    };
  }
  async handleDispute(webhookData) {
    const eventType = webhookData.event?.type || webhookData.type;
    if (eventType === "charge:failed" || eventType === "charge:disputed") {
      const chargeId = webhookData.event?.data?.id || webhookData.data?.id;
      console.log(`[PaymentRouter] Coinbase dispute/failure: ${chargeId}`);
      return {
        resolution: "manual_review_required",
        provider: "coinbase",
        disputeId: chargeId
      };
    }
    return { resolution: "no_action", provider: "coinbase" };
  }
  getFeeEstimate(amount, _type) {
    const fee = amount * 0.01;
    return { rate: "1.0%", estimated: Math.round(fee * 100) / 100 };
  }
};
var defaultRoutingConfig = {
  defaultProvider: "stripe",
  cryptoProvider: "coinbase",
  internationalProvider: "adyen",
  inPersonProvider: "godaddy",
  posProvider: "square",
  fallbackChain: ["stripe", "adyen", "square", "godaddy"]
};
var PaymentRouter = class {
  providers = /* @__PURE__ */ new Map();
  config;
  routingStats = {
    totalRouted: 0,
    byProvider: {},
    fallbacksUsed: 0
  };
  constructor(config) {
    this.config = { ...defaultRoutingConfig, ...config };
    this.providers.set("stripe", new StripePaymentProvider());
    this.providers.set("adyen", new AdyenPaymentProvider());
    this.providers.set("godaddy", new GoDaddyPaymentProvider());
    this.providers.set("square", new SquarePaymentProvider());
    this.providers.set("coinbase", new CoinbasePaymentProvider());
  }
  selectProvider(order) {
    if (order.type === "crypto") return this.config.cryptoProvider;
    if (order.isInternational) return this.config.internationalProvider;
    if (order.type === "in-person") return this.config.inPersonProvider;
    if (order.type === "pos") return this.config.posProvider;
    return this.config.defaultProvider;
  }
  getConfiguredFallback(preferred) {
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
  async createPayment(order) {
    const preferred = this.selectProvider(order);
    const providerKey = this.getConfiguredFallback(preferred);
    const provider = this.providers.get(providerKey);
    this.routingStats.totalRouted++;
    this.routingStats.byProvider[providerKey] = (this.routingStats.byProvider[providerKey] || 0) + 1;
    console.log(`[PaymentRouter] Routing order ${order.id} to ${providerKey} (requested: ${preferred}, type: ${order.type})`);
    return provider.createPayment(order);
  }
  async capturePayment(intentId, providerKey) {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.capturePayment(intentId);
  }
  async refundPayment(intentId, amount, providerKey, reason) {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.refundPayment(intentId, amount, reason);
  }
  async cancelPayment(intentId, providerKey) {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.cancelPayment(intentId);
  }
  async getStatus(intentId, providerKey) {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.getStatus(intentId);
  }
  async handleDispute(webhookData, providerKey) {
    const provider = this.providers.get(providerKey);
    if (!provider) throw new Error(`Unknown provider: ${providerKey}`);
    return provider.handleDispute(webhookData);
  }
  getProviderStatus() {
    const status = {};
    for (const [key, provider] of this.providers) {
      status[key] = { configured: provider.isConfigured(), name: provider.name };
    }
    return status;
  }
  getFeeComparison(amount, type = "online") {
    const comparison = {};
    for (const [key, provider] of this.providers) {
      const fees = provider.getFeeEstimate(amount, type);
      comparison[key] = { ...fees, configured: provider.isConfigured() };
    }
    return comparison;
  }
  getRoutingStats() {
    return { ...this.routingStats };
  }
  getRoutingConfig() {
    return { ...this.config };
  }
  updateRoutingConfig(updates) {
    this.config = { ...this.config, ...updates };
    console.log("[PaymentRouter] Routing config updated:", this.config);
  }
};
var paymentRouter = new PaymentRouter();
function getPaymentRouter() {
  return paymentRouter;
}

// server/services/notifications.ts
var import_expo_server_sdk = require("expo-server-sdk");
var expo = new import_expo_server_sdk.Expo();
var SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";
var TWILIO_API_BASE = "https://api.twilio.com/2010-04-01";
function isSendGridConfigured() {
  return !!process.env.SENDGRID_API_KEY;
}
function isTwilioConfigured() {
  return !!(process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE);
}
async function sendEmail(to, subject, html, from) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("[Email] SendGrid not configured, skipping email to:", to);
    return { success: false };
  }
  const senderEmail = from || process.env.SENDGRID_FROM_EMAIL || "noreply@cryptoeats.io";
  const response = await fetch(SENDGRID_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: senderEmail, name: "CryptoEats" },
      subject,
      content: [{ type: "text/html", value: html }]
    })
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Email] SendGrid error:", errorText);
    return { success: false };
  }
  const messageId = response.headers.get("x-message-id") || void 0;
  console.log(`[Email] Sent to ${to}: "${subject}"`);
  return { success: true, messageId };
}
async function sendSMS(to, body) {
  const sid = process.env.TWILIO_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE;
  if (!sid || !authToken || !fromPhone) {
    console.warn("[SMS] Twilio not configured, skipping SMS to:", to);
    return { success: false };
  }
  const url = `${TWILIO_API_BASE}/Accounts/${sid}/Messages.json`;
  const auth = Buffer.from(`${sid}:${authToken}`).toString("base64");
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ To: to, From: fromPhone, Body: body }).toString()
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("[SMS] Twilio error:", errorText);
    return { success: false };
  }
  const data = await response.json();
  console.log(`[SMS] Sent to ${to}: "${body.substring(0, 50)}..."`);
  return { success: true, sid: data.sid };
}
async function sendPushNotification(tokens, title, body, data) {
  const validTokens = tokens.filter(import_expo_server_sdk.Expo.isExpoPushToken);
  if (validTokens.length === 0) {
    console.warn("[Push] No valid Expo push tokens provided");
    return { sent: 0, failed: 0 };
  }
  const messages2 = validTokens.map((token) => ({
    to: token,
    sound: "default",
    title,
    body,
    data: data || {},
    priority: "high"
  }));
  const chunks = expo.chunkPushNotifications(messages2);
  let sent = 0;
  let failed = 0;
  for (const chunk of chunks) {
    try {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === "ok") sent++;
        else failed++;
      }
    } catch (err) {
      console.error("[Push] Error sending chunk:", err);
      failed += chunk.length;
    }
  }
  console.log(`[Push] Sent: ${sent}, Failed: ${failed}`);
  return { sent, failed };
}
function buildOrderStatusEmail(orderId, status, driverName) {
  const statusMessages = {
    confirmed: "Your order has been confirmed and is being prepared.",
    preparing: "The restaurant is preparing your food.",
    ready: "Your order is ready for pickup!",
    picked_up: `${driverName || "Your driver"} has picked up your order and is on the way.`,
    delivered: "Your order has been delivered. Enjoy your meal!",
    cancelled: "Your order has been cancelled. A refund will be processed."
  };
  const message = statusMessages[status] || `Order status updated to: ${status}`;
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;color:#eee;padding:32px;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#00d4aa;margin:0;font-size:28px;">CryptoEats</h1>
      </div>
      <div style="background:#16213e;padding:20px;border-radius:8px;text-align:center;">
        <p style="margin:0;color:#999;font-size:14px;">Order #${orderId.substring(0, 8).toUpperCase()}</p>
        <h2 style="margin:8px 0;font-size:22px;color:#fff;text-transform:capitalize;">${status.replace("_", " ")}</h2>
        <p style="margin:8px 0 0;color:#ccc;font-size:15px;">${message}</p>
      </div>
    </div>
  `;
}
function buildOrderStatusSMS(orderId, status) {
  const shortId = orderId.substring(0, 8).toUpperCase();
  const messages2 = {
    confirmed: `CryptoEats: Order #${shortId} confirmed! We're preparing your food.`,
    preparing: `CryptoEats: Order #${shortId} is being prepared.`,
    ready: `CryptoEats: Order #${shortId} is ready for pickup!`,
    picked_up: `CryptoEats: Your driver has your order #${shortId} and is on the way!`,
    delivered: `CryptoEats: Order #${shortId} delivered! Enjoy your meal.`,
    cancelled: `CryptoEats: Order #${shortId} has been cancelled.`
  };
  return messages2[status] || `CryptoEats: Order #${shortId} status: ${status}`;
}

// server/services/uploads.ts
var fs2 = __toESM(require("fs"));
var path2 = __toESM(require("path"));
var crypto2 = __toESM(require("crypto"));
var isServerless2 = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
var UPLOAD_DIR = isServerless2 ? path2.resolve("/tmp", "uploads") : path2.resolve(process.cwd(), "uploads");
var MAX_FILE_SIZE = 10 * 1024 * 1024;
var ALLOWED_MIME_TYPES = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "image/jpeg", "image/png"]
};
function ensureUploadDir(subdir) {
  const dir = path2.join(UPLOAD_DIR, subdir);
  if (!fs2.existsSync(dir)) {
    fs2.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
function getUploadCategories() {
  return {
    restaurant_photos: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.image },
    menu_items: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.image },
    driver_documents: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.document },
    id_verification: { maxSize: MAX_FILE_SIZE, allowedTypes: ALLOWED_MIME_TYPES.document },
    profile_photos: { maxSize: 5 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES.image }
  };
}
function validateUpload(fileSize, mimeType, category) {
  const config = getUploadCategories()[category];
  if (!config) return { valid: false, error: `Unknown upload category: ${category}` };
  if (fileSize > config.maxSize) return { valid: false, error: `File too large. Max: ${config.maxSize / 1024 / 1024}MB` };
  if (!config.allowedTypes.includes(mimeType)) return { valid: false, error: `File type not allowed: ${mimeType}` };
  return { valid: true };
}
async function saveUpload(fileBuffer, originalName, mimeType, category) {
  const dir = ensureUploadDir(category);
  const ext = path2.extname(originalName) || mimeTypeToExt(mimeType);
  const id = crypto2.randomUUID();
  const filename = `${id}${ext}`;
  const filePath = path2.join(dir, filename);
  fs2.writeFileSync(filePath, fileBuffer);
  return {
    id,
    filename,
    originalName,
    mimeType,
    size: fileBuffer.length,
    url: `/uploads/${category}/${filename}`,
    category
  };
}
function mimeTypeToExt(mimeType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf"
  };
  return map[mimeType] || ".bin";
}

// server/services/tracking.ts
var activeDriverLocations = /* @__PURE__ */ new Map();
var orderDriverMap = /* @__PURE__ */ new Map();
function updateDriverLocation(driverId, location) {
  activeDriverLocations.set(driverId, {
    ...location,
    timestamp: Date.now()
  });
  if (location.orderId) {
    orderDriverMap.set(location.orderId, driverId);
  }
}
function getDriverLocation(driverId) {
  const loc = activeDriverLocations.get(driverId);
  if (!loc) return null;
  if (Date.now() - loc.timestamp > 5 * 60 * 1e3) {
    activeDriverLocations.delete(driverId);
    return null;
  }
  return loc;
}
function getOrderDriverLocation(orderId) {
  const driverId = orderDriverMap.get(orderId);
  if (!driverId) return null;
  return getDriverLocation(driverId);
}
function removeDriverTracking(driverId) {
  activeDriverLocations.delete(driverId);
  for (const [orderId, did] of orderDriverMap.entries()) {
    if (did === driverId) orderDriverMap.delete(orderId);
  }
}
function assignDriverToOrder(orderId, driverId) {
  orderDriverMap.set(orderId, driverId);
}
function getActiveDriverCount() {
  return activeDriverLocations.size;
}
function getAllActiveDrivers() {
  const result = [];
  for (const [driverId, location] of activeDriverLocations.entries()) {
    if (Date.now() - location.timestamp < 5 * 60 * 1e3) {
      result.push({ driverId, location });
    }
  }
  return result;
}
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function estimateETA(distanceKm) {
  const avgSpeedKmh = 30;
  return Math.ceil(distanceKm / avgSpeedKmh * 60);
}
async function getDirectionsETA(originLat, originLng, destLat, destLng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originLat},${originLng}&destination=${destLat},${destLng}&mode=driving&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.status === "OK" && data.routes.length > 0) {
        const route = data.routes[0];
        const leg = route.legs[0];
        return {
          durationMinutes: Math.ceil(leg.duration.value / 60),
          distanceKm: leg.distance.value / 1e3,
          polyline: route.overview_polyline?.points
        };
      }
    } catch (err) {
      console.warn("[Tracking] Google Maps API error, falling back to estimate:", err);
    }
  }
  const distance = calculateDistance(originLat, originLng, destLat, destLng);
  return {
    durationMinutes: estimateETA(distance),
    distanceKm: distance
  };
}
function setupTrackingSocket(io) {
  io.on("connection", (socket) => {
    socket.on("driver:location", (data) => {
      updateDriverLocation(data.driverId, {
        lat: data.lat,
        lng: data.lng,
        heading: data.heading,
        speed: data.speed,
        timestamp: Date.now(),
        orderId: data.orderId
      });
      if (data.orderId) {
        io.to(`order:${data.orderId}`).emit("driver:location:update", {
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          speed: data.speed
        });
      }
    });
    socket.on("track:order", (data) => {
      socket.join(`order:${data.orderId}`);
      const location = getOrderDriverLocation(data.orderId);
      if (location) {
        socket.emit("driver:location:update", {
          lat: location.lat,
          lng: location.lng,
          heading: location.heading,
          speed: location.speed
        });
      }
    });
    socket.on("driver:online", (data) => {
      updateDriverLocation(data.driverId, {
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now()
      });
      socket.join(`driver:${data.driverId}`);
    });
    socket.on("driver:offline", (data) => {
      removeDriverTracking(data.driverId);
    });
  });
}

// server/services/monitoring.ts
var errorLog = [];
var MAX_ERROR_LOG = 500;
var requestCount = 0;
var errorCount = 0;
var totalResponseTime = 0;
var activeConnections = 0;
var startTime = Date.now();
function reportError(error, context = {}, level = "error") {
  const report = {
    id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level,
    message: typeof error === "string" ? error : error.message,
    stack: typeof error === "string" ? void 0 : error.stack,
    context
  };
  errorLog.unshift(report);
  if (errorLog.length > MAX_ERROR_LOG) errorLog.pop();
  if (level === "error") {
    errorCount++;
    console.error(`[Monitor] ${report.message}`, context);
  } else if (level === "warn") {
    console.warn(`[Monitor] ${report.message}`, context);
  }
  if (process.env.SENTRY_DSN) {
    sendToSentry(report).catch(() => {
    });
  }
}
async function sendToSentry(report) {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  try {
    const dsnParts = new URL(dsn);
    const projectId = dsnParts.pathname.replace("/", "");
    const publicKey = dsnParts.username;
    const host = dsnParts.host;
    const sentryUrl = `https://${host}/api/${projectId}/store/`;
    await fetch(sentryUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_client=cryptoeats/1.0, sentry_key=${publicKey}`
      },
      body: JSON.stringify({
        event_id: report.id.replace(/[^a-f0-9]/g, "").substring(0, 32).padEnd(32, "0"),
        timestamp: report.timestamp,
        level: report.level,
        platform: "node",
        logger: "cryptoeats",
        message: { formatted: report.message },
        extra: report.context,
        exception: report.stack ? {
          values: [{
            type: "Error",
            value: report.message,
            stacktrace: { frames: parseStack(report.stack) }
          }]
        } : void 0
      })
    });
  } catch (err) {
    console.error("[Monitor] Failed to send to Sentry:", err);
  }
}
function parseStack(stack) {
  return stack.split("\n").slice(1).map((line) => {
    const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
    if (match) {
      return { function: match[1], filename: match[2], lineno: parseInt(match[3]), colno: parseInt(match[4]) };
    }
    return { function: "?", filename: line.trim(), lineno: 0, colno: 0 };
  }).reverse();
}
function monitoringMiddleware() {
  return (req, res, next) => {
    requestCount++;
    activeConnections++;
    const start = Date.now();
    res.on("finish", () => {
      activeConnections--;
      const duration = Date.now() - start;
      totalResponseTime += duration;
      if (res.statusCode >= 500) {
        reportError(`Server error: ${req.method} ${req.path} -> ${res.statusCode}`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration,
          userAgent: req.headers["user-agent"],
          ip: req.ip
        }, "error");
      } else if (res.statusCode >= 400) {
        reportError(`Client error: ${req.method} ${req.path} -> ${res.statusCode}`, {
          method: req.method,
          path: req.path,
          statusCode: res.statusCode,
          duration
        }, "warn");
      }
      if (duration > 5e3) {
        reportError(`Slow request: ${req.method} ${req.path} took ${duration}ms`, {
          method: req.method,
          path: req.path,
          duration
        }, "warn");
      }
    });
    next();
  };
}
function getHealthMetrics() {
  return {
    uptime: (Date.now() - startTime) / 1e3,
    memoryUsage: process.memoryUsage(),
    requestCount,
    errorCount,
    avgResponseTime: requestCount > 0 ? Math.round(totalResponseTime / requestCount) : 0,
    activeConnections,
    lastErrors: errorLog.slice(0, 20)
  };
}
function getRecentErrors(limit = 50) {
  return errorLog.slice(0, limit);
}
function getErrorStats() {
  const now = Date.now();
  const last5min = errorLog.filter((e) => new Date(e.timestamp).getTime() > now - 5 * 60 * 1e3);
  const lastHour = errorLog.filter((e) => new Date(e.timestamp).getTime() > now - 60 * 60 * 1e3);
  return {
    total: errorLog.length,
    last5min: last5min.length,
    lastHour: lastHour.length,
    byLevel: {
      error: errorLog.filter((e) => e.level === "error").length,
      warn: errorLog.filter((e) => e.level === "warn").length,
      info: errorLog.filter((e) => e.level === "info").length
    }
  };
}

// server/services/verification.ts
var import_drizzle_orm4 = require("drizzle-orm");
var PERSONA_API_KEY = process.env.PERSONA_API_KEY;
var PERSONA_TEMPLATE_ALCOHOL = process.env.PERSONA_TEMPLATE_ALCOHOL || "tmpl_age21_alcohol";
var PERSONA_TEMPLATE_DRIVER = process.env.PERSONA_TEMPLATE_DRIVER || "tmpl_driver_background";
var CHECKR_API_KEY = process.env.CHECKR_API_KEY;
function isPersonaConfigured() {
  return !!PERSONA_API_KEY;
}
function isCheckrConfigured() {
  return !!CHECKR_API_KEY;
}
async function startIdentityVerification(userId, type, metadata) {
  const templateId = type === "alcohol" ? PERSONA_TEMPLATE_ALCOHOL : PERSONA_TEMPLATE_DRIVER;
  if (!PERSONA_API_KEY) {
    const mockInquiryId = `inq_mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.insert(complianceLogs).values({
      type: "license",
      entityId: userId,
      details: {
        verificationType: type,
        inquiryId: mockInquiryId,
        templateId,
        status: "initiated",
        ...metadata
      },
      status: "pending"
    });
    return {
      flowUrl: `/verification/mock?inquiry=${mockInquiryId}&type=${type}`,
      inquiryId: mockInquiryId,
      templateId,
      referenceId: userId
    };
  }
  try {
    const response = await fetch("https://withpersona.com/api/v1/inquiries", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERSONA_API_KEY}`,
        "Content-Type": "application/json",
        "Persona-Version": "2023-01-05"
      },
      body: JSON.stringify({
        data: {
          attributes: {
            "inquiry-template-id": templateId,
            "reference-id": userId,
            "note": `CryptoEats ${type} verification`
          }
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Persona API error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    const inquiryId = result.data.id;
    const flowUrl = result.data.attributes?.["redirect-url"] || `https://withpersona.com/verify?inquiry-id=${inquiryId}`;
    await db.insert(complianceLogs).values({
      type: "license",
      entityId: userId,
      details: {
        verificationType: type,
        inquiryId,
        templateId,
        status: "initiated",
        ...metadata
      },
      status: "pending"
    });
    return {
      flowUrl,
      inquiryId,
      templateId,
      referenceId: userId
    };
  } catch (error) {
    reportError(error, { service: "verification", action: "startIdentityVerification", userId, type });
    throw error;
  }
}
async function handleVerificationWebhook(event, data) {
  try {
    const inquiryId = data.id || data.attributes?.["inquiry-id"];
    const referenceId = data.attributes?.["reference-id"] || data.referenceId;
    const templateId = data.attributes?.["inquiry-template-id"] || data.templateId;
    let verificationStatus;
    switch (event) {
      case "inquiry.completed":
      case "inquiry.approved":
      case "verification.passed":
        verificationStatus = "passed";
        break;
      case "inquiry.failed":
      case "verification.failed":
        verificationStatus = "failed";
        break;
      case "inquiry.expired":
        verificationStatus = "expired";
        break;
      case "inquiry.needs-review":
      case "inquiry.marked-for-review":
        verificationStatus = "needs_review";
        break;
      default:
        verificationStatus = "pending";
    }
    await db.insert(complianceLogs).values({
      type: "license",
      entityId: referenceId,
      details: {
        verificationType: templateId?.includes("driver") ? "driver" : "alcohol",
        inquiryId,
        templateId,
        event,
        webhookData: data,
        status: verificationStatus
      },
      status: verificationStatus
    });
    if (verificationStatus === "passed" && referenceId) {
      const isDriverVerification = templateId?.includes("driver");
      if (isDriverVerification) {
        const driver = await db.select().from(drivers).where((0, import_drizzle_orm4.eq)(drivers.userId, referenceId)).limit(1);
        if (driver.length > 0) {
          await db.update(drivers).set({
            backgroundCheckStatus: "passed"
          }).where((0, import_drizzle_orm4.eq)(drivers.userId, referenceId));
          if (CHECKR_API_KEY) {
            await initiateBackgroundCheck(referenceId, driver[0]);
          }
        }
      } else {
        const customer = await db.select().from(customers).where((0, import_drizzle_orm4.eq)(customers.userId, referenceId)).limit(1);
        if (customer.length > 0) {
          await db.update(customers).set({
            idVerified: true,
            idVerificationData: JSON.stringify({
              verifiedAt: (/* @__PURE__ */ new Date()).toISOString(),
              inquiryId,
              method: "persona",
              expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString()
            })
          }).where((0, import_drizzle_orm4.eq)(customers.userId, referenceId));
        }
      }
    }
    return { processed: true, userId: referenceId, status: verificationStatus };
  } catch (error) {
    reportError(error, { service: "verification", action: "handleWebhook", event });
    return { processed: false };
  }
}
async function initiateBackgroundCheck(userId, driver) {
  if (!CHECKR_API_KEY) return;
  try {
    const response = await fetch("https://api.checkr.com/v1/invitations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${Buffer.from(CHECKR_API_KEY + ":").toString("base64")}`
      },
      body: JSON.stringify({
        package: "driver_pro",
        work_locations: [{ state: "FL", city: "Miami" }],
        candidate: {
          first_name: driver.firstName,
          last_name: driver.lastName,
          email: driver.userId
        }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Checkr API error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    await db.insert(complianceLogs).values({
      type: "insurance",
      entityId: userId,
      details: {
        verificationType: "background_check",
        provider: "checkr",
        invitationId: result.id,
        status: "initiated"
      },
      status: "pending"
    });
  } catch (error) {
    reportError(error, { service: "verification", action: "initiateBackgroundCheck", userId });
  }
}
async function handleCheckrWebhook(event, data) {
  try {
    const candidateId = data.candidate_id;
    const reportId = data.report_id;
    const status = data.status;
    let checkStatus;
    switch (event) {
      case "report.completed":
        checkStatus = status === "clear" ? "passed" : "failed";
        break;
      case "report.suspended":
        checkStatus = "needs_review";
        break;
      default:
        checkStatus = "pending";
    }
    await db.insert(complianceLogs).values({
      type: "insurance",
      entityId: candidateId,
      details: {
        verificationType: "background_check",
        provider: "checkr",
        reportId,
        event,
        status: checkStatus,
        webhookData: data
      },
      status: checkStatus
    });
    if (checkStatus === "passed") {
      await db.update(drivers).set({
        backgroundCheckStatus: "cleared"
      }).where((0, import_drizzle_orm4.eq)(drivers.userId, candidateId));
    } else if (checkStatus === "failed") {
      await db.update(drivers).set({
        backgroundCheckStatus: "failed"
      }).where((0, import_drizzle_orm4.eq)(drivers.userId, candidateId));
    }
    return { processed: true };
  } catch (error) {
    reportError(error, { service: "verification", action: "handleCheckrWebhook", event });
    return { processed: false };
  }
}
async function getVerificationStatus(userId, type) {
  if (type === "alcohol") {
    const customer = await db.select().from(customers).where((0, import_drizzle_orm4.eq)(customers.userId, userId)).limit(1);
    if (customer.length > 0 && customer[0].idVerified) {
      const verificationData = customer[0].idVerificationData ? JSON.parse(customer[0].idVerificationData) : {};
      if (verificationData.expiresAt && new Date(verificationData.expiresAt) < /* @__PURE__ */ new Date()) {
        return { verified: false, status: "expired", method: "persona" };
      }
      return {
        verified: true,
        status: "passed",
        method: verificationData.method || "manual",
        verifiedAt: verificationData.verifiedAt ? new Date(verificationData.verifiedAt) : void 0,
        expiresAt: verificationData.expiresAt ? new Date(verificationData.expiresAt) : void 0
      };
    }
    return { verified: false, status: "pending", method: "none" };
  }
  const driver = await db.select().from(drivers).where((0, import_drizzle_orm4.eq)(drivers.userId, userId)).limit(1);
  if (driver.length > 0) {
    const bgStatus = driver[0].backgroundCheckStatus || "pending";
    return {
      verified: bgStatus === "cleared" || bgStatus === "passed",
      status: bgStatus === "cleared" || bgStatus === "passed" ? "passed" : bgStatus === "failed" ? "failed" : "pending",
      method: "checkr"
    };
  }
  return { verified: false, status: "pending", method: "none" };
}
async function checkAlcoholEligibility(userId) {
  const status = await getVerificationStatus(userId, "alcohol");
  if (status.verified && status.status === "passed") {
    return { eligible: true, verificationRequired: false };
  }
  if (status.status === "expired") {
    return { eligible: false, reason: "ID verification has expired. Please re-verify.", verificationRequired: true };
  }
  return { eligible: false, reason: "Age verification required for alcohol orders (21+)", verificationRequired: true };
}

// server/services/license-verification.ts
var FL_DBPR_API_URL = process.env.FL_DBPR_API_URL || "";
function isDBPRConfigured() {
  return !!FL_DBPR_API_URL;
}
async function verifyFloridaLiquorLicense(licenseNumber, businessName) {
  if (isDBPRConfigured()) {
    try {
      const response = await fetch(`${FL_DBPR_API_URL}/licenses/${encodeURIComponent(licenseNumber)}`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (response.ok) {
        const data = await response.json();
        return {
          valid: data.status === "active" || data.status === "current",
          licenseNumber,
          businessName: data.businessName || businessName,
          licenseType: data.licenseType,
          status: data.status,
          expirationDate: data.expirationDate,
          county: data.county,
          method: "dbpr_api",
          verifiedAt: /* @__PURE__ */ new Date(),
          details: data
        };
      }
    } catch (err) {
      console.warn("[License] DBPR API lookup failed, falling back to manual review:", err);
    }
  }
  console.log(`[License] Simulated verification for license: ${licenseNumber}`);
  const isValidFormat = /^[A-Z]{2,4}-?\d{5,10}$/i.test(licenseNumber) || licenseNumber.length >= 5;
  return {
    valid: isValidFormat,
    licenseNumber,
    businessName,
    licenseType: "Beverage License",
    status: isValidFormat ? "pending_manual_review" : "invalid_format",
    method: "simulated",
    verifiedAt: /* @__PURE__ */ new Date(),
    details: {
      note: "FL DBPR API not configured. License flagged for manual admin review.",
      formatValid: isValidFormat
    }
  };
}
function checkAlcoholDeliveryCompliance(params) {
  const now = params.deliveryTime || /* @__PURE__ */ new Date();
  const hour = now.getHours();
  const withinDeliveryWindow = hour >= 8 && hour < 22;
  let totalValue = 0;
  let nonAlcoholValue = 0;
  for (const item of params.orderItems) {
    const value = item.price * item.quantity;
    totalValue += value;
    if (!item.isAlcohol) nonAlcoholValue += value;
  }
  const foodRatioMet = totalValue === 0 || nonAlcoholValue / totalValue >= 0.4;
  const hasAlcohol = params.orderItems.some((i) => i.isAlcohol);
  const checks = {
    restaurantLicensed: params.restaurantHasLicense && !!params.alcoholLicenseNumber,
    withinDeliveryWindow,
    foodRatioMet,
    sealedContainerRequired: true,
    ageVerificationRequired: hasAlcohol,
    driverBackgroundChecked: params.driverBackgroundChecked
  };
  const reasons = [];
  if (!checks.restaurantLicensed) reasons.push("Restaurant does not have a valid Florida alcohol license (FS 561.57)");
  if (!checks.withinDeliveryWindow) reasons.push("Alcohol delivery restricted to 8 AM - 10 PM per Florida law");
  if (!checks.foodRatioMet) reasons.push("Alcohol orders must be accompanied by food (40%+ non-alcohol value per FS 565.045)");
  if (hasAlcohol && !params.customerAgeVerified) reasons.push("Customer age verification required (21+ per FS 561.57)");
  if (!checks.driverBackgroundChecked) reasons.push("Driver must pass background check for alcohol deliveries");
  const eligible = reasons.length === 0;
  return { eligible, reasons, checks };
}
function getComplianceRequirements() {
  return {
    statutes: {
      "FS 561.57": "Florida Statute governing deliveries by licensed vendors or contractors",
      "FS 565.045": "Sealed containers with food orders (40%+ non-alcohol value)",
      "SB 676": "Third-party platform rules: consent, transparency, agreements"
    },
    rules: {
      deliveryWindow: { start: "08:00", end: "22:00", timezone: "America/New_York" },
      minimumFoodRatio: 0.4,
      minimumAge: 21,
      sealedContainers: true,
      backgroundCheckRequired: true,
      retentionYears: 7
    },
    platformRole: "Marketplace provider (not direct seller) \u2014 registered with FL Dept of Revenue (Form DR-1)",
    partnerRequirements: [
      "Only list licensed vendors (verify via FL DBPR)",
      "Require written consent per SB 676",
      "Disclose all fees transparently",
      "Provide contact methods and review responses",
      "No breweries/distilleries as delivery partners"
    ],
    driverRequirements: [
      "Valid driver's license",
      "Background check passed",
      "Training on age verification procedures",
      "Independent contractor status",
      "Own vehicle, insurance, and expenses"
    ]
  };
}

// server/services/cache.ts
var REDIS_URL = process.env.REDIS_URL;
var redisClient = null;
var useMemoryFallback = true;
var memoryCache = /* @__PURE__ */ new Map();
var MEMORY_CACHE_MAX_SIZE = 500;
async function initCache() {
  if (!REDIS_URL) {
    console.log("[Cache] No REDIS_URL configured \u2014 using in-memory cache fallback");
    useMemoryFallback = true;
    return true;
  }
  try {
    const { default: Redis } = await import("ioredis");
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 200, 2e3);
      },
      connectTimeout: 5e3,
      lazyConnect: true
    });
    await redisClient.connect();
    redisClient.on("error", (err) => {
      reportError(err, { service: "cache", action: "redis_error" });
    });
    useMemoryFallback = false;
    console.log("[Cache] Redis connected successfully");
    return true;
  } catch (error) {
    console.log("[Cache] Redis unavailable, using in-memory fallback:", error.message);
    useMemoryFallback = true;
    return true;
  }
}
function cleanMemoryCache() {
  const now = Date.now();
  for (const [key, entry] of memoryCache) {
    if (entry.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
  if (memoryCache.size > MEMORY_CACHE_MAX_SIZE) {
    const entries = [...memoryCache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = entries.slice(0, Math.floor(MEMORY_CACHE_MAX_SIZE * 0.3));
    toRemove.forEach(([key]) => memoryCache.delete(key));
  }
}
async function cacheGet(key) {
  try {
    if (useMemoryFallback) {
      const entry = memoryCache.get(key);
      if (!entry) return null;
      if (entry.expiresAt <= Date.now()) {
        memoryCache.delete(key);
        return null;
      }
      return entry.value;
    }
    return await redisClient.get(key);
  } catch (error) {
    reportError(error, { service: "cache", action: "get", key });
    return null;
  }
}
async function cacheSet(key, value, ttlSeconds = 3600) {
  try {
    if (useMemoryFallback) {
      cleanMemoryCache();
      memoryCache.set(key, {
        value,
        expiresAt: Date.now() + ttlSeconds * 1e3
      });
      return;
    }
    await redisClient.set(key, value, "EX", ttlSeconds);
  } catch (error) {
    reportError(error, { service: "cache", action: "set", key });
  }
}
async function cacheDel(key) {
  try {
    if (useMemoryFallback) {
      memoryCache.delete(key);
      return;
    }
    await redisClient.del(key);
  } catch (error) {
    reportError(error, { service: "cache", action: "del", key });
  }
}
async function getCachedMenu(restaurantId, fetcher) {
  const key = `menu:${restaurantId}`;
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached);
  const data = await fetcher();
  await cacheSet(key, JSON.stringify(data), 1800);
  return data;
}
async function getCachedRestaurants(fetcher) {
  const key = "restaurants:all";
  const cached = await cacheGet(key);
  if (cached) return JSON.parse(cached);
  const data = await fetcher();
  await cacheSet(key, JSON.stringify(data), 600);
  return data;
}
async function invalidateMenuCache(restaurantId) {
  await cacheDel(`menu:${restaurantId}`);
}
async function invalidateRestaurantsCache() {
  await cacheDel("restaurants:all");
}
function getCacheStats() {
  if (useMemoryFallback) {
    return {
      type: "memory",
      connected: true,
      memoryEntries: memoryCache.size
    };
  }
  return {
    type: "redis",
    connected: redisClient?.status === "ready"
  };
}

// server/services/cloud-storage.ts
var fs3 = __toESM(require("fs"));
var path3 = __toESM(require("path"));
var crypto3 = __toESM(require("crypto"));
var AWS_REGION = process.env.AWS_REGION || "us-east-1";
var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var S3_BUCKET = process.env.S3_BUCKET || "cryptoeats-uploads";
var isServerless3 = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
var LOCAL_UPLOAD_DIR = isServerless3 ? path3.resolve("/tmp", "uploads") : path3.resolve(process.cwd(), "uploads");
function isS3Configured() {
  return !!(AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY && S3_BUCKET);
}
var ALLOWED_MIME_TYPES2 = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  document: ["application/pdf", "image/jpeg", "image/png"]
};
var CATEGORY_CONFIG = {
  menu_image: { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES2.image },
  restaurant_logo: { maxSize: 5 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES2.image },
  restaurant_photos: { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES2.image },
  menu_items: { maxSize: 10 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES2.image },
  driver_documents: { maxSize: 10 * 1024 * 1024, allowedTypes: [...ALLOWED_MIME_TYPES2.image, ...ALLOWED_MIME_TYPES2.document] },
  id_verification: { maxSize: 10 * 1024 * 1024, allowedTypes: [...ALLOWED_MIME_TYPES2.image, ...ALLOWED_MIME_TYPES2.document] },
  profile_photos: { maxSize: 5 * 1024 * 1024, allowedTypes: ALLOWED_MIME_TYPES2.image }
};
function validateCloudUpload(fileSize, mimeType, category) {
  const config = CATEGORY_CONFIG[category];
  if (!config) return { valid: false, error: `Unknown upload category: ${category}. Allowed: ${Object.keys(CATEGORY_CONFIG).join(", ")}` };
  if (fileSize > config.maxSize) return { valid: false, error: `File too large. Max: ${config.maxSize / 1024 / 1024}MB` };
  if (!config.allowedTypes.includes(mimeType)) return { valid: false, error: `File type not allowed: ${mimeType}` };
  return { valid: true };
}
function mimeToExt(mimeType) {
  const map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf"
  };
  return map[mimeType] || ".bin";
}
async function getPresignedUploadUrl(fileName, mimeType, category) {
  const id = crypto3.randomUUID();
  const ext = path3.extname(fileName) || mimeToExt(mimeType);
  const fileKey = `${category}/${id}${ext}`;
  if (!isS3Configured()) {
    return {
      uploadUrl: `/api/uploads/${category}`,
      fileKey,
      storageType: "local"
    };
  }
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      ContentType: mimeType
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      uploadUrl: signedUrl,
      fileKey,
      storageType: "s3"
    };
  } catch (error) {
    reportError(error, { service: "cloud-storage", action: "getPresignedUploadUrl" });
    return {
      uploadUrl: `/api/uploads/${category}`,
      fileKey,
      storageType: "local"
    };
  }
}
async function getPresignedDownloadUrl(fileKey) {
  if (!isS3Configured()) {
    return {
      downloadUrl: `/uploads/${fileKey}`,
      storageType: "local"
    };
  }
  try {
    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return {
      downloadUrl: signedUrl,
      storageType: "s3"
    };
  } catch (error) {
    reportError(error, { service: "cloud-storage", action: "getPresignedDownloadUrl" });
    return {
      downloadUrl: `/uploads/${fileKey}`,
      storageType: "local"
    };
  }
}
async function uploadToCloud(fileBuffer, originalName, mimeType, category) {
  const id = crypto3.randomUUID();
  const ext = path3.extname(originalName) || mimeToExt(mimeType);
  const fileKey = `${category}/${id}${ext}`;
  if (!isS3Configured()) {
    const dir = path3.join(LOCAL_UPLOAD_DIR, category);
    if (!fs3.existsSync(dir)) {
      fs3.mkdirSync(dir, { recursive: true });
    }
    const filename = `${id}${ext}`;
    fs3.writeFileSync(path3.join(dir, filename), fileBuffer);
    return {
      id,
      fileKey,
      originalName,
      mimeType,
      size: fileBuffer.length,
      url: `/uploads/${category}/${filename}`,
      category,
      storageType: "local"
    };
  }
  try {
    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });
    await s3Client.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey,
      Body: fileBuffer,
      ContentType: mimeType
    }));
    return {
      id,
      fileKey,
      originalName,
      mimeType,
      size: fileBuffer.length,
      url: `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${fileKey}`,
      category,
      storageType: "s3"
    };
  } catch (error) {
    reportError(error, { service: "cloud-storage", action: "uploadToCloud" });
    const dir = path3.join(LOCAL_UPLOAD_DIR, category);
    if (!fs3.existsSync(dir)) {
      fs3.mkdirSync(dir, { recursive: true });
    }
    const filename = `${id}${ext}`;
    fs3.writeFileSync(path3.join(dir, filename), fileBuffer);
    return {
      id,
      fileKey,
      originalName,
      mimeType,
      size: fileBuffer.length,
      url: `/uploads/${category}/${filename}`,
      category,
      storageType: "local"
    };
  }
}
async function deleteFromCloud(fileKey) {
  if (!isS3Configured()) {
    const filePath = path3.join(LOCAL_UPLOAD_DIR, fileKey);
    if (fs3.existsSync(filePath)) {
      fs3.unlinkSync(filePath);
      return true;
    }
    return false;
  }
  try {
    const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const s3Client = new S3Client({
      region: AWS_REGION,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY
      }
    });
    await s3Client.send(new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: fileKey
    }));
    return true;
  } catch (error) {
    reportError(error, { service: "cloud-storage", action: "deleteFromCloud", fileKey });
    return false;
  }
}
function getCloudStorageStatus() {
  if (isS3Configured()) {
    return {
      configured: true,
      provider: "aws-s3",
      bucket: S3_BUCKET,
      region: AWS_REGION
    };
  }
  return {
    configured: false,
    provider: "local"
  };
}

// server/routes.ts
var isServerless4 = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME;
var JWT_SECRET = process.env.SESSION_SECRET || "cryptoeats-secret-key";
function getParam(val) {
  return Array.isArray(val) ? val[0] : val;
}
function generateToken(user) {
  return import_jsonwebtoken.default.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization required" });
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = import_jsonwebtoken.default.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
var authLimiter = (0, import_express_rate_limit.default)({
  windowMs: 15 * 60 * 1e3,
  max: 20,
  message: { message: "Too many requests, please try again later" }
});
var upload = (0, import_multer.default)({ storage: import_multer.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
async function registerRoutes(app2) {
  if (!isServerless4) {
    await seedDatabase();
  }
  await initCache();
  app2.post("/api/auth/register", authLimiter, async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already registered" });
      }
      const passwordHash = await import_bcryptjs.default.hash(data.password, 10);
      const user = await storage.createUser({ email: data.email, passwordHash, phone: data.phone, role: data.role });
      if (data.role === "driver") {
        await storage.createDriver({ userId: user.id, firstName: data.firstName, lastName: data.lastName });
        await storage.createOnboardingApplication({ userId: user.id, role: "driver" });
      } else if (data.role === "restaurant") {
        await storage.createOnboardingApplication({ userId: user.id, role: "restaurant" });
      } else {
        await storage.createCustomer({ userId: user.id, firstName: data.firstName, lastName: data.lastName });
      }
      const walletPlaceholder = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
      await storage.createWallet({
        userId: user.id,
        walletAddress: walletPlaceholder,
        walletType: "embedded",
        chainId: 8453
      });
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      res.status(201).json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
      res.status(400).json({ message: err.message || "Registration failed" });
    }
  });
  app2.post("/api/auth/login", authLimiter, async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const valid = await import_bcryptjs.default.compare(data.password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = generateToken({ id: user.id, email: user.email, role: user.role });
      res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
      res.status(400).json({ message: err.message || "Login failed" });
    }
  });
  app2.post("/api/auth/refresh-token", authMiddleware, async (req, res) => {
    try {
      const token = generateToken(req.user);
      res.json({ token, user: req.user });
    } catch (err) {
      res.status(400).json({ message: "Token refresh failed" });
    }
  });
  app2.get("/api/onboarding/status", authMiddleware, async (req, res) => {
    try {
      const onboarding = await storage.getOnboardingByUserId(req.user.id);
      if (!onboarding) {
        return res.json({ status: "none", message: "No onboarding application found" });
      }
      res.json(onboarding);
    } catch (err) {
      res.status(500).json({ message: err.message || "Failed to fetch onboarding status" });
    }
  });
  app2.post("/api/onboarding/merchant", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "restaurant") {
        return res.status(403).json({ message: "Only restaurant accounts can complete merchant onboarding" });
      }
      const data = merchantOnboardingSchema.parse(req.body);
      let onboarding = await storage.getOnboardingByUserId(req.user.id);
      if (!onboarding) {
        onboarding = await storage.createOnboardingApplication({ userId: req.user.id, role: "restaurant" });
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
        agreementSignedAt: data.agreementSigned ? /* @__PURE__ */ new Date() : null,
        status: "pending_review",
        step: 3
      });
      if (data.agreementSigned) {
        await storage.createAgreement({
          entityType: "restaurant",
          entityId: req.user.id,
          agreementType: "merchant_onboarding",
          agreementText: "CryptoEats Merchant Partner Agreement \u2014 I agree to the terms of service, SB 676 compliance requirements, and platform fee structure.",
          signatureData: `digital-signature-${req.user.email}-${Date.now()}`,
          ipAddress: req.ip || "unknown"
        });
      }
      res.json({ message: "Merchant onboarding submitted for review", application: updated });
    } catch (err) {
      res.status(400).json({ message: err.message || "Merchant onboarding failed" });
    }
  });
  app2.post("/api/onboarding/driver", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "driver") {
        return res.status(403).json({ message: "Only driver accounts can complete driver onboarding" });
      }
      const data = driverOnboardingSchema.parse(req.body);
      let onboarding = await storage.getOnboardingByUserId(req.user.id);
      if (!onboarding) {
        onboarding = await storage.createOnboardingApplication({ userId: req.user.id, role: "driver" });
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
        agreementSignedAt: data.agreementSigned ? /* @__PURE__ */ new Date() : null,
        status: "pending_review",
        step: 4
      });
      const driverRecords = await storage.getDriverByUserId(req.user.id);
      if (driverRecords) {
        await storage.updateDriver(driverRecords.id, {
          licenseNumber: data.licenseNumber,
          vehicleInfo: `${data.vehicleYear} ${data.vehicleMake} ${data.vehicleModel} (${data.vehicleColor})`,
          insuranceData: {
            policyNumber: data.insurancePolicyNumber,
            expiryDate: data.insuranceExpiry,
            provider: data.insuranceProvider
          }
        });
      }
      if (data.agreementSigned) {
        await storage.createAgreement({
          entityType: "driver",
          entityId: req.user.id,
          agreementType: "independent_contractor",
          agreementText: "CryptoEats Independent Contractor Agreement \u2014 I acknowledge independent contractor status, agree to the Human-First policy, and consent to background check processing.",
          signatureData: `digital-signature-${req.user.email}-${Date.now()}`,
          ipAddress: req.ip || "unknown"
        });
      }
      res.json({ message: "Driver onboarding submitted for review", application: updated });
    } catch (err) {
      res.status(400).json({ message: err.message || "Driver onboarding failed" });
    }
  });
  app2.put("/api/onboarding/step", authMiddleware, async (req, res) => {
    try {
      const { step } = req.body;
      const onboarding = await storage.getOnboardingByUserId(req.user.id);
      if (!onboarding) {
        return res.status(404).json({ message: "No onboarding application found" });
      }
      const updated = await storage.updateOnboarding(onboarding.id, {
        step,
        status: "in_progress"
      });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to update step" });
    }
  });
  app2.get("/api/admin/onboarding", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const applications = await storage.getAllOnboardings();
      res.json(applications);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch onboarding applications" });
    }
  });
  app2.get("/api/admin/onboarding/pending", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const applications = await storage.getPendingOnboardings();
      res.json(applications);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch pending applications" });
    }
  });
  app2.put("/api/admin/onboarding/:id/review", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const id = req.params.id;
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
        reviewedBy: req.user.id,
        reviewedAt: /* @__PURE__ */ new Date()
      });
      if (status === "approved" && onboarding.role === "restaurant" && onboarding.businessName) {
        const newRestaurant = await storage.createRestaurant({
          userId: onboarding.userId,
          name: onboarding.businessName,
          cuisineType: onboarding.cuisineType || "General",
          address: onboarding.businessAddress || "",
          phone: onboarding.businessPhone || "",
          alcoholLicense: onboarding.hasAlcoholLicense || false,
          operatingHours: onboarding.operatingHoursData || { open: "09:00", close: "22:00", days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
          isApproved: true,
          agreementSignedDate: onboarding.agreementSignedAt
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
            details: licenseResult.details
          });
          await storage.createComplianceLog({
            type: "license_verification",
            entityId: newRestaurant.id,
            details: {
              action: "restaurant_license_auto_verified",
              licenseNumber: onboarding.alcoholLicenseNumber,
              method: licenseResult.method,
              valid: licenseResult.valid
            },
            status: licenseResult.valid ? "approved" : "pending"
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
        status
      });
      res.json({ message: `Application ${status}`, application: updated });
    } catch (err) {
      res.status(500).json({ message: err.message || "Review failed" });
    }
  });
  app2.get("/api/restaurants", async (req, res) => {
    try {
      const { cuisine, search, featured } = req.query;
      const filters = {};
      if (cuisine) filters.cuisine = cuisine;
      if (search) filters.search = search;
      if (featured !== void 0) filters.featured = featured === "true";
      const hasFilters = cuisine || search || featured !== void 0;
      if (hasFilters) {
        const results2 = await storage.getAllRestaurants(filters);
        return res.json(results2);
      }
      const results = await getCachedRestaurants(() => storage.getAllRestaurants(filters));
      res.json(results);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/restaurants/:id/menu", async (req, res) => {
    try {
      const restaurantId = getParam(req.params.id);
      const items = await getCachedMenu(restaurantId, () => storage.getMenuItems(restaurantId));
      res.json(items);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/orders", authMiddleware, async (req, res) => {
    try {
      const data = createOrderSchema.parse(req.body);
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) return res.status(404).json({ message: "Customer profile not found" });
      const hasAlcohol = data.items.some((item) => item.isAlcohol);
      if (hasAlcohol) {
        if (!data.ageVerified) {
          return res.status(400).json({ message: "Age verification required for alcohol orders" });
        }
        const windows = await storage.getDeliveryWindows();
        const activeWindow = windows.find((w) => w.isActive);
        if (activeWindow && !storage.isAlcoholDeliveryAllowed(activeWindow.alcoholStartHour, activeWindow.alcoholEndHour)) {
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
        eta: restaurant?.estimatedPrepTime || "25-35 min"
      });
      await storage.createTaxTransaction({
        orderId: order.id,
        subtotal: subtotal.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        taxableAmount: tax.taxableAmount.toFixed(2),
        taxRate: tax.taxRate.toFixed(4),
        taxCollected: tax.taxAmount.toFixed(2),
        paymentMethod: data.paymentMethod
      });
      res.status(201).json(order);
    } catch (err) {
      res.status(400).json({ message: err.message || "Order creation failed" });
    }
  });
  app2.get("/api/orders", authMiddleware, async (req, res) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) return res.status(404).json({ message: "Customer profile not found" });
      const orders2 = await storage.getOrdersByCustomerId(customer.id);
      res.json(orders2);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/orders/:id", authMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrderById(getParam(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/orders/:id/rate", authMiddleware, async (req, res) => {
    try {
      const data = rateOrderSchema.parse(req.body);
      const order = await storage.getOrderById(getParam(req.params.id));
      if (!order) return res.status(404).json({ message: "Order not found" });
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const review = await storage.createReview({
        orderId: order.id,
        customerId: customer.id,
        restaurantId: order.restaurantId,
        driverId: order.driverId,
        restaurantRating: data.restaurantRating,
        driverRating: data.driverRating,
        comment: data.comment
      });
      res.status(201).json(review);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.get("/api/recommendations", authMiddleware, async (req, res) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user.id);
      const preferences = customer?.tastePreferences || [];
      const restaurants_list = await storage.getAllRestaurants({ featured: true });
      const recommendations = restaurants_list.slice(0, 5).map((r) => ({
        restaurant: r,
        reason: preferences.length > 0 ? `Based on your love of ${preferences[0]} cuisine` : `Top rated ${r.cuisineType} restaurant`,
        pairingSuggestion: `Try their signature dishes with a craft beverage`
      }));
      res.json({ recommendations, sommelierNote: "Curated picks for your palate" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/id-verification", authMiddleware, async (req, res) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const verification = await storage.createIdVerification({
        customerId: customer.id,
        orderId: req.body.orderId || null,
        scanData: req.body.scanData || null,
        verified: req.body.verified || false,
        method: req.body.method || "checkout"
      });
      res.status(201).json(verification);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/customers/favorites/restaurant/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.toggleFavoriteRestaurant(req.user.id, getParam(req.params.id));
      if (!updated) return res.status(404).json({ message: "Customer not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/customers/favorites/item/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.toggleFavoriteItem(req.user.id, getParam(req.params.id));
      if (!updated) return res.status(404).json({ message: "Customer not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/customers/profile", authMiddleware, async (req, res) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      res.json(customer);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.put("/api/customers/profile", authMiddleware, async (req, res) => {
    try {
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (!customer) return res.status(404).json({ message: "Customer not found" });
      const updated = await storage.updateCustomer(customer.id, req.body);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/driver/available-orders", authMiddleware, async (req, res) => {
    try {
      const orders2 = await storage.getPendingOrders();
      res.json(orders2);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/driver/orders/:id/accept", authMiddleware, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const order = await storage.assignDriver(getParam(req.params.id), driver.id);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.put("/api/driver/orders/:id/status", authMiddleware, async (req, res) => {
    try {
      const { status } = req.body;
      const extra = {};
      if (status === "delivered") extra.deliveredAt = /* @__PURE__ */ new Date();
      const order = await storage.updateOrderStatus(getParam(req.params.id), status, extra);
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/driver/orders/:id/verify-age", authMiddleware, async (req, res) => {
    try {
      const order = await storage.updateOrderStatus(getParam(req.params.id), void 0, {
        ageVerifiedAtDelivery: true,
        signatureData: req.body.signatureData || null
      });
      if (!order) return res.status(404).json({ message: "Order not found" });
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/driver/earnings", authMiddleware, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const earnings = await storage.getDriverEarnings(driver.id);
      res.json(earnings);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/driver/status", authMiddleware, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const status = await storage.getDriverStatus(driver.id);
      res.json({ driver, status: status || { status: "active", engagementTier: "active" } });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/driver/support", authMiddleware, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const log = await storage.createDriverSupportLog({
        driverId: driver.id,
        interactionType: req.body.interactionType || "appeal",
        notes: req.body.notes,
        outcome: req.body.outcome || "pending",
        supportRep: req.body.supportRep || null
      });
      res.status(201).json(log);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.put("/api/driver/break", authMiddleware, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const status = await storage.updateDriverStatus(driver.id, {
        status: req.body.onBreak ? "on_break" : "active",
        engagementTier: req.body.onBreak ? "on_break" : "active"
      });
      res.json(status);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.put("/api/driver/location", authMiddleware, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const updated = await storage.updateDriverLocation(driver.id, req.body.lat, req.body.lng);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.put("/api/driver/availability", authMiddleware, async (req, res) => {
    try {
      const driver = await storage.getDriverByUserId(req.user.id);
      if (!driver) return res.status(404).json({ message: "Driver profile not found" });
      const updated = await storage.updateDriverAvailability(driver.id, req.body.isAvailable);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/payments/stripe/create-intent", authMiddleware, async (req, res) => {
    res.json({
      clientSecret: `pi_stub_${Date.now()}_secret`,
      paymentIntentId: `pi_stub_${Date.now()}`,
      amount: req.body.amount,
      currency: "usd"
    });
  });
  app2.post("/api/payments/cashapp/create", authMiddleware, async (req, res) => {
    res.json({
      paymentId: `cashapp_${Date.now()}`,
      status: "pending",
      amount: req.body.amount,
      redirectUrl: "https://cash.app/pay"
    });
  });
  app2.post("/api/payments/coinbase/create-charge", authMiddleware, async (req, res) => {
    res.json({
      chargeId: `crypto_${Date.now()}`,
      status: "pending",
      amount: req.body.amount,
      currency: req.body.currency || "BTC",
      paymentUri: "bitcoin:stub-address",
      expiresAt: new Date(Date.now() + 36e5).toISOString()
    });
  });
  app2.post("/api/tax/calculate", async (req, res) => {
    try {
      const { subtotal, rate } = req.body;
      const result = storage.calculateTax(parseFloat(subtotal), rate ? parseFloat(rate) : void 0);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.get("/api/tax/jurisdictions", async (_req, res) => {
    try {
      const jurisdictions = await storage.getJurisdictions();
      res.json(jurisdictions);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/tax/reports", async (_req, res) => {
    try {
      const summary = await storage.getTaxSummary();
      res.json(summary);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/restaurants", async (_req, res) => {
    try {
      const list = await storage.getAllRestaurants();
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.put("/api/admin/restaurants/:id/approve", async (req, res) => {
    try {
      const updated = await storage.updateRestaurant(getParam(req.params.id), { isApproved: true });
      if (!updated) return res.status(404).json({ message: "Restaurant not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/drivers", async (_req, res) => {
    try {
      const list = await storage.getAllDrivers();
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.put("/api/admin/drivers/:id/approve", async (req, res) => {
    try {
      const updated = await storage.updateDriver(getParam(req.params.id), { backgroundCheckStatus: "approved" });
      if (!updated) return res.status(404).json({ message: "Driver not found" });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/orders", async (_req, res) => {
    try {
      const list = await storage.getAllOrders();
      res.json(list);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/tax/summary", async (_req, res) => {
    try {
      const summary = await storage.getTaxSummary();
      res.json(summary);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/admin/tax/file", async (req, res) => {
    try {
      const remittance = await storage.createRemittance({
        jurisdictionId: req.body.jurisdictionId || null,
        periodStart: new Date(req.body.periodStart || Date.now() - 30 * 864e5),
        periodEnd: new Date(req.body.periodEnd || Date.now()),
        totalCollected: req.body.totalCollected || "0",
        remittanceStatus: "filed",
        filedDate: /* @__PURE__ */ new Date()
      });
      res.status(201).json(remittance);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.get("/api/admin/compliance", async (_req, res) => {
    try {
      const logs = await storage.getComplianceLogs();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/legal/accept", authMiddleware, async (req, res) => {
    try {
      const { agreementType, version } = req.body;
      const validTypes = ["terms_of_service", "privacy_policy", "contractor_agreement", "restaurant_partner_agreement", "alcohol_delivery_consent"];
      if (!validTypes.includes(agreementType)) {
        return res.status(400).json({ message: `Invalid agreement type. Must be one of: ${validTypes.join(", ")}` });
      }
      const already = await storage.hasAcceptedAgreement(req.user.id, agreementType, version || "1.0");
      if (already) {
        return res.json({ message: "Agreement already accepted", alreadyAccepted: true });
      }
      const agreement = await storage.createLegalAgreement({
        userId: req.user.id,
        agreementType,
        version: version || "1.0",
        ipAddress: req.headers["x-forwarded-for"] || req.ip || "unknown",
        userAgent: req.headers["user-agent"] || "unknown"
      });
      await storage.createComplianceLog({
        type: "agreement",
        entityId: req.user.id,
        details: { action: "agreement_accepted", agreementType, version: version || "1.0" },
        status: "approved"
      });
      res.status(201).json({ message: "Agreement accepted", agreement });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/legal/status", authMiddleware, async (req, res) => {
    try {
      const agreements = await storage.getLegalAgreementsByUser(req.user.id);
      const accepted = {};
      for (const a of agreements) {
        if (!accepted[a.agreementType]) {
          accepted[a.agreementType] = { version: a.version, acceptedAt: a.acceptedAt };
        }
      }
      const required = ["terms_of_service", "privacy_policy"];
      if (req.user.role === "driver") required.push("contractor_agreement");
      if (req.user.role === "restaurant") required.push("restaurant_partner_agreement");
      const missing = required.filter((t) => !accepted[t]);
      res.json({
        accepted,
        required,
        missing,
        compliant: missing.length === 0,
        totalAccepted: agreements.length
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/legal/agreements", authMiddleware, async (req, res) => {
    try {
      const agreements = await storage.getLegalAgreementsByUser(req.user.id);
      res.json(agreements);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/legal/agreements", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const agreements = await storage.getAllLegalAgreements();
      res.json(agreements);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/license/verify", authMiddleware, async (req, res) => {
    try {
      if (!["admin", "restaurant"].includes(req.user.role)) {
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
        details: result.details
      });
      await storage.createComplianceLog({
        type: "license_verification",
        entityId: restaurantId || onboardingId || req.user.id,
        details: {
          action: "license_verified",
          licenseNumber,
          method: result.method,
          valid: result.valid,
          status: result.status
        },
        status: result.valid ? "approved" : "pending"
      });
      res.json({ verification, result });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/license/status/:restaurantId", authMiddleware, async (req, res) => {
    try {
      const restaurantId = getParam(req.params.restaurantId);
      const verifications = await storage.getLicenseVerificationsByRestaurant(restaurantId);
      const latest = verifications[0] || null;
      res.json({
        restaurantId,
        verified: latest?.status === "verified",
        latestVerification: latest,
        totalVerifications: verifications.length
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/licenses", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      const verifications = await storage.getAllLicenseVerifications();
      res.json(verifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/compliance/alcohol-check", authMiddleware, async (req, res) => {
    try {
      const { restaurantId, items, deliveryTime } = req.body;
      if (!restaurantId || !items || !Array.isArray(items)) {
        return res.status(400).json({ message: "restaurantId and items array are required" });
      }
      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }
      const customer = await storage.getCustomerByUserId(req.user.id);
      const customerAgeVerified = customer?.idVerified || false;
      const result = checkAlcoholDeliveryCompliance({
        restaurantHasLicense: restaurant.alcoholLicense || false,
        alcoholLicenseNumber: void 0,
        orderItems: items,
        deliveryTime: deliveryTime ? new Date(deliveryTime) : void 0,
        customerAgeVerified,
        driverBackgroundChecked: true
      });
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/compliance/requirements", (_req, res) => {
    res.json(getComplianceRequirements());
  });
  app2.get("/api/compliance/pci-status", (_req, res) => {
    res.json({
      compliant: true,
      level: "SAQ-A",
      provider: "Stripe",
      stripeConfigured: isStripeConfigured(),
      details: {
        cardDataHandling: "Stripe Elements/Checkout \u2014 card data goes directly to Stripe, never touches our servers",
        certification: "Stripe is PCI DSS Level 1 certified (highest level)",
        scope: "SAQ-A (Self-Assessment Questionnaire A) \u2014 simplest form for merchants using hosted payment pages",
        requirements: [
          "No raw card data stored, processed, or transmitted on our servers",
          "TLS/HTTPS encryption for all connections",
          "Access controls and role-based permissions",
          "Security monitoring via Sentry",
          "Adaptive rate limiting and request fingerprinting",
          "Regular security audits and vulnerability scanning"
        ],
        annualValidation: "SAQ-A submitted annually via Stripe Dashboard PCI wizard"
      }
    });
  });
  app2.get("/api/services/status", (_req, res) => {
    try {
      res.json({
        payments: {
          stripe: isStripeConfigured(),
          crypto: true,
          escrow: true,
          multiProvider: true,
          providers: getPaymentRouter().getProviderStatus()
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
          contractorAgreement: "/legal/contractor"
        },
        pciCompliance: { level: "SAQ-A", provider: "Stripe", configured: isStripeConfigured() },
        blockchain: {
          network: "mainnet",
          nftContract: MARKETPLACE_NFT_ADDRESS,
          escrowContract: MARKETPLACE_ESCROW_ADDRESS
        }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.put("/api/admin/delivery-windows", async (req, res) => {
    try {
      const { id, ...data } = req.body;
      if (!id) return res.status(400).json({ message: "Window ID required" });
      const updated = await storage.updateDeliveryWindow(id, data);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/drivers/status", async (_req, res) => {
    try {
      const statuses = await storage.getAllDriverStatuses();
      res.json(statuses);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/chat/:orderId", authMiddleware, async (req, res) => {
    try {
      const messages2 = await storage.getChatMessages(getParam(req.params.orderId));
      res.json(messages2);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/chat/:orderId", authMiddleware, async (req, res) => {
    try {
      const message = await storage.createChatMessage({
        orderId: getParam(req.params.orderId),
        senderId: req.user.id,
        message: req.body.message,
        type: req.body.type || "text"
      });
      res.status(201).json(message);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/wallet/connect", authMiddleware, async (req, res) => {
    try {
      const { walletAddress, walletType, chainId } = req.body;
      if (!walletAddress) return res.status(400).json({ message: "walletAddress is required" });
      const existing = await storage.getWalletByAddress(walletAddress);
      if (existing) {
        return res.json(existing);
      }
      const wallet = await storage.createWallet({
        userId: req.user.id,
        walletAddress,
        walletType: walletType || "coinbase",
        chainId: chainId || 8453
      });
      res.status(201).json(wallet);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to connect wallet" });
    }
  });
  app2.get("/api/wallet/balance/:address", async (req, res) => {
    try {
      const address = getParam(req.params.address);
      const [usdc, eth] = await Promise.all([
        getUSDCBalance(address),
        getBaseBalance(address)
      ]);
      res.json({ usdc, eth, chainId: BASE_CHAIN_ID });
    } catch (err) {
      res.status(500).json({ message: err.message || "Failed to get balance" });
    }
  });
  app2.get("/api/wallet/me", authMiddleware, async (req, res) => {
    try {
      const wallets2 = await storage.getWalletsByUserId(req.user.id);
      res.json(wallets2);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/escrow/prepare", authMiddleware, async (req, res) => {
    try {
      const { orderId, sellerAddress, amount, timeout } = req.body;
      if (!orderId || !sellerAddress || !amount) {
        return res.status(400).json({ message: "orderId, sellerAddress, and amount are required" });
      }
      const txData = prepareEscrowDeposit(orderId, sellerAddress, amount.toString(), timeout || 86400);
      res.json({
        ...txData,
        message: txData.gasSponsored ? "Gas fees are sponsored by Base Paymaster. No ETH needed." : "This transaction requires ETH for gas fees."
      });
    } catch (err) {
      const classified = err.paymasterError || classifyPaymasterError(err);
      res.status(400).json({
        message: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
        suggestion: classified.suggestion
      });
    }
  });
  app2.post("/api/escrow/confirm", authMiddleware, async (req, res) => {
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
        chainId: BASE_CHAIN_ID
      });
      res.status(201).json(escrow);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to confirm escrow" });
    }
  });
  app2.post("/api/escrow/release", authMiddleware, async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const escrow = await storage.getEscrowByOrderId(orderId);
      if (!escrow) return res.status(404).json({ message: "Escrow not found for this order" });
      const updated = await storage.updateEscrowStatus(escrow.id, "released", { releasedAt: /* @__PURE__ */ new Date() });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to release escrow" });
    }
  });
  app2.get("/api/escrow/order/:orderId", authMiddleware, async (req, res) => {
    try {
      const escrow = await storage.getEscrowByOrderId(getParam(req.params.orderId));
      res.json(escrow || null);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/escrow/history", authMiddleware, async (req, res) => {
    try {
      const transactions = await storage.getEscrowTransactions(req.user.id);
      res.json(transactions);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/nft/my", authMiddleware, async (req, res) => {
    try {
      const nfts = await storage.getNftsByUserId(req.user.id);
      res.json(nfts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/nft/milestones", authMiddleware, async (req, res) => {
    try {
      const customerMilestones = [
        { count: 10, name: "Foodie Explorer", type: "customer" },
        { count: 25, name: "Crypto Connoisseur", type: "customer" },
        { count: 50, name: "Diamond Diner", type: "customer" },
        { count: 100, name: "CryptoEats Legend", type: "customer" }
      ];
      const driverMilestones = [
        { count: 10, name: "Rising Star", type: "driver" },
        { count: 50, name: "Road Warrior", type: "driver" },
        { count: 100, name: "Delivery Hero", type: "driver" },
        { count: 500, name: "Legendary Driver", type: "driver" }
      ];
      let orderCount = 0;
      let deliveryCount = 0;
      const customer = await storage.getCustomerByUserId(req.user.id);
      if (customer) {
        const customerOrders = await storage.getOrdersByCustomerId(customer.id);
        orderCount = customerOrders.filter((o) => o.status === "delivered").length;
      }
      const driver = await storage.getDriverByUserId(req.user.id);
      if (driver) {
        deliveryCount = driver.totalDeliveries || 0;
      }
      const existingNfts = await storage.getNftsByUserId(req.user.id);
      const earnedNames = existingNfts.map((n) => n.name);
      const allMilestones = [...customerMilestones, ...driverMilestones].map((m) => ({
        ...m,
        earned: earnedNames.includes(m.name),
        progress: m.type === "customer" ? Math.min(orderCount / m.count, 1) : Math.min(deliveryCount / m.count, 1)
      }));
      res.json({
        milestones: allMilestones,
        progress: { orders: orderCount, deliveries: deliveryCount }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/nft/mint", authMiddleware, async (req, res) => {
    try {
      const { nftRewardId } = req.body;
      if (!nftRewardId) return res.status(400).json({ message: "nftRewardId is required" });
      const nft = await storage.getNftsByUserId(req.user.id);
      const reward = nft.find((n) => n.id === nftRewardId);
      if (!reward) return res.status(404).json({ message: "NFT reward not found" });
      const userWallets = await storage.getWalletsByUserId(req.user.id);
      if (userWallets.length === 0) return res.status(400).json({ message: "No wallet connected" });
      const walletAddress = userWallets[0].walletAddress;
      const metadataUri = reward.metadataUri || `ipfs://cryptoeats/${reward.milestoneType}/${reward.name}`;
      const mintOrderId = `nft-mint-${nftRewardId}-${Date.now()}`;
      const txData = prepareNFTMint(mintOrderId, walletAddress, walletAddress, metadataUri);
      res.json(txData);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to prepare mint" });
    }
  });
  app2.post("/api/nft/confirm-mint", authMiddleware, async (req, res) => {
    try {
      const { nftRewardId, txHash, tokenId } = req.body;
      if (!nftRewardId || !txHash) return res.status(400).json({ message: "nftRewardId and txHash are required" });
      const verification = await verifyTransaction(txHash);
      const updated = await storage.updateNftStatus(nftRewardId, "minted", {
        txHash,
        tokenId: tokenId || null,
        contractAddress: MARKETPLACE_NFT_ADDRESS,
        mintedAt: /* @__PURE__ */ new Date(),
        chainId: BASE_CHAIN_ID
      });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to confirm mint" });
    }
  });
  app2.get("/api/nft/styles", async (_req, res) => {
    res.json(getStylePresets());
  });
  app2.post("/api/nft/generate-art", authMiddleware, async (req, res) => {
    try {
      const { category, name, description, dishName, cuisine, restaurantName, milestoneType, milestoneValue, driverName, style } = req.body;
      if (!category || !name) return res.status(400).json({ message: "category and name are required" });
      const validCategories = ["merchant_dish", "driver_avatar", "customer_loyalty", "marketplace_art"];
      if (!validCategories.includes(category)) return res.status(400).json({ message: "Invalid category" });
      const result = await generateNftArt({
        category,
        name,
        description,
        dishName,
        cuisine,
        restaurantName,
        milestoneType,
        milestoneValue,
        driverName,
        style
      });
      const nft = await storage.createNftReward({
        userId: req.user.id,
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
        dishName: dishName || null
      });
      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err) {
      console.error("[NFT AI] Generation error:", err);
      res.status(500).json({ message: err.message || "Failed to generate NFT art" });
    }
  });
  app2.post("/api/nft/merchant-dish", authMiddleware, async (req, res) => {
    try {
      const { dishName, cuisine, restaurantName, style } = req.body;
      if (!dishName) return res.status(400).json({ message: "dishName is required" });
      const result = await generateNftArt({
        category: "merchant_dish",
        name: dishName,
        dishName,
        cuisine,
        restaurantName,
        style
      });
      const nft = await storage.createNftReward({
        userId: req.user.id,
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
        dishName
      });
      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err) {
      console.error("[NFT AI] Merchant dish error:", err);
      res.status(500).json({ message: err.message || "Failed to generate dish NFT" });
    }
  });
  app2.post("/api/nft/driver-avatar", authMiddleware, async (req, res) => {
    try {
      const { driverName, style } = req.body;
      const result = await generateNftArt({
        category: "driver_avatar",
        name: driverName || "Delivery Driver",
        driverName,
        style
      });
      const nft = await storage.createNftReward({
        userId: req.user.id,
        name: `${driverName || "Driver"} Avatar NFT`,
        description: "AI-generated unique driver avatar NFT",
        imageUrl: result.imageUrl,
        milestoneType: "driver_avatar",
        milestoneValue: 0,
        status: "pending",
        nftCategory: "driver_avatar",
        aiGenerated: true,
        aiPrompt: result.prompt
      });
      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err) {
      console.error("[NFT AI] Driver avatar error:", err);
      res.status(500).json({ message: err.message || "Failed to generate driver avatar NFT" });
    }
  });
  app2.post("/api/nft/customer-loyalty", authMiddleware, async (req, res) => {
    try {
      const { name, description, milestoneType, milestoneValue, style } = req.body;
      if (!name) return res.status(400).json({ message: "name is required" });
      const result = await generateNftArt({
        category: "customer_loyalty",
        name,
        description,
        milestoneType: milestoneType || "customer",
        milestoneValue: milestoneValue || 0,
        style
      });
      const nft = await storage.createNftReward({
        userId: req.user.id,
        name,
        description: description || `Loyalty reward: ${name}`,
        imageUrl: result.imageUrl,
        milestoneType: milestoneType || "customer",
        milestoneValue: milestoneValue || 0,
        status: "pending",
        nftCategory: "customer_loyalty",
        aiGenerated: true,
        aiPrompt: result.prompt
      });
      res.status(201).json({ nft, imageUrl: result.imageUrl });
    } catch (err) {
      console.error("[NFT AI] Customer loyalty error:", err);
      res.status(500).json({ message: err.message || "Failed to generate loyalty NFT" });
    }
  });
  app2.post("/api/nft/regenerate-art", authMiddleware, async (req, res) => {
    try {
      const { nftId, style } = req.body;
      if (!nftId) return res.status(400).json({ message: "nftId is required" });
      const userNfts = await storage.getNftsByUserId(req.user.id);
      const nft = userNfts.find((n) => n.id === nftId);
      if (!nft) return res.status(404).json({ message: "NFT not found" });
      if (nft.status === "minted" || nft.status === "listed") {
        return res.status(400).json({ message: "Cannot regenerate art for minted/listed NFTs" });
      }
      const category = nft.nftCategory || nft.milestoneType || "marketplace_art";
      const result = await generateNftArt({
        category,
        name: nft.name,
        description: nft.description || void 0,
        dishName: nft.dishName || void 0,
        style
      });
      await storage.updateNftStatus(nftId, nft.status || "pending", {
        imageUrl: result.imageUrl
      });
      res.json({ imageUrl: result.imageUrl, prompt: result.prompt });
    } catch (err) {
      console.error("[NFT AI] Regenerate error:", err);
      res.status(500).json({ message: err.message || "Failed to regenerate NFT art" });
    }
  });
  app2.get("/api/marketplace/listings", async (_req, res) => {
    try {
      const listings = await storage.getActiveNftListings();
      const listingsWithNfts = await Promise.all(
        listings.map(async (listing) => {
          const nfts = await storage.getNftsByUserId(listing.sellerUserId);
          const nft = nfts.find((n) => n.id === listing.nftId);
          return { ...listing, nft: nft || null };
        })
      );
      res.json(listingsWithNfts);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/marketplace/list", authMiddleware, async (req, res) => {
    try {
      const { nftId, price, currency } = req.body;
      if (!nftId || !price) return res.status(400).json({ message: "nftId and price are required" });
      const userNfts = await storage.getNftsByUserId(req.user.id);
      const nft = userNfts.find((n) => n.id === nftId);
      if (!nft) return res.status(404).json({ message: "NFT not found or not owned by you" });
      if (nft.status !== "minted") return res.status(400).json({ message: "NFT must be minted before listing" });
      const listing = await storage.createNftListing({
        nftId,
        sellerUserId: req.user.id,
        price: price.toString(),
        currency: currency || "USDC",
        status: "active"
      });
      await storage.updateNftStatus(nftId, "listed", { listedPrice: price.toString() });
      res.status(201).json(listing);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to create listing" });
    }
  });
  app2.post("/api/marketplace/buy", authMiddleware, async (req, res) => {
    try {
      const { listingId, txHash } = req.body;
      if (!listingId || !txHash) return res.status(400).json({ message: "listingId and txHash are required" });
      const listing = await storage.getNftListingById(listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.status !== "active") return res.status(400).json({ message: "Listing is not active" });
      const verification = await verifyTransaction(txHash);
      const updated = await storage.updateNftListing(listingId, {
        buyerUserId: req.user.id,
        status: "sold",
        txHash,
        soldAt: /* @__PURE__ */ new Date()
      });
      await storage.updateNftStatus(listing.nftId, "sold");
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message || "Failed to buy NFT" });
    }
  });
  app2.delete("/api/marketplace/listing/:id", authMiddleware, async (req, res) => {
    try {
      const listingId = getParam(req.params.id);
      const listing = await storage.getNftListingById(listingId);
      if (!listing) return res.status(404).json({ message: "Listing not found" });
      if (listing.sellerUserId !== req.user.id) return res.status(403).json({ message: "Not authorized to cancel this listing" });
      await storage.updateNftListing(listingId, { status: "cancelled" });
      await storage.updateNftStatus(listing.nftId, "minted", { listedPrice: null });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/onramp/buy-options", authMiddleware, async (req, res) => {
    try {
      const country = req.query.country || "US";
      const subdivision = req.query.subdivision || "FL";
      res.json({
        paymentMethods: [
          { id: "CARD", name: "Credit/Debit Card", minAmount: 5, maxAmount: 5e3 },
          { id: "APPLE_PAY", name: "Apple Pay", minAmount: 1, maxAmount: 1e4 },
          { id: "GOOGLE_PAY", name: "Google Pay", minAmount: 1, maxAmount: 1e4 },
          { id: "PAYPAL", name: "PayPal", minAmount: 5, maxAmount: 2500 }
        ],
        purchaseCurrencies: [
          { code: "USDC", name: "USD Coin", network: "base", decimals: 6, minAmount: 1, contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
          { code: "ETH", name: "Ethereum", network: "base", decimals: 18, minAmount: 1e-3 },
          { code: "cbBTC", name: "Coinbase Wrapped BTC", network: "base", decimals: 8, minAmount: 1e-4 }
        ],
        country,
        subdivision
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/onramp/buy-quote", authMiddleware, async (req, res) => {
    try {
      const { purchaseCurrency, paymentAmount, paymentCurrency, paymentMethod, network } = req.body;
      if (!purchaseCurrency || !paymentAmount) {
        return res.status(400).json({ message: "purchaseCurrency and paymentAmount are required" });
      }
      const fiatAmount = parseFloat(paymentAmount);
      let rate = 1;
      let fee = 0;
      if (purchaseCurrency === "USDC") {
        fee = Math.max(0.99, fiatAmount * 0.015);
        rate = 1;
      } else if (purchaseCurrency === "ETH") {
        rate = 385e-6;
        fee = Math.max(0.99, fiatAmount * 0.02);
      } else if (purchaseCurrency === "cbBTC") {
        rate = 105e-7;
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
        expiresAt: new Date(Date.now() + 15 * 60 * 1e3).toISOString(),
        paymentMethod: paymentMethod || "CARD",
        gasless: purchaseCurrency === "USDC" && (network || "base") === "base"
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/onramp/initiate", authMiddleware, async (req, res) => {
    try {
      const { fiatAmount, cryptoCurrency, paymentMethod, walletAddress } = req.body;
      if (!fiatAmount || !walletAddress) {
        return res.status(400).json({ message: "fiatAmount and walletAddress are required" });
      }
      const tx = await storage.createOnrampTransaction({
        userId: req.user.id,
        walletAddress,
        fiatAmount: fiatAmount.toString(),
        cryptoCurrency: cryptoCurrency || "USDC",
        paymentMethod: paymentMethod || "CARD",
        network: "base",
        status: "pending"
      });
      const onrampUrl = `https://pay.coinbase.com/buy/select-asset?appId=CryptoEats&addresses={"${walletAddress}":["base"]}&assets=["USDC"]&presetFiatAmount=${fiatAmount}&fiatCurrency=USD`;
      res.status(201).json({ transaction: tx, onrampUrl });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/onramp/webhook", async (req, res) => {
    try {
      const { transactionId, status, cryptoAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const tx = await storage.getOnrampTransactionById(transactionId);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      const updateData = { status };
      if (cryptoAmount) updateData.cryptoAmount = cryptoAmount.toString();
      if (status === "completed") updateData.completedAt = /* @__PURE__ */ new Date();
      await storage.updateOnrampTransaction(transactionId, updateData);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/onramp/simulate-complete", authMiddleware, async (req, res) => {
    try {
      const { transactionId, cryptoAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const updated = await storage.updateOnrampTransaction(transactionId, {
        status: "completed",
        cryptoAmount: cryptoAmount?.toString() || "0",
        completedAt: /* @__PURE__ */ new Date(),
        coinbaseTransactionId: `cb_sim_${Date.now()}`
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/onramp/history", authMiddleware, async (req, res) => {
    try {
      const txs = await storage.getOnrampTransactionsByUser(req.user.id);
      res.json(txs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/offramp/sell-options", authMiddleware, async (req, res) => {
    try {
      res.json({
        cashoutMethods: [
          { id: "BANK_ACCOUNT", name: "Bank Account (ACH)", estimatedDays: "1-3 business days", minAmount: 5, maxAmount: 25e3 },
          { id: "INSTANT_BANK", name: "Instant Bank Transfer", estimatedDays: "Minutes", minAmount: 10, maxAmount: 5e3, fee: "1.5%" }
        ],
        sellCurrencies: [
          { code: "USDC", name: "USD Coin", network: "base", decimals: 6, minAmount: 1, contractAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" },
          { code: "ETH", name: "Ethereum", network: "base", decimals: 18, minAmount: 1e-3 }
        ],
        supportedFiat: ["USD"],
        limits: { daily: 25e3, weekly: 1e5, monthly: 25e4 }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/offramp/sell-quote", authMiddleware, async (req, res) => {
    try {
      const { sellCurrency, sellAmount, cashoutMethod } = req.body;
      if (!sellCurrency || !sellAmount) {
        return res.status(400).json({ message: "sellCurrency and sellAmount are required" });
      }
      const cryptoAmount = parseFloat(sellAmount);
      let rate = 1;
      let fee = 0;
      if (sellCurrency === "USDC") {
        rate = 1;
        fee = cashoutMethod === "INSTANT_BANK" ? Math.max(0.5, cryptoAmount * 0.015) : Math.max(0.25, cryptoAmount * 5e-3);
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
        expiresAt: new Date(Date.now() + 10 * 60 * 1e3).toISOString()
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/offramp/initiate", authMiddleware, async (req, res) => {
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
        userId: req.user.id,
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
        status: "pending"
      });
      const offrampUrl = `https://pay.coinbase.com/v3/sell/input?addresses={"${walletAddress}":["base"]}&defaultAsset=USDC&defaultNetwork=base&defaultCryptoAmount=${cryptoAmount}&partnerUserRef=${req.user.id}&redirectUrl=https://cryptoeats.net/cashout/success`;
      res.status(201).json({ transaction: tx, offrampUrl });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/offramp/webhook", async (req, res) => {
    try {
      const { transactionId, status, fiatAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const tx = await storage.getOfframpTransactionById(transactionId);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      const updateData = { status };
      if (fiatAmount) updateData.fiatAmount = fiatAmount.toString();
      if (status === "completed") updateData.completedAt = /* @__PURE__ */ new Date();
      await storage.updateOfframpTransaction(transactionId, updateData);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/offramp/simulate-complete", authMiddleware, async (req, res) => {
    try {
      const { transactionId, fiatAmount } = req.body;
      if (!transactionId) return res.status(400).json({ message: "transactionId is required" });
      const updated = await storage.updateOfframpTransaction(transactionId, {
        status: "completed",
        fiatAmount: fiatAmount?.toString() || "0",
        completedAt: /* @__PURE__ */ new Date(),
        coinbaseTransactionId: `cb_sell_${Date.now()}`
      });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/offramp/history", authMiddleware, async (req, res) => {
    try {
      const txs = await storage.getOfframpTransactionsByUser(req.user.id);
      res.json(txs);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/offramp/status/:id", authMiddleware, async (req, res) => {
    try {
      const tx = await storage.getOfframpTransactionById(req.params.id);
      if (!tx) return res.status(404).json({ message: "Transaction not found" });
      if (tx.userId !== req.user.id) return res.status(403).json({ message: "Unauthorized" });
      res.json(tx);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/push/register", authMiddleware, async (req, res) => {
    try {
      const { token, platform } = req.body;
      if (!token) return res.status(400).json({ message: "token is required" });
      const saved = await storage.savePushToken(req.user.id, token, platform);
      res.status(201).json(saved);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.delete("/api/push/unregister", authMiddleware, async (req, res) => {
    try {
      const { token } = req.body;
      if (!token) return res.status(400).json({ message: "token is required" });
      await storage.deactivatePushToken(token);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.get("/api/gasless/info", async (_req, res) => {
    const status = getPaymasterStatus();
    res.json({
      supported: true,
      ...status,
      description: "Gas fees are sponsored for USDC transfers on Base network. No ETH needed for transactions.",
      maxSponsoredAmount: "10000",
      currency: "USDC"
    });
  });
  app2.post("/api/chain/validate", async (req, res) => {
    const { chainId } = req.body;
    if (!chainId) return res.status(400).json({ message: "chainId is required" });
    const result = validateChainId(Number(chainId));
    res.json(result);
  });
  app2.get("/api/contracts/allowlist", async (_req, res) => {
    res.json({
      contracts: getAllowlistedContracts(),
      chainId: BASE_CHAIN_ID
    });
  });
  app2.get("/api/contracts/check/:address", async (req, res) => {
    const address = getParam(req.params.address);
    const info = getContractInfo(address);
    res.json({
      address,
      allowlisted: !!info,
      info: info || null,
      gasSponsored: isGasSponsored(address)
    });
  });
  app2.post("/api/gas/estimate", authMiddleware, async (req, res) => {
    try {
      const { from, to, data, value } = req.body;
      if (!from || !to || !data) return res.status(400).json({ message: "from, to, and data are required" });
      const result = await estimateGas(from, to, data, value);
      res.json(result);
    } catch (error) {
      const classified = classifyPaymasterError(error);
      res.status(500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
        suggestion: classified.suggestion
      });
    }
  });
  app2.get("/api/paymaster/status", async (_req, res) => {
    res.json(getPaymasterStatus());
  });
  app2.post("/api/escrow/release", authMiddleware, async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const txData = prepareEscrowRelease(orderId);
      res.json({
        ...txData,
        message: txData.gasSponsored ? "Transaction gas will be sponsored by Base Paymaster. No ETH needed." : "This transaction requires ETH for gas fees."
      });
    } catch (error) {
      const classified = error.paymasterError || classifyPaymasterError(error);
      res.status(classified.code === 402 ? 402 : 500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable,
        suggestion: classified.suggestion
      });
    }
  });
  app2.post("/api/escrow/dispute", authMiddleware, async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const txData = prepareEscrowDispute(orderId);
      res.json({
        ...txData,
        message: "Dispute transaction prepared. The escrow will be flagged for admin review."
      });
    } catch (error) {
      const classified = error.paymasterError || classifyPaymasterError(error);
      res.status(500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable
      });
    }
  });
  app2.post("/api/escrow/refund", authMiddleware, async (req, res) => {
    try {
      const { orderId } = req.body;
      if (!orderId) return res.status(400).json({ message: "orderId is required" });
      const txData = prepareAdminRefund(orderId);
      res.json({
        ...txData,
        message: "Admin refund transaction prepared. Funds will be returned to the buyer."
      });
    } catch (error) {
      const classified = error.paymasterError || classifyPaymasterError(error);
      res.status(500).json({
        error: classified.userMessage,
        code: classified.code,
        retryable: classified.retryable
      });
    }
  });
  app2.get("/api/escrow/status/:orderId", authMiddleware, async (req, res) => {
    try {
      const orderId = getParam(req.params.orderId);
      const details = await getEscrowDetails(orderId);
      if (!details) return res.status(404).json({ message: "Escrow not found for this order" });
      res.json(details);
    } catch (error) {
      res.status(500).json({ message: error.message || "Failed to get escrow status" });
    }
  });
  app2.get("/api/payments/status", (_req, res) => {
    const router = getPaymentRouter();
    res.json({
      stripe: isStripeConfigured(),
      sendgrid: isSendGridConfigured(),
      twilio: isTwilioConfigured(),
      providers: router.getProviderStatus(),
      routing: router.getRoutingConfig()
    });
  });
  app2.get("/api/payments/providers", (_req, res) => {
    const router = getPaymentRouter();
    res.json({
      providers: router.getProviderStatus(),
      routing: router.getRoutingConfig(),
      stats: router.getRoutingStats()
    });
  });
  app2.get("/api/payments/fee-comparison", (req, res) => {
    const amount = parseFloat(req.query.amount) || 30;
    const type = req.query.type || "online";
    const router = getPaymentRouter();
    res.json({
      amount,
      type,
      providers: router.getFeeComparison(amount, type)
    });
  });
  app2.post("/api/payments/create-intent", authMiddleware, async (req, res) => {
    try {
      const { amount, orderId, metadata, provider, type, isInternational } = req.body;
      if (!amount || !orderId) return res.status(400).json({ message: "amount and orderId are required" });
      const router = getPaymentRouter();
      const order = {
        id: orderId,
        amount,
        currency: "usd",
        isInternational: isInternational || false,
        type: type || "online",
        customerEmail: req.user.email,
        metadata
      };
      if (provider && ["stripe", "adyen", "godaddy", "square", "coinbase"].includes(provider)) {
        order.type = provider === "coinbase" ? "crypto" : order.type;
      }
      const result = await router.createPayment(order);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "payments/create-intent", userId: req.user?.id });
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/capture", authMiddleware, async (req, res) => {
    try {
      const { intentId, provider } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const providerKey = provider || "stripe";
      const router = getPaymentRouter();
      const result = await router.capturePayment(intentId, providerKey);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "payments/capture" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/cancel", authMiddleware, async (req, res) => {
    try {
      const { intentId, provider } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const providerKey = provider || "stripe";
      const router = getPaymentRouter();
      const result = await router.cancelPayment(intentId, providerKey);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "payments/cancel" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/refund", authMiddleware, async (req, res) => {
    try {
      const { intentId, amount, provider, reason } = req.body;
      if (!intentId) return res.status(400).json({ message: "intentId is required" });
      const providerKey = provider || "stripe";
      const router = getPaymentRouter();
      const result = await router.refundPayment(intentId, amount, providerKey, reason);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "payments/refund" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.get("/api/payments/:intentId", authMiddleware, async (req, res) => {
    try {
      const intentId = getParam(req.params.intentId);
      const provider = req.query.provider || "stripe";
      const router = getPaymentRouter();
      const result = await router.getStatus(intentId, provider);
      res.json(result);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/webhook", async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      if (!sig || !req.rawBody) return res.status(400).json({ message: "Missing signature" });
      const event = await constructWebhookEvent(req.rawBody, sig);
      console.log(`[Stripe Webhook] ${event.type}:`, event.data.object.id);
      if (event.type.startsWith("charge.dispute")) {
        const router = getPaymentRouter();
        const disputeResult = await router.handleDispute(event, "stripe");
        console.log(`[PaymentRouter] Dispute handled:`, disputeResult);
      }
      res.json({ received: true });
    } catch (err) {
      reportError(err, { route: "payments/webhook" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/webhook/adyen", async (req, res) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "adyen");
      console.log(`[Adyen Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err) {
      reportError(err, { route: "payments/webhook/adyen" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/webhook/square", async (req, res) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "square");
      console.log(`[Square Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err) {
      reportError(err, { route: "payments/webhook/square" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/webhook/godaddy", async (req, res) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "godaddy");
      console.log(`[GoDaddy Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err) {
      reportError(err, { route: "payments/webhook/godaddy" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/payments/webhook/coinbase", async (req, res) => {
    try {
      const router = getPaymentRouter();
      const result = await router.handleDispute(req.body, "coinbase");
      console.log(`[Coinbase Webhook]`, result);
      res.json({ received: true, ...result });
    } catch (err) {
      reportError(err, { route: "payments/webhook/coinbase" });
      res.status(400).json({ message: err.message });
    }
  });
  app2.put("/api/payments/routing-config", authMiddleware, async (req, res) => {
    try {
      if (req.user.role !== "admin") return res.status(403).json({ message: "Admin access required" });
      const router = getPaymentRouter();
      router.updateRoutingConfig(req.body);
      res.json({ message: "Routing config updated", config: router.getRoutingConfig() });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  });
  app2.post("/api/notifications/email", authMiddleware, async (req, res) => {
    try {
      const { to, subject, html } = req.body;
      if (!to || !subject || !html) return res.status(400).json({ message: "to, subject, and html are required" });
      const result = await sendEmail(to, subject, html);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "notifications/email" });
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/notifications/sms", authMiddleware, async (req, res) => {
    try {
      const { to, body } = req.body;
      if (!to || !body) return res.status(400).json({ message: "to and body are required" });
      const result = await sendSMS(to, body);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "notifications/sms" });
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/notifications/push", authMiddleware, async (req, res) => {
    try {
      const { tokens, title, body, data } = req.body;
      if (!tokens || !title || !body) return res.status(400).json({ message: "tokens, title, and body are required" });
      const result = await sendPushNotification(tokens, title, body, data);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "notifications/push" });
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/push-tokens", authMiddleware, async (req, res) => {
    try {
      const { token, platform } = req.body;
      if (!token) return res.status(400).json({ message: "token is required" });
      await storage.savePushToken(req.user.id, token, platform || "unknown");
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/uploads/categories", (_req, res) => {
    res.json(getUploadCategories());
  });
  app2.post("/api/uploads/:category", authMiddleware, upload.single("file"), async (req, res) => {
    try {
      const category = getParam(req.params.category);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });
      const validation = validateUpload(file.size, file.mimetype, category);
      if (!validation.valid) return res.status(400).json({ message: validation.error });
      const result = await saveUpload(file.buffer, file.originalname, file.mimetype, category);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "uploads", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/tracking/:orderId", authMiddleware, async (req, res) => {
    try {
      const orderId = getParam(req.params.orderId);
      const location = getOrderDriverLocation(orderId);
      if (!location) return res.json({ tracking: false, message: "Driver location not available yet" });
      res.json({ tracking: true, ...location });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/tracking/drivers/active", authMiddleware, async (_req, res) => {
    res.json({
      count: getActiveDriverCount(),
      drivers: getAllActiveDrivers()
    });
  });
  app2.post("/api/tracking/eta", authMiddleware, async (req, res) => {
    try {
      const { originLat, originLng, destLat, destLng } = req.body;
      if (!originLat || !originLng || !destLat || !destLng) {
        return res.status(400).json({ message: "Origin and destination coordinates required" });
      }
      const eta = await getDirectionsETA(originLat, originLng, destLat, destLng);
      res.json(eta);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/tracking/assign", authMiddleware, async (req, res) => {
    try {
      const { orderId, driverId } = req.body;
      if (!orderId || !driverId) return res.status(400).json({ message: "orderId and driverId required" });
      assignDriverToOrder(orderId, driverId);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/verify/start", authMiddleware, async (req, res) => {
    try {
      const { type } = req.body;
      if (!type || !["alcohol", "driver"].includes(type)) {
        return res.status(400).json({ message: "type must be 'alcohol' or 'driver'" });
      }
      const result = await startIdentityVerification(req.user.id, type);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "verify/start", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/verify/status", authMiddleware, async (req, res) => {
    try {
      const type = req.query.type || "alcohol";
      if (!["alcohol", "driver"].includes(type)) {
        return res.status(400).json({ message: "type must be 'alcohol' or 'driver'" });
      }
      const status = await getVerificationStatus(req.user.id, type);
      res.json(status);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/verify/alcohol-eligibility", authMiddleware, async (req, res) => {
    try {
      const eligibility = await checkAlcoholEligibility(req.user.id);
      res.json(eligibility);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/webhooks/persona", async (req, res) => {
    try {
      const { event, data } = req.body;
      const result = await handleVerificationWebhook(event, data);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "webhooks/persona" });
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/webhooks/checkr", async (req, res) => {
    try {
      const { type: event, data } = req.body;
      const result = await handleCheckrWebhook(event, data);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "webhooks/checkr" });
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/cloud/upload-url", authMiddleware, async (req, res) => {
    try {
      const { fileName, mimeType, category } = req.body;
      if (!fileName || !mimeType || !category) {
        return res.status(400).json({ message: "fileName, mimeType, and category are required" });
      }
      const validation = validateCloudUpload(0, mimeType, category);
      if (!validation.valid) return res.status(400).json({ message: validation.error });
      const result = await getPresignedUploadUrl(fileName, mimeType, category);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "cloud/upload-url", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/cloud/upload/:category", authMiddleware, upload.single("file"), async (req, res) => {
    try {
      const category = getParam(req.params.category);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "No file uploaded" });
      const validation = validateCloudUpload(file.size, file.mimetype, category);
      if (!validation.valid) return res.status(400).json({ message: validation.error });
      const result = await uploadToCloud(file.buffer, file.originalname, file.mimetype, category);
      res.json(result);
    } catch (err) {
      reportError(err, { route: "cloud/upload", userId: req.user?.id });
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/cloud/download-url", authMiddleware, async (req, res) => {
    try {
      const { fileKey } = req.query;
      if (!fileKey) return res.status(400).json({ message: "fileKey is required" });
      const result = await getPresignedDownloadUrl(fileKey);
      res.json(result);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.delete("/api/cloud/file", authMiddleware, async (req, res) => {
    try {
      const fileKey = req.query.fileKey;
      if (!fileKey) return res.status(400).json({ message: "fileKey query parameter is required" });
      const deleted = await deleteFromCloud(fileKey);
      res.json({ deleted });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/cache/stats", authMiddleware, async (_req, res) => {
    res.json(getCacheStats());
  });
  app2.get("/api/admin/stats", async (_req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      const allRestaurants = await storage.getAllRestaurants();
      const allDrivers = await storage.getAllDrivers();
      const taxSummary = await storage.getTaxSummary();
      const complianceLogs2 = await storage.getComplianceLogs();
      const totalRevenue = allOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const totalDeliveryFees = allOrders.reduce((sum, o) => sum + parseFloat(o.deliveryFee || "0"), 0);
      const totalTips = allOrders.reduce((sum, o) => sum + parseFloat(o.tip || "0"), 0);
      const avgOrderValue = allOrders.length > 0 ? totalRevenue / allOrders.length : 0;
      const ordersByStatus = {};
      allOrders.forEach((o) => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });
      const now = /* @__PURE__ */ new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = new Date(todayStart);
      weekStart.setDate(weekStart.getDate() - 7);
      const todayOrders = allOrders.filter((o) => new Date(o.createdAt) >= todayStart);
      const weekOrders = allOrders.filter((o) => new Date(o.createdAt) >= weekStart);
      const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const weekRevenue = weekOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const activeDrivers = allDrivers.filter((d) => d.isAvailable);
      const approvedRestaurants = allRestaurants.filter((r) => r.isApproved);
      const dailyOrders = {};
      allOrders.forEach((o) => {
        const day = new Date(o.createdAt).toISOString().split("T")[0];
        if (!dailyOrders[day]) dailyOrders[day] = { count: 0, revenue: 0 };
        dailyOrders[day].count++;
        dailyOrders[day].revenue += parseFloat(o.total || "0");
      });
      const pilotBudget = {
        total: 19745,
        driverGuarantees: { budget: 1e4, label: "Driver Guarantees" },
        customerPromos: { budget: 3e3, label: "Customer Promos" },
        merchantIncentives: { budget: 2e3, label: "Merchant Incentives" },
        marketing: { budget: 3e3, label: "Marketing" },
        operations: { budget: 1745, label: "Operations" },
        techHosting: { budget: 1e3, label: "Tech/Hosting" }
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
          weekRevenue: weekRevenue.toFixed(2)
        },
        ordersByStatus,
        restaurants: {
          total: allRestaurants.length,
          approved: approvedRestaurants.length,
          pending: allRestaurants.length - approvedRestaurants.length,
          cuisineBreakdown: allRestaurants.reduce((acc, r) => {
            acc[r.cuisineType] = (acc[r.cuisineType] || 0) + 1;
            return acc;
          }, {})
        },
        drivers: {
          total: allDrivers.length,
          active: activeDrivers.length,
          avgRating: allDrivers.length > 0 ? (allDrivers.reduce((s, d) => s + (d.rating || 0), 0) / allDrivers.length).toFixed(1) : "0",
          totalDeliveries: allDrivers.reduce((s, d) => s + (d.totalDeliveries || 0), 0)
        },
        tax: taxSummary,
        compliance: {
          total: complianceLogs2.length,
          recent: complianceLogs2.slice(0, 10)
        },
        dailyOrders,
        pilotBudget
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/restaurants", async (_req, res) => {
    try {
      const allRestaurants = await storage.getAllRestaurants();
      res.json(allRestaurants);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/drivers", async (_req, res) => {
    try {
      const allDrivers = await storage.getAllDrivers();
      res.json(allDrivers);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/admin/orders", async (_req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json(allOrders);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.get("/api/merchant/stats/:restaurantId", async (req, res) => {
    try {
      const restaurantId = getParam(req.params.restaurantId);
      const restaurant = await storage.getRestaurantById(restaurantId);
      if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
      const allOrders = await storage.getAllOrders();
      const restaurantOrders = allOrders.filter((o) => o.restaurantId === restaurantId);
      const menuItemsList = await storage.getMenuItems(restaurantId);
      const reviewsList = await storage.getReviewsByRestaurant(restaurantId);
      const totalRevenue = restaurantOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const avgOrderValue = restaurantOrders.length > 0 ? totalRevenue / restaurantOrders.length : 0;
      const deliveredOrders = restaurantOrders.filter((o) => o.status === "delivered");
      const avgRating = reviewsList.length > 0 ? reviewsList.reduce((s, r) => s + (r.restaurantRating || 0), 0) / reviewsList.length : 0;
      const now = /* @__PURE__ */ new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayOrders = restaurantOrders.filter((o) => new Date(o.createdAt) >= todayStart);
      const todayRevenue = todayOrders.reduce((sum, o) => sum + parseFloat(o.total || "0"), 0);
      const ordersByStatus = {};
      restaurantOrders.forEach((o) => {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      });
      const popularItems = {};
      restaurantOrders.forEach((o) => {
        const items = o.items;
        if (items) {
          items.forEach((item) => {
            const key = item.menuItemId || item.name;
            if (!popularItems[key]) popularItems[key] = { count: 0, revenue: 0, name: item.name };
            popularItems[key].count += item.quantity;
            popularItems[key].revenue += item.price * item.quantity;
          });
        }
      });
      const dailyRevenue = {};
      restaurantOrders.forEach((o) => {
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
          menuItemCount: menuItemsList.length
        },
        ordersByStatus,
        popularItems: Object.values(popularItems).sort((a, b) => b.count - a.count).slice(0, 10),
        recentOrders: restaurantOrders.slice(0, 20),
        reviews: reviewsList.slice(0, 20),
        dailyRevenue,
        menuItems: menuItemsList
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  app2.post("/api/cache/invalidate", authMiddleware, async (req, res) => {
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
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  const httpServer = (0, import_node_http.createServer)(app2);
  const io = new import_socket.Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        callback(null, true);
      },
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  setupTrackingSocket(io);
  io.on("connection", (socket) => {
    console.log("Socket connected:", socket.id);
    socket.on("join:order", (orderId) => {
      socket.join(`order:${orderId}`);
    });
    socket.on("order:status:changed", async (data) => {
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
                  tokens.map((t) => t.token),
                  `Order ${data.status.replace("_", " ")}`,
                  buildOrderStatusSMS(data.orderId, data.status)
                );
              }
              if (user.email && isSendGridConfigured()) {
                await sendEmail(
                  user.email,
                  `Order Update: ${data.status.replace("_", " ")}`,
                  buildOrderStatusEmail(data.orderId, data.status, data.driverName)
                ).catch((err) => console.warn("[Notification] Email failed:", err));
              }
              if (user.phone && isTwilioConfigured()) {
                await sendSMS(user.phone, buildOrderStatusSMS(data.orderId, data.status)).catch((err) => console.warn("[Notification] SMS failed:", err));
              }
            }
          }
        }
      } catch (err) {
        console.error("[Notification] Error sending order notifications:", err);
      }
    });
    socket.on("chat:message", async (data) => {
      try {
        const msg = await storage.createChatMessage({
          orderId: data.orderId,
          senderId: data.senderId,
          message: data.message
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

// server/platform-routes.ts
var import_express_rate_limit2 = __toESM(require("express-rate-limit"));
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));

// server/platform-storage.ts
var import_drizzle_orm5 = require("drizzle-orm");
var import_crypto = __toESM(require("crypto"));
var import_bcryptjs2 = __toESM(require("bcryptjs"));
var TIER_LIMITS = {
  free: { rateLimit: 100, dailyLimit: 1e3, permissions: ["read"] },
  starter: { rateLimit: 500, dailyLimit: 1e4, permissions: ["read", "write"] },
  pro: { rateLimit: 2e3, dailyLimit: 1e5, permissions: ["read", "write", "webhook", "widget"] },
  enterprise: { rateLimit: 1e4, dailyLimit: 1e6, permissions: ["read", "write", "webhook", "widget", "whitelabel", "admin"] }
};
function getTierLimits(tier) {
  return TIER_LIMITS[tier] || TIER_LIMITS.free;
}
function generatePublicKey() {
  return `ce_pk_${import_crypto.default.randomBytes(24).toString("hex")}`;
}
function generateSecretKey() {
  return `ce_sk_${import_crypto.default.randomBytes(32).toString("hex")}`;
}
function generateWebhookSecret() {
  return `whsec_${import_crypto.default.randomBytes(32).toString("hex")}`;
}
function signWebhookPayload(payload, secret) {
  return import_crypto.default.createHmac("sha256", secret).update(payload).digest("hex");
}
var platformStorage = {
  async createApiKey(data) {
    const publicKey = generatePublicKey();
    const secretKey = generateSecretKey();
    const secretKeyHash = await import_bcryptjs2.default.hash(secretKey, 10);
    const tier = data.tier || "free";
    const limits = getTierLimits(tier);
    const [apiKey] = await db.insert(apiKeys).values({
      userId: data.userId,
      name: data.name,
      publicKey,
      secretKeyHash,
      tier,
      isSandbox: data.isSandbox ?? true,
      rateLimit: limits.rateLimit,
      permissions: limits.permissions
    }).returning();
    return { apiKey, secretKey };
  },
  async getApiKeyByPublicKey(publicKey) {
    const [key] = await db.select().from(apiKeys).where((0, import_drizzle_orm5.eq)(apiKeys.publicKey, publicKey)).limit(1);
    return key;
  },
  async validateSecretKey(apiKey, secretKey) {
    return import_bcryptjs2.default.compare(secretKey, apiKey.secretKeyHash);
  },
  async getApiKeysByUserId(userId) {
    return db.select().from(apiKeys).where((0, import_drizzle_orm5.eq)(apiKeys.userId, userId)).orderBy((0, import_drizzle_orm5.desc)(apiKeys.createdAt));
  },
  async updateApiKey(id, data) {
    const [key] = await db.update(apiKeys).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.eq)(apiKeys.id, id)).returning();
    return key;
  },
  async rotateApiKey(id) {
    const secretKey = generateSecretKey();
    const secretKeyHash = await import_bcryptjs2.default.hash(secretKey, 10);
    const publicKey = generatePublicKey();
    const [key] = await db.update(apiKeys).set({ publicKey, secretKeyHash, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.eq)(apiKeys.id, id)).returning();
    if (!key) return void 0;
    return { apiKey: key, secretKey };
  },
  async deactivateApiKey(id) {
    const [key] = await db.update(apiKeys).set({ isActive: false, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.eq)(apiKeys.id, id)).returning();
    return key;
  },
  async incrementDailyRequests(id) {
    await db.update(apiKeys).set({
      dailyRequests: import_drizzle_orm5.sql`${apiKeys.dailyRequests} + 1`,
      lastUsedAt: /* @__PURE__ */ new Date()
    }).where((0, import_drizzle_orm5.eq)(apiKeys.id, id));
  },
  async resetDailyRequests(id) {
    await db.update(apiKeys).set({ dailyRequests: 0, lastResetAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.eq)(apiKeys.id, id));
  },
  async checkRateLimit(apiKey) {
    const limits = getTierLimits(apiKey.tier);
    const lastReset = apiKey.lastResetAt ? new Date(apiKey.lastResetAt) : /* @__PURE__ */ new Date();
    const now = /* @__PURE__ */ new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1e3 * 60 * 60);
    if (hoursSinceReset >= 24) {
      await platformStorage.resetDailyRequests(apiKey.id);
      return { allowed: true, remaining: limits.dailyLimit - 1, resetAt: new Date(now.getTime() + 24 * 60 * 60 * 1e3) };
    }
    const current = apiKey.dailyRequests || 0;
    const allowed = current < limits.dailyLimit;
    return {
      allowed,
      remaining: Math.max(0, limits.dailyLimit - current),
      resetAt: new Date(lastReset.getTime() + 24 * 60 * 60 * 1e3)
    };
  },
  async createWebhook(data) {
    const secret = generateWebhookSecret();
    const [webhook] = await db.insert(webhooks).values({
      apiKeyId: data.apiKeyId,
      url: data.url,
      events: data.events,
      secret
    }).returning();
    return webhook;
  },
  async getWebhooksByApiKey(apiKeyId) {
    return db.select().from(webhooks).where((0, import_drizzle_orm5.eq)(webhooks.apiKeyId, apiKeyId)).orderBy((0, import_drizzle_orm5.desc)(webhooks.createdAt));
  },
  async getWebhookById(id) {
    const [webhook] = await db.select().from(webhooks).where((0, import_drizzle_orm5.eq)(webhooks.id, id)).limit(1);
    return webhook;
  },
  async updateWebhook(id, data) {
    const [webhook] = await db.update(webhooks).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.eq)(webhooks.id, id)).returning();
    return webhook;
  },
  async deleteWebhook(id) {
    await db.update(webhooks).set({ isActive: false }).where((0, import_drizzle_orm5.eq)(webhooks.id, id));
  },
  async getWebhooksForEvent(event) {
    const allWebhooks = await db.select().from(webhooks).where((0, import_drizzle_orm5.eq)(webhooks.isActive, true));
    return allWebhooks.filter((w) => {
      const events = w.events;
      return events.includes(event) || events.includes("*");
    });
  },
  async createWebhookDelivery(data) {
    const [delivery] = await db.insert(webhookDeliveries).values(data).returning();
    return delivery;
  },
  async getWebhookDeliveries(webhookId, limit = 50) {
    return db.select().from(webhookDeliveries).where((0, import_drizzle_orm5.eq)(webhookDeliveries.webhookId, webhookId)).orderBy((0, import_drizzle_orm5.desc)(webhookDeliveries.deliveredAt)).limit(limit);
  },
  async createIntegrationPartner(data) {
    const [partner] = await db.insert(integrationPartners).values(data).returning();
    return partner;
  },
  async getIntegrationPartners(apiKeyId) {
    return db.select().from(integrationPartners).where((0, import_drizzle_orm5.eq)(integrationPartners.apiKeyId, apiKeyId));
  },
  async createWhiteLabelConfig(data) {
    const [config] = await db.insert(whiteLabelConfigs).values(data).returning();
    return config;
  },
  async getWhiteLabelConfig(apiKeyId) {
    const [config] = await db.select().from(whiteLabelConfigs).where((0, import_drizzle_orm5.eq)(whiteLabelConfigs.apiKeyId, apiKeyId)).limit(1);
    return config;
  },
  async updateWhiteLabelConfig(id, data) {
    const [config] = await db.update(whiteLabelConfigs).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.eq)(whiteLabelConfigs.id, id)).returning();
    return config;
  },
  async createAuditLog(data) {
    const [log] = await db.insert(apiAuditLogs).values(data).returning();
    return log;
  },
  async getAuditLogs(apiKeyId, limit = 100) {
    return db.select().from(apiAuditLogs).where((0, import_drizzle_orm5.eq)(apiAuditLogs.apiKeyId, apiKeyId)).orderBy((0, import_drizzle_orm5.desc)(apiAuditLogs.createdAt)).limit(limit);
  },
  async createInboundOrder(data) {
    const [order] = await db.insert(inboundOrders).values(data).returning();
    return order;
  },
  async getInboundOrders(apiKeyId) {
    return db.select().from(inboundOrders).where((0, import_drizzle_orm5.eq)(inboundOrders.apiKeyId, apiKeyId)).orderBy((0, import_drizzle_orm5.desc)(inboundOrders.createdAt));
  },
  async getInboundOrderById(id) {
    const [order] = await db.select().from(inboundOrders).where((0, import_drizzle_orm5.eq)(inboundOrders.id, id)).limit(1);
    return order;
  },
  async updateInboundOrder(id, data) {
    const [order] = await db.update(inboundOrders).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where((0, import_drizzle_orm5.eq)(inboundOrders.id, id)).returning();
    return order;
  },
  async getAllApiKeys() {
    return db.select().from(apiKeys).orderBy((0, import_drizzle_orm5.desc)(apiKeys.createdAt));
  },
  async getAllWebhooks() {
    return db.select().from(webhooks).orderBy((0, import_drizzle_orm5.desc)(webhooks.createdAt));
  },
  async getAllInboundOrders() {
    return db.select().from(inboundOrders).orderBy((0, import_drizzle_orm5.desc)(inboundOrders.createdAt));
  }
};

// server/webhook-engine.ts
async function dispatchWebhookEvent(event, data) {
  try {
    const subscribedWebhooks = await platformStorage.getWebhooksForEvent(event);
    if (subscribedWebhooks.length === 0) return;
    const payload = {
      event,
      data,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
    const payloadStr = JSON.stringify(payload);
    for (const webhook of subscribedWebhooks) {
      deliverWebhook(webhook.id, webhook.url, webhook.secret, event, payload, payloadStr).catch((err) => {
        console.error(`Webhook delivery failed for ${webhook.id}:`, err.message);
      });
    }
  } catch (err) {
    console.error("Error dispatching webhook event:", err.message);
  }
}
async function deliverWebhook(webhookId, url, secret, event, payload, payloadStr, attempt = 1, maxAttempts = 3) {
  const signature = signWebhookPayload(payloadStr, secret);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1e4);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CryptoEats-Signature": `sha256=${signature}`,
        "X-CryptoEats-Event": event,
        "X-CryptoEats-Delivery": webhookId,
        "X-CryptoEats-Timestamp": payload.timestamp,
        "User-Agent": "CryptoEats-Webhook/1.0"
      },
      body: payloadStr,
      signal: controller.signal
    });
    clearTimeout(timeout);
    const responseBody = await response.text().catch(() => "");
    const success = response.status >= 200 && response.status < 300;
    await platformStorage.createWebhookDelivery({
      webhookId,
      event,
      payload,
      responseStatus: response.status,
      responseBody: responseBody.slice(0, 1e3),
      success,
      attempts: attempt
    });
    if (success) {
      await platformStorage.updateWebhook(webhookId, { failureCount: 0, lastDeliveredAt: /* @__PURE__ */ new Date() });
    } else if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1e3;
      setTimeout(() => deliverWebhook(webhookId, url, secret, event, payload, payloadStr, attempt + 1, maxAttempts), delay);
    } else {
      const webhook = await platformStorage.getWebhookById(webhookId);
      if (webhook) {
        const newFailCount = (webhook.failureCount || 0) + 1;
        await platformStorage.updateWebhook(webhookId, {
          failureCount: newFailCount,
          ...newFailCount >= 10 ? { isActive: false } : {}
        });
      }
    }
  } catch (err) {
    await platformStorage.createWebhookDelivery({
      webhookId,
      event,
      payload,
      responseStatus: 0,
      responseBody: err.message,
      success: false,
      attempts: attempt
    });
    if (attempt < maxAttempts) {
      const delay = Math.pow(2, attempt) * 1e3;
      setTimeout(() => deliverWebhook(webhookId, url, secret, event, payload, payloadStr, attempt + 1, maxAttempts), delay);
    }
  }
}

// server/platform-routes.ts
var import_zod2 = require("zod");
var JWT_SECRET2 = process.env.SESSION_SECRET || "cryptoeats-secret-key";
var WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "cryptoeats-webhook-default-secret";
function authMiddleware2(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "Authorization required" });
    return;
  }
  try {
    const token = authHeader.split(" ")[1];
    const decoded = import_jsonwebtoken2.default.verify(token, JWT_SECRET2);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}
async function apiKeyMiddleware(req, res, next) {
  const publicKey = req.headers["x-api-key"];
  const secretKey = req.headers["x-api-secret"];
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
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < /* @__PURE__ */ new Date()) {
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
      upgrade: apiKey.tier !== "enterprise" ? "Upgrade your plan for higher limits." : void 0
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
      userAgent: req.headers["user-agent"]
    }).catch(() => {
    });
  });
  res.setHeader("X-RateLimit-Limit", getTierLimits(apiKey.tier).dailyLimit.toString());
  res.setHeader("X-RateLimit-Remaining", rateCheck.remaining.toString());
  res.setHeader("X-RateLimit-Reset", rateCheck.resetAt.toISOString());
  next();
}
function requirePermission(...perms) {
  return (req, res, next) => {
    const apiKey = req.apiKey;
    if (!apiKey) {
      res.status(401).json({ error: "API key required." });
      return;
    }
    const keyPerms = apiKey.permissions || [];
    const hasPermission = perms.some((p) => keyPerms.includes(p) || keyPerms.includes("admin"));
    if (!hasPermission) {
      res.status(403).json({
        error: `Insufficient permissions. Required: ${perms.join(" or ")}. Your tier: ${apiKey.tier}`,
        upgrade: "Upgrade your plan for additional permissions."
      });
      return;
    }
    next();
  };
}
var createApiKeySchema = import_zod2.z.object({
  name: import_zod2.z.string().min(1).max(100),
  tier: import_zod2.z.enum(["free", "starter", "pro", "enterprise"]).default("free"),
  isSandbox: import_zod2.z.boolean().default(true)
});
var createWebhookSchema = import_zod2.z.object({
  url: import_zod2.z.string().url(),
  events: import_zod2.z.array(import_zod2.z.string()).min(1)
});
var inboundOrderSchema = import_zod2.z.object({
  externalOrderId: import_zod2.z.string().min(1),
  source: import_zod2.z.string().min(1),
  customerName: import_zod2.z.string().min(1),
  customerPhone: import_zod2.z.string().optional(),
  customerEmail: import_zod2.z.string().email().optional(),
  deliveryAddress: import_zod2.z.string().min(1),
  items: import_zod2.z.array(import_zod2.z.object({
    name: import_zod2.z.string(),
    price: import_zod2.z.number().positive(),
    quantity: import_zod2.z.number().int().positive(),
    isAlcohol: import_zod2.z.boolean().optional()
  })).min(1),
  subtotal: import_zod2.z.number().positive(),
  deliveryFee: import_zod2.z.number().min(0).optional(),
  tip: import_zod2.z.number().min(0).optional(),
  total: import_zod2.z.number().positive(),
  specialInstructions: import_zod2.z.string().optional(),
  metadata: import_zod2.z.record(import_zod2.z.unknown()).optional()
});
var whiteLabelSchema = import_zod2.z.object({
  brandName: import_zod2.z.string().min(1),
  primaryColor: import_zod2.z.string().optional(),
  secondaryColor: import_zod2.z.string().optional(),
  accentColor: import_zod2.z.string().optional(),
  logoUrl: import_zod2.z.string().url().optional(),
  customDomain: import_zod2.z.string().optional(),
  supportEmail: import_zod2.z.string().email().optional()
});
function registerPlatformRoutes(app2) {
  const platformLimiter = (0, import_express_rate_limit2.default)({
    windowMs: 60 * 1e3,
    max: 60,
    message: { error: "Too many requests. Please slow down." }
  });
  app2.use("/api/v1", platformLimiter);
  app2.post("/api/developer/keys", authMiddleware2, async (req, res) => {
    try {
      const data = createApiKeySchema.parse(req.body);
      const result = await platformStorage.createApiKey({
        userId: req.user.id,
        name: data.name,
        tier: data.tier,
        isSandbox: data.isSandbox
      });
      res.status(201).json({
        message: "API key created. Save your secret key - it won't be shown again.",
        publicKey: result.apiKey.publicKey,
        secretKey: result.secretKey,
        tier: result.apiKey.tier,
        rateLimit: getTierLimits(result.apiKey.tier)
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/developer/keys", authMiddleware2, async (req, res) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      res.json(keys.map((k) => ({
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
        createdAt: k.createdAt
      })));
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/developer/keys/:id/rotate", authMiddleware2, async (req, res) => {
    try {
      const result = await platformStorage.rotateApiKey(req.params.id);
      if (!result) return res.status(404).json({ error: "API key not found" });
      res.json({
        message: "API key rotated. Save your new credentials.",
        publicKey: result.apiKey.publicKey,
        secretKey: result.secretKey
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.delete("/api/developer/keys/:id", authMiddleware2, async (req, res) => {
    try {
      const key = await platformStorage.deactivateApiKey(req.params.id);
      if (!key) return res.status(404).json({ error: "API key not found" });
      res.json({ message: "API key deactivated." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/developer/webhooks", authMiddleware2, async (req, res) => {
    try {
      const data = createWebhookSchema.parse(req.body);
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      if (keys.length === 0) return res.status(400).json({ error: "Create an API key first." });
      const webhook = await platformStorage.createWebhook({
        apiKeyId: keys[0].id,
        url: data.url,
        events: data.events
      });
      res.status(201).json({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        secret: webhook.secret,
        message: "Save this webhook secret for signature verification."
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/developer/webhooks", authMiddleware2, async (req, res) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      if (keys.length === 0) return res.json([]);
      const allWebhooks = [];
      for (const key of keys) {
        const wh = await platformStorage.getWebhooksByApiKey(key.id);
        allWebhooks.push(...wh);
      }
      res.json(allWebhooks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/developer/webhooks/:id/deliveries", authMiddleware2, async (req, res) => {
    try {
      const deliveries = await platformStorage.getWebhookDeliveries(req.params.id);
      res.json(deliveries);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/developer/webhooks/:id/test", authMiddleware2, async (req, res) => {
    try {
      const webhook = await platformStorage.getWebhookById(req.params.id);
      if (!webhook) return res.status(404).json({ error: "Webhook not found" });
      await dispatchWebhookEvent("test.ping", {
        message: "This is a test webhook delivery from CryptoEats.",
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      res.json({ message: "Test webhook dispatched." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.delete("/api/developer/webhooks/:id", authMiddleware2, async (req, res) => {
    try {
      await platformStorage.deleteWebhook(req.params.id);
      res.json({ message: "Webhook deactivated." });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/developer/audit-logs", authMiddleware2, async (req, res) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      if (keys.length === 0) return res.json([]);
      const logs = await platformStorage.getAuditLogs(keys[0].id);
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/developer/whitelabel", authMiddleware2, async (req, res) => {
    try {
      const data = whiteLabelSchema.parse(req.body);
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      const proKey = keys.find((k) => k.tier === "enterprise" || k.tier === "pro");
      if (!proKey) return res.status(403).json({ error: "White-label requires Pro or Enterprise tier." });
      const config = await platformStorage.createWhiteLabelConfig({ apiKeyId: proKey.id, ...data });
      res.status(201).json(config);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/developer/whitelabel", authMiddleware2, async (req, res) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      if (keys.length === 0) return res.json(null);
      const config = await platformStorage.getWhiteLabelConfig(keys[0].id);
      res.json(config || null);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.put("/api/developer/whitelabel/:id", authMiddleware2, async (req, res) => {
    try {
      const data = whiteLabelSchema.partial().parse(req.body);
      const config = await platformStorage.updateWhiteLabelConfig(req.params.id, data);
      res.json(config);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.post("/api/developer/integrations", authMiddleware2, async (req, res) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      if (keys.length === 0) return res.status(400).json({ error: "Create an API key first." });
      const partner = await platformStorage.createIntegrationPartner({
        apiKeyId: keys[0].id,
        name: req.body.name,
        type: req.body.type,
        platform: req.body.platform,
        config: req.body.config
      });
      res.status(201).json(partner);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/developer/integrations", authMiddleware2, async (req, res) => {
    try {
      const keys = await platformStorage.getApiKeysByUserId(req.user.id);
      if (keys.length === 0) return res.json([]);
      const allPartners = [];
      for (const key of keys) {
        const partners = await platformStorage.getIntegrationPartners(key.id);
        allPartners.push(...partners);
      }
      res.json(allPartners);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/restaurants", apiKeyMiddleware, async (req, res) => {
    try {
      const { cuisine, search, featured } = req.query;
      const filters = {};
      if (cuisine) filters.cuisine = cuisine;
      if (search) filters.search = search;
      if (featured !== void 0) filters.featured = featured === "true";
      const results = await storage.getAllRestaurants(filters);
      res.json({ data: results, meta: { count: results.length, sandbox: req.apiKey.isSandbox } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/restaurants/:id", apiKeyMiddleware, async (req, res) => {
    try {
      const restaurant = await storage.getRestaurantById(req.params.id);
      if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });
      res.json({ data: restaurant });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/restaurants/:id/menu", apiKeyMiddleware, async (req, res) => {
    try {
      const items = await storage.getMenuItems(req.params.id);
      res.json({ data: items, meta: { count: items.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/orders", apiKeyMiddleware, async (req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      res.json({ data: allOrders, meta: { count: allOrders.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/orders/:id", apiKeyMiddleware, async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      res.json({ data: order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.put("/api/v1/orders/:id/status", apiKeyMiddleware, requirePermission("write"), async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: "Status is required." });
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) return res.status(404).json({ error: "Order not found" });
      await dispatchWebhookEvent(`order.${status}`, { orderId: order.id, status, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
      res.json({ data: order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/drivers", apiKeyMiddleware, async (req, res) => {
    try {
      const drivers2 = await storage.getAllDrivers();
      res.json({
        data: drivers2.map((d) => ({
          id: d.id,
          firstName: d.firstName,
          lastName: d.lastName,
          isAvailable: d.isAvailable,
          rating: d.rating,
          totalDeliveries: d.totalDeliveries,
          currentLat: d.currentLat,
          currentLng: d.currentLng
        })),
        meta: { count: drivers2.length }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/drivers/available", apiKeyMiddleware, async (req, res) => {
    try {
      const drivers2 = await storage.getAvailableDrivers();
      res.json({ data: drivers2, meta: { count: drivers2.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/tax/jurisdictions", apiKeyMiddleware, async (req, res) => {
    try {
      const jurisdictions = await storage.getJurisdictions();
      res.json({ data: jurisdictions });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/v1/tax/calculate", apiKeyMiddleware, async (req, res) => {
    try {
      const { subtotal, rate } = req.body;
      if (!subtotal) return res.status(400).json({ error: "Subtotal is required." });
      const tax = storage.calculateTax(subtotal, rate || 0.07);
      res.json({ data: tax });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/nft/marketplace", apiKeyMiddleware, async (req, res) => {
    try {
      const listings = await storage.getActiveNftListings();
      res.json({ data: listings, meta: { count: listings.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/v1/integrations/orders/inbound", apiKeyMiddleware, requirePermission("write"), async (req, res) => {
    try {
      const data = inboundOrderSchema.parse(req.body);
      const hasAlcohol = data.items.some((item) => item.isAlcohol);
      if (hasAlcohol) {
        const windows = await storage.getDeliveryWindows();
        const activeWindow = windows.find((w) => w.isActive);
        if (activeWindow && !storage.isAlcoholDeliveryAllowed(activeWindow.alcoholStartHour, activeWindow.alcoholEndHour)) {
          return res.status(400).json({ error: "Alcohol delivery not available at this time (8 AM - 10 PM only)." });
        }
      }
      const order = await platformStorage.createInboundOrder({
        apiKeyId: req.apiKey.id,
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
        metadata: data.metadata
      });
      await dispatchWebhookEvent("order.created", {
        orderId: order.id,
        externalOrderId: data.externalOrderId,
        source: data.source,
        type: "inbound"
      });
      res.status(201).json({
        data: order,
        message: "Inbound order received and queued for processing."
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  });
  app2.get("/api/v1/integrations/orders/inbound", apiKeyMiddleware, async (req, res) => {
    try {
      const orders2 = await platformStorage.getInboundOrders(req.apiKey.id);
      res.json({ data: orders2, meta: { count: orders2.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/integrations/orders/inbound/:id", apiKeyMiddleware, async (req, res) => {
    try {
      const order = await platformStorage.getInboundOrderById(req.params.id);
      if (!order) return res.status(404).json({ error: "Inbound order not found" });
      res.json({ data: order });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/v1/webhooks/external/order", apiKeyMiddleware, requirePermission("write"), async (req, res) => {
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
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.post("/api/v1/webhooks/external/inventory", apiKeyMiddleware, requirePermission("write"), async (req, res) => {
    try {
      const { restaurantId, items, source } = req.body;
      if (!restaurantId || !items || !source) {
        return res.status(400).json({ error: "restaurantId, items, and source are required." });
      }
      await dispatchWebhookEvent("inventory.sync", { restaurantId, itemCount: items.length, source });
      res.json({ message: "Inventory sync received.", restaurantId, itemsProcessed: items.length });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/platform/status", async (req, res) => {
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
        whiteLabel: true
      },
      tiers: {
        free: { price: "$0/mo", rateLimit: "1,000 requests/day", features: ["Read-only API access", "Basic restaurant data"] },
        starter: { price: "$99/mo", rateLimit: "10,000 requests/day", features: ["Read + Write access", "Order management", "Basic webhooks"] },
        pro: { price: "$499/mo", rateLimit: "100,000 requests/day", features: ["Full API access", "Webhooks", "Embeddable widgets", "Priority support"] },
        enterprise: { price: "Custom", rateLimit: "1,000,000 requests/day", features: ["Unlimited access", "White-label", "Custom integrations", "Dedicated support", "SLA"] }
      },
      endpoints: {
        base: "/api/v1",
        docs: "/api-docs",
        developer_portal: "/developers"
      }
    });
  });
  app2.get("/api/v1/usage", apiKeyMiddleware, async (req, res) => {
    try {
      const key = req.apiKey;
      const limits = getTierLimits(key.tier);
      const rateCheck = await platformStorage.checkRateLimit(key);
      res.json({
        tier: key.tier,
        dailyRequests: key.dailyRequests,
        dailyLimit: limits.dailyLimit,
        remaining: rateCheck.remaining,
        resetAt: rateCheck.resetAt.toISOString(),
        permissions: key.permissions,
        isSandbox: key.isSandbox
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/widget/config", apiKeyMiddleware, async (req, res) => {
    try {
      const whiteLabelConfig = await platformStorage.getWhiteLabelConfig(req.apiKey.id);
      const restaurants2 = await storage.getAllRestaurants({ featured: true });
      res.json({
        brandName: whiteLabelConfig?.brandName || "CryptoEats",
        primaryColor: whiteLabelConfig?.primaryColor || "#FF6B00",
        secondaryColor: whiteLabelConfig?.secondaryColor || "#1A1A2E",
        accentColor: whiteLabelConfig?.accentColor || "#00D4AA",
        logoUrl: whiteLabelConfig?.logoUrl || null,
        restaurants: restaurants2.slice(0, 6).map((r) => ({
          id: r.id,
          name: r.name,
          cuisineType: r.cuisineType,
          rating: r.rating,
          deliveryFee: r.deliveryFee,
          imageUrl: r.imageUrl
        }))
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/admin/api-keys", apiKeyMiddleware, requirePermission("admin"), async (req, res) => {
    try {
      const keys = await platformStorage.getAllApiKeys();
      res.json({ data: keys, meta: { count: keys.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/admin/webhooks", apiKeyMiddleware, requirePermission("admin"), async (req, res) => {
    try {
      const wh = await platformStorage.getAllWebhooks();
      res.json({ data: wh, meta: { count: wh.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  app2.get("/api/v1/admin/inbound-orders", apiKeyMiddleware, requirePermission("admin"), async (req, res) => {
    try {
      const orders2 = await platformStorage.getAllInboundOrders();
      res.json({ data: orders2, meta: { count: orders2.length } });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}

// server/swagger.ts
var import_swagger_jsdoc = __toESM(require("swagger-jsdoc"));
var options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CryptoEats Platform API",
      version: "1.0.0",
      description: "The Delivery Layer \u2014 Full-featured food & alcohol delivery platform with blockchain integration, NFT rewards, escrow payments, and open API platform. Build on top of CryptoEats to power your own delivery experience.",
      contact: {
        name: "CryptoEats Developer Support",
        email: "developers@cryptoeats.io"
      },
      license: {
        name: "Proprietary"
      }
    },
    servers: [
      {
        url: "/api/v1",
        description: "Platform API v1"
      },
      {
        url: "/api",
        description: "Internal API"
      }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Key",
          description: "Your CryptoEats public API key (ce_pk_...)"
        },
        ApiSecretAuth: {
          type: "apiKey",
          in: "header",
          name: "X-API-Secret",
          description: "Your CryptoEats secret API key (ce_sk_...)"
        },
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token for user authentication"
        }
      },
      schemas: {
        Restaurant: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            cuisineType: { type: "string" },
            address: { type: "string" },
            rating: { type: "number" },
            deliveryFee: { type: "string" },
            estimatedPrepTime: { type: "string" },
            alcoholLicense: { type: "boolean" },
            imageUrl: { type: "string" },
            featured: { type: "boolean" }
          }
        },
        MenuItem: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            restaurantId: { type: "string", format: "uuid" },
            name: { type: "string" },
            description: { type: "string" },
            price: { type: "string" },
            category: { type: "string" },
            isAlcohol: { type: "boolean" },
            dietaryTags: { type: "array", items: { type: "string" } },
            available: { type: "boolean" }
          }
        },
        Order: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            customerId: { type: "string" },
            driverId: { type: "string", nullable: true },
            restaurantId: { type: "string" },
            status: { type: "string", enum: ["pending", "confirmed", "preparing", "picked_up", "arriving", "delivered", "cancelled"] },
            items: { type: "array", items: { type: "object" } },
            subtotal: { type: "string" },
            total: { type: "string" },
            paymentMethod: { type: "string" },
            deliveryAddress: { type: "string" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        InboundOrder: {
          type: "object",
          required: ["externalOrderId", "source", "customerName", "deliveryAddress", "items", "subtotal", "total"],
          properties: {
            externalOrderId: { type: "string" },
            source: { type: "string", description: "Source platform (e.g., shopify, toast, woocommerce)" },
            customerName: { type: "string" },
            customerPhone: { type: "string" },
            customerEmail: { type: "string", format: "email" },
            deliveryAddress: { type: "string" },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: "number" },
                  quantity: { type: "integer" },
                  isAlcohol: { type: "boolean" }
                }
              }
            },
            subtotal: { type: "number" },
            deliveryFee: { type: "number" },
            tip: { type: "number" },
            total: { type: "number" },
            specialInstructions: { type: "string" },
            metadata: { type: "object" }
          }
        },
        TaxCalculation: {
          type: "object",
          properties: {
            taxAmount: { type: "number" },
            taxRate: { type: "number" },
            taxableAmount: { type: "number" }
          }
        },
        ApiKeyCreate: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            tier: { type: "string", enum: ["free", "starter", "pro", "enterprise"], default: "free" },
            isSandbox: { type: "boolean", default: true }
          }
        },
        WebhookCreate: {
          type: "object",
          required: ["url", "events"],
          properties: {
            url: { type: "string", format: "uri" },
            events: {
              type: "array",
              items: { type: "string" },
              description: "Events to subscribe to (e.g., order.created, delivery.completed)"
            }
          }
        },
        WhiteLabelConfig: {
          type: "object",
          required: ["brandName"],
          properties: {
            brandName: { type: "string" },
            primaryColor: { type: "string" },
            secondaryColor: { type: "string" },
            accentColor: { type: "string" },
            logoUrl: { type: "string", format: "uri" },
            customDomain: { type: "string" },
            supportEmail: { type: "string", format: "email" }
          }
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" }
          }
        },
        PaginatedResponse: {
          type: "object",
          properties: {
            data: { type: "array", items: {} },
            meta: {
              type: "object",
              properties: {
                count: { type: "integer" },
                sandbox: { type: "boolean" }
              }
            }
          }
        }
      }
    },
    paths: {
      "/restaurants": {
        get: {
          tags: ["Restaurants"],
          summary: "List all restaurants",
          security: [{ ApiKeyAuth: [] }],
          parameters: [
            { name: "cuisine", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "featured", in: "query", schema: { type: "boolean" } }
          ],
          responses: { "200": { description: "List of restaurants" } }
        }
      },
      "/restaurants/{id}": {
        get: {
          tags: ["Restaurants"],
          summary: "Get restaurant by ID",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Restaurant details" }, "404": { description: "Not found" } }
        }
      },
      "/restaurants/{id}/menu": {
        get: {
          tags: ["Restaurants"],
          summary: "Get restaurant menu items",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Menu items" } }
        }
      },
      "/orders": {
        get: {
          tags: ["Orders"],
          summary: "List all orders",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "List of orders" } }
        }
      },
      "/orders/{id}": {
        get: {
          tags: ["Orders"],
          summary: "Get order by ID",
          security: [{ ApiKeyAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Order details" }, "404": { description: "Not found" } }
        }
      },
      "/orders/{id}/status": {
        put: {
          tags: ["Orders"],
          summary: "Update order status",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { status: { type: "string" } } } } }
          },
          responses: { "200": { description: "Updated order" } }
        }
      },
      "/drivers": {
        get: {
          tags: ["Drivers"],
          summary: "List all drivers",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "List of drivers" } }
        }
      },
      "/drivers/available": {
        get: {
          tags: ["Drivers"],
          summary: "List available drivers",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Available drivers" } }
        }
      },
      "/tax/jurisdictions": {
        get: {
          tags: ["Tax"],
          summary: "List tax jurisdictions",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Tax jurisdictions" } }
        }
      },
      "/tax/calculate": {
        post: {
          tags: ["Tax"],
          summary: "Calculate tax for an amount",
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { subtotal: { type: "number" }, rate: { type: "number" } } } } }
          },
          responses: { "200": { description: "Tax calculation result" } }
        }
      },
      "/nft/marketplace": {
        get: {
          tags: ["NFT"],
          summary: "List NFT marketplace listings",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "NFT listings" } }
        }
      },
      "/integrations/orders/inbound": {
        post: {
          tags: ["Integrations"],
          summary: "Submit inbound order from external system",
          description: "Receive orders from external platforms like Shopify, WooCommerce, Toast POS, etc.",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { $ref: "#/components/schemas/InboundOrder" } } }
          },
          responses: { "201": { description: "Order received" }, "400": { description: "Validation error" } }
        },
        get: {
          tags: ["Integrations"],
          summary: "List inbound orders",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "List of inbound orders" } }
        }
      },
      "/webhooks/external/order": {
        post: {
          tags: ["Integrations"],
          summary: "Receive order status update from external system",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { orderId: { type: "string" }, status: { type: "string" }, source: { type: "string" } } } } }
          },
          responses: { "200": { description: "Update received" } }
        }
      },
      "/webhooks/external/inventory": {
        post: {
          tags: ["Integrations"],
          summary: "Receive inventory sync from external POS",
          security: [{ ApiKeyAuth: [], ApiSecretAuth: [] }],
          requestBody: {
            required: true,
            content: { "application/json": { schema: { type: "object", properties: { restaurantId: { type: "string" }, items: { type: "array" }, source: { type: "string" } } } } }
          },
          responses: { "200": { description: "Sync received" } }
        }
      },
      "/platform/status": {
        get: {
          tags: ["Platform"],
          summary: "Get platform status and tier information",
          responses: { "200": { description: "Platform status" } }
        }
      },
      "/usage": {
        get: {
          tags: ["Platform"],
          summary: "Get API key usage and rate limit info",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Usage statistics" } }
        }
      },
      "/widget/config": {
        get: {
          tags: ["Widget"],
          summary: "Get widget configuration for embeddable UI",
          security: [{ ApiKeyAuth: [] }],
          responses: { "200": { description: "Widget configuration" } }
        }
      }
    }
  },
  apis: []
};
var swaggerSpec = (0, import_swagger_jsdoc.default)(options);

// server/vercel-entry.ts
var import_swagger_ui_express = __toESM(require("swagger-ui-express"));
var fs4 = __toESM(require("fs"));
var path4 = __toESM(require("path"));

// server/services/security.ts
function securityHeaders() {
  return (req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    res.removeHeader("X-Powered-By");
    next();
  };
}
var SUSPICIOUS_PATTERNS = [
  /<script[\s>]/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /union\s+select/i,
  /;\s*drop\s+table/i,
  /--\s*$/,
  /\/\*[\s\S]*?\*\//,
  /exec\s*\(/i,
  /xp_cmdshell/i
];
function inputSanitizationMiddleware() {
  return (req, res, next) => {
    if (req.body && typeof req.body === "object") {
      const bodyStr = JSON.stringify(req.body);
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(bodyStr)) {
          console.warn(`[Security] Suspicious input detected from ${req.ip}: ${req.method} ${req.path}`);
          return res.status(400).json({ message: "Invalid input detected" });
        }
      }
    }
    if (req.query) {
      const queryStr = JSON.stringify(req.query);
      for (const pattern of SUSPICIOUS_PATTERNS) {
        if (pattern.test(queryStr)) {
          console.warn(`[Security] Suspicious query params from ${req.ip}: ${req.method} ${req.path}`);
          return res.status(400).json({ message: "Invalid input detected" });
        }
      }
    }
    next();
  };
}
var requestCounts = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) requestCounts.delete(key);
  }
}, 6e4);

// server/vercel-entry.ts
var app = (0, import_express.default)();
app.use((req, res, next) => {
  const origin = req.header("origin");
  if (origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});
app.use(import_express.default.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(import_express.default.urlencoded({ extended: false }));
app.use(securityHeaders);
app.use(inputSanitizationMiddleware);
app.use(monitoringMiddleware);
var hasDatabaseUrl = !!process.env.DATABASE_URL;
var initPromise = null;
var initialized = false;
function getInitPromise() {
  if (!initPromise) {
    initPromise = (async () => {
      await registerRoutes(app);
      app.use((err, _req, res, _next) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });
      initialized = true;
    })();
  }
  return initPromise;
}
app.get("/health", (_req, res) => {
  res.json({ status: hasDatabaseUrl ? "healthy" : "setup_required", database: hasDatabaseUrl, timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...getHealthMetrics() });
});
app.get("/api/health", (_req, res) => {
  res.json({ status: hasDatabaseUrl ? "healthy" : "setup_required", database: hasDatabaseUrl, timestamp: (/* @__PURE__ */ new Date()).toISOString(), ...getHealthMetrics() });
});
var setupPageHtml = `<!DOCTYPE html>
<html><head><title>CryptoEats - Setup Required</title>
<style>
body{font-family:system-ui,sans-serif;background:#0A0A0F;color:#E8E8F0;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0}
.card{max-width:600px;padding:40px;background:#14141F;border-radius:16px;border:1px solid #1E1E2E}
h1{color:#00D4AA;margin-bottom:8px}
.step{background:#1E1E2E;padding:16px;border-radius:8px;margin:12px 0;font-size:14px}
.step b{color:#00D4AA}
code{background:#0A0A0F;padding:2px 6px;border-radius:4px;font-size:13px}
a{color:#00D4AA}
</style></head><body>
<div class="card">
<h1>CryptoEats</h1>
<p>Your deployment is live, but a <b>PostgreSQL database</b> needs to be connected.</p>
<div class="step"><b>Option A: Neon (recommended, free tier)</b><br>
1. Sign up at <a href="https://neon.tech" target="_blank">neon.tech</a><br>
2. Create a project (choose US East for lowest latency)<br>
3. Copy the connection string from the dashboard<br>
4. In Vercel: Settings &rarr; Environment Variables &rarr; add <code>DATABASE_URL</code> with the connection string<br>
5. Redeploy</div>
<div class="step"><b>Option B: Supabase (free tier)</b><br>
1. Sign up at <a href="https://supabase.com" target="_blank">supabase.com</a><br>
2. Create a project &rarr; go to Settings &rarr; Database<br>
3. Copy the connection string (use "Transaction" mode)<br>
4. Add as <code>DATABASE_URL</code> in Vercel and redeploy</div>
<div class="step"><b>Option C: Any PostgreSQL provider</b><br>
Use any PostgreSQL database &mdash; set <code>DATABASE_URL</code> to:<br>
<code>postgresql://user:password@host:5432/dbname?sslmode=require</code></div>
<p style="font-size:13px;color:#888;margin-top:16px">After adding DATABASE_URL, redeploy from the Vercel dashboard. The database tables will be created automatically on first start.</p>
</div></body></html>`;
if (hasDatabaseUrl) {
  app.get("/api/health/errors", (_req, res) => {
    res.json(getRecentErrors());
  });
  app.get("/api/health/stats", (_req, res) => {
    res.json(getErrorStats());
  });
  app.get("/admin", (_req, res) => {
    const adminPath = path4.resolve(process.cwd(), "server", "templates", "admin-dashboard.html");
    res.sendFile(adminPath);
  });
  app.get("/merchant", (_req, res) => {
    const merchantPath = path4.resolve(process.cwd(), "server", "templates", "merchant-dashboard.html");
    res.sendFile(merchantPath);
  });
  app.get("/developers", (req, res) => {
    const devPortalPath = path4.resolve(process.cwd(), "server", "templates", "developer-portal.html");
    let html = fs4.readFileSync(devPortalPath, "utf-8");
    const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
    const forwardedHost = req.header("x-forwarded-host") || req.get("host");
    const baseUrl = `${forwardedProto}://${forwardedHost}`;
    html = html.replace(/BASE_URL_PLACEHOLDER/g, baseUrl);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  });
  app.get("/legal/tos", (_req, res) => {
    res.sendFile(path4.resolve(process.cwd(), "server", "templates", "terms-of-service.html"));
  });
  app.get("/legal/privacy", (_req, res) => {
    res.sendFile(path4.resolve(process.cwd(), "server", "templates", "privacy-policy.html"));
  });
  app.get("/legal/contractor", (_req, res) => {
    res.sendFile(path4.resolve(process.cwd(), "server", "templates", "contractor-agreement.html"));
  });
  app.get("/widget.js", (_req, res) => {
    const widgetPath = path4.resolve(process.cwd(), "server", "templates", "widget.js");
    res.setHeader("Content-Type", "application/javascript");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.sendFile(widgetPath);
  });
  app.use("/api-docs", import_swagger_ui_express.default.serve, import_swagger_ui_express.default.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "CryptoEats API Docs"
  }));
  const landingPagePath = path4.resolve(process.cwd(), "server", "templates", "landing-page.html");
  let landingPageTemplate = "";
  try {
    landingPageTemplate = fs4.readFileSync(landingPagePath, "utf-8");
  } catch {
    landingPageTemplate = "<html><body><h1>CryptoEats</h1><p>Landing page template not found.</p></body></html>";
  }
  app.get("/", (req, res) => {
    const platform = req.header("expo-platform");
    if (platform && (platform === "ios" || platform === "android")) {
      const manifestPath = path4.resolve(process.cwd(), "public", "manifest.json");
      try {
        const manifest = JSON.parse(fs4.readFileSync(manifestPath, "utf-8"));
        res.json(manifest);
      } catch {
        res.json({ name: "CryptoEats", slug: "cryptoeats" });
      }
      return;
    }
    const forwardedProto = req.header("x-forwarded-proto") || req.protocol || "https";
    const forwardedHost = req.header("x-forwarded-host") || req.get("host");
    const baseUrl = `${forwardedProto}://${forwardedHost}`;
    const expsUrl = `${forwardedHost}`;
    const html = landingPageTemplate.replace(/BASE_URL_PLACEHOLDER/g, baseUrl).replace(/EXPS_URL_PLACEHOLDER/g, expsUrl).replace(/APP_NAME_PLACEHOLDER/g, "CryptoEats");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).send(html);
  });
  app.use("/assets", import_express.default.static(path4.resolve(process.cwd(), "assets")));
  app.use("/public", import_express.default.static(path4.resolve(process.cwd(), "public")));
  registerPlatformRoutes(app);
  getInitPromise();
} else {
  app.use((_req, res) => {
    res.status(503).send(setupPageHtml);
  });
}
var handler = async (req, res) => {
  if (hasDatabaseUrl && !initialized) await getInitPromise();
  app(req, res);
};
var vercel_entry_default = handler;
