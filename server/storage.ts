import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, customers, drivers, restaurants, menuItems, orders, chats, reviews,
  idVerifications, taxJurisdictions, taxTransactions, taxRemittances,
  driverStatusTable, driverSupportLog, driverEarnings, complianceLogs,
  deliveryWindows, referrals, digitalAgreements, bundles,
  wallets, escrowTransactions, nftRewards, nftListings,
  type User, type Customer, type Driver, type Restaurant, type MenuItem,
  type Order, type Review, type TaxJurisdiction, type TaxTransaction,
  type DriverStatus, type DriverSupportLogEntry, type ComplianceLog,
  type Wallet, type EscrowTransaction, type NftReward, type NftListing,
} from "../shared/schema";

export const storage = {
  async createUser(data: { email: string; passwordHash: string; phone?: string; role?: "customer" | "driver" | "admin" | "restaurant" }): Promise<User> {
    const [user] = await db.insert(users).values({
      email: data.email,
      passwordHash: data.passwordHash,
      phone: data.phone || null,
      role: data.role || "customer",
    }).returning();
    return user;
  },

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return user;
  },

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return user;
  },

  async createCustomer(data: { userId: string; firstName: string; lastName: string }): Promise<Customer> {
    const [customer] = await db.insert(customers).values({
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
    }).returning();
    return customer;
  },

  async getCustomerByUserId(userId: string): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.userId, userId)).limit(1);
    return customer;
  },

  async updateCustomer(id: string, data: Partial<Customer>): Promise<Customer | undefined> {
    const [customer] = await db.update(customers).set(data).where(eq(customers.id, id)).returning();
    return customer;
  },

  async toggleFavoriteRestaurant(customerId: string, restaurantId: string): Promise<Customer | undefined> {
    const customer = await storage.getCustomerByUserId(customerId);
    if (!customer) return undefined;
    const favs = customer.favoriteRestaurants || [];
    const idx = favs.indexOf(restaurantId);
    const newFavs = idx >= 0 ? favs.filter(id => id !== restaurantId) : [...favs, restaurantId];
    const [updated] = await db.update(customers).set({ favoriteRestaurants: newFavs }).where(eq(customers.id, customer.id)).returning();
    return updated;
  },

  async toggleFavoriteItem(customerId: string, itemId: string): Promise<Customer | undefined> {
    const customer = await storage.getCustomerByUserId(customerId);
    if (!customer) return undefined;
    const favs = customer.favoriteItems || [];
    const idx = favs.indexOf(itemId);
    const newFavs = idx >= 0 ? favs.filter(id => id !== itemId) : [...favs, itemId];
    const [updated] = await db.update(customers).set({ favoriteItems: newFavs }).where(eq(customers.id, customer.id)).returning();
    return updated;
  },

  async getAllRestaurants(filters?: { cuisine?: string; search?: string; featured?: boolean }): Promise<Restaurant[]> {
    let query = db.select().from(restaurants);
    const conditions = [];
    if (filters?.cuisine) {
      conditions.push(ilike(restaurants.cuisineType, `%${filters.cuisine}%`));
    }
    if (filters?.search) {
      conditions.push(ilike(restaurants.name, `%${filters.search}%`));
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(restaurants.featured, filters.featured));
    }
    if (conditions.length > 0) {
      return db.select().from(restaurants).where(and(...conditions));
    }
    return db.select().from(restaurants);
  },

  async getRestaurantById(id: string): Promise<Restaurant | undefined> {
    const [restaurant] = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
    return restaurant;
  },

  async getMenuItems(restaurantId: string): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId));
  },

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id)).limit(1);
    return item;
  },

  async createOrder(data: any): Promise<Order> {
    const [order] = await db.insert(orders).values(data).returning();
    return order;
  },

  async getOrderById(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return order;
  },

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  },

  async getOrdersByDriverId(driverId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.driverId, driverId)).orderBy(desc(orders.createdAt));
  },

  async updateOrderStatus(id: string, status: string, extra?: Record<string, any>): Promise<Order | undefined> {
    const updateData: any = { status };
    if (extra) Object.assign(updateData, extra);
    const [order] = await db.update(orders).set(updateData).where(eq(orders.id, id)).returning();
    return order;
  },

  async assignDriver(orderId: string, driverId: string): Promise<Order | undefined> {
    const [order] = await db.update(orders).set({ driverId, status: "confirmed" }).where(eq(orders.id, orderId)).returning();
    return order;
  },

  async createReview(data: any): Promise<Review> {
    const [review] = await db.insert(reviews).values(data).returning();
    return review;
  },

  async getReviewsByRestaurant(restaurantId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.restaurantId, restaurantId)).orderBy(desc(reviews.createdAt));
  },

  async getReviewsByDriver(driverId: string): Promise<Review[]> {
    return db.select().from(reviews).where(eq(reviews.driverId, driverId)).orderBy(desc(reviews.createdAt));
  },

  async addRestaurantResponse(reviewId: string, response: string): Promise<Review | undefined> {
    const [review] = await db.update(reviews).set({ restaurantResponse: response }).where(eq(reviews.id, reviewId)).returning();
    return review;
  },

  calculateTax(subtotal: number, rate: number = 0.07): { taxAmount: number; taxRate: number; taxableAmount: number } {
    const taxAmount = Math.round(subtotal * rate * 100) / 100;
    return { taxAmount, taxRate: rate, taxableAmount: subtotal };
  },

  async createTaxTransaction(data: any): Promise<TaxTransaction> {
    const [tx] = await db.insert(taxTransactions).values(data).returning();
    return tx;
  },

  async getTaxSummary(): Promise<any> {
    const transactions = await db.select().from(taxTransactions);
    const totalCollected = transactions.reduce((sum, t) => sum + parseFloat(t.taxCollected || "0"), 0);
    const totalTaxable = transactions.reduce((sum, t) => sum + parseFloat(t.taxableAmount || "0"), 0);
    return {
      totalCollected: totalCollected.toFixed(2),
      totalTaxable: totalTaxable.toFixed(2),
      transactionCount: transactions.length,
      transactions,
    };
  },

  async getJurisdictions(): Promise<TaxJurisdiction[]> {
    return db.select().from(taxJurisdictions);
  },

  async createRemittance(data: any): Promise<any> {
    const [remittance] = await db.insert(taxRemittances).values(data).returning();
    return remittance;
  },

  async createDriver(data: { userId: string; firstName: string; lastName: string; licenseNumber?: string; vehicleInfo?: string }): Promise<Driver> {
    const [driver] = await db.insert(drivers).values({
      userId: data.userId,
      firstName: data.firstName,
      lastName: data.lastName,
      licenseNumber: data.licenseNumber || null,
      vehicleInfo: data.vehicleInfo || null,
    }).returning();
    return driver;
  },

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId)).limit(1);
    return driver;
  },

  async getAllDrivers(): Promise<Driver[]> {
    return db.select().from(drivers);
  },

  async updateDriverLocation(driverId: string, lat: number, lng: number): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers).set({ currentLat: lat, currentLng: lng }).where(eq(drivers.id, driverId)).returning();
    return driver;
  },

  async updateDriverAvailability(driverId: string, isAvailable: boolean): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers).set({ isAvailable }).where(eq(drivers.id, driverId)).returning();
    return driver;
  },

  async getAvailableDrivers(): Promise<Driver[]> {
    return db.select().from(drivers).where(eq(drivers.isAvailable, true));
  },

  async getDriverEarnings(driverId: string): Promise<any[]> {
    return db.select().from(driverEarnings).where(eq(driverEarnings.driverId, driverId)).orderBy(desc(driverEarnings.createdAt));
  },

  async createDriverEarning(data: any): Promise<any> {
    const [earning] = await db.insert(driverEarnings).values(data).returning();
    return earning;
  },

  async getDriverStatus(driverId: string): Promise<DriverStatus | undefined> {
    const [status] = await db.select().from(driverStatusTable).where(eq(driverStatusTable.driverId, driverId)).orderBy(desc(driverStatusTable.createdAt)).limit(1);
    return status;
  },

  async updateDriverStatus(driverId: string, data: any): Promise<DriverStatus> {
    const existing = await storage.getDriverStatus(driverId);
    if (existing) {
      const [status] = await db.update(driverStatusTable).set({ ...data, updatedAt: new Date() }).where(eq(driverStatusTable.id, existing.id)).returning();
      return status;
    }
    const [status] = await db.insert(driverStatusTable).values({ driverId, ...data }).returning();
    return status;
  },

  async createDriverSupportLog(data: any): Promise<DriverSupportLogEntry> {
    const [log] = await db.insert(driverSupportLog).values(data).returning();
    return log;
  },

  async getDriverSupportLogs(driverId: string): Promise<DriverSupportLogEntry[]> {
    return db.select().from(driverSupportLog).where(eq(driverSupportLog.driverId, driverId)).orderBy(desc(driverSupportLog.createdAt));
  },

  async createChatMessage(data: { orderId: string; senderId: string; message: string; type?: "text" | "image" | "system" }): Promise<any> {
    const [chat] = await db.insert(chats).values({
      orderId: data.orderId,
      senderId: data.senderId,
      message: data.message,
      type: data.type || "text",
    }).returning();
    return chat;
  },

  async getChatMessages(orderId: string): Promise<any[]> {
    return db.select().from(chats).where(eq(chats.orderId, orderId)).orderBy(chats.timestamp);
  },

  async createBundle(data: any): Promise<any> {
    const [bundle] = await db.insert(bundles).values(data).returning();
    return bundle;
  },

  async getActiveBundles(): Promise<any[]> {
    return db.select().from(bundles).where(eq(bundles.active, true));
  },

  async createComplianceLog(data: any): Promise<ComplianceLog> {
    const [log] = await db.insert(complianceLogs).values(data).returning();
    return log;
  },

  async getComplianceLogs(): Promise<ComplianceLog[]> {
    return db.select().from(complianceLogs).orderBy(desc(complianceLogs.createdAt));
  },

  async getDeliveryWindows(): Promise<any[]> {
    return db.select().from(deliveryWindows);
  },

  async updateDeliveryWindow(id: string, data: any): Promise<any> {
    const [window] = await db.update(deliveryWindows).set(data).where(eq(deliveryWindows.id, id)).returning();
    return window;
  },

  isAlcoholDeliveryAllowed(startHour: number, endHour: number): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    if (startHour < endHour) {
      return currentHour >= startHour && currentHour < endHour;
    }
    return currentHour >= startHour || currentHour < endHour;
  },

  async createReferral(data: { referrerId: string; code: string }): Promise<any> {
    const [referral] = await db.insert(referrals).values({
      referrerId: data.referrerId,
      code: data.code,
    }).returning();
    return referral;
  },

  async getReferralByCode(code: string): Promise<any | undefined> {
    const [referral] = await db.select().from(referrals).where(eq(referrals.code, code)).limit(1);
    return referral;
  },

  async applyReferral(code: string, referredId: string): Promise<any | undefined> {
    const referral = await storage.getReferralByCode(code);
    if (!referral || referral.credited) return undefined;
    const [updated] = await db.update(referrals).set({ referredId, credited: true }).where(eq(referrals.id, referral.id)).returning();
    return updated;
  },

  async createAgreement(data: any): Promise<any> {
    const [agreement] = await db.insert(digitalAgreements).values(data).returning();
    return agreement;
  },

  async getAgreements(entityId: string): Promise<any[]> {
    return db.select().from(digitalAgreements).where(eq(digitalAgreements.entityId, entityId));
  },

  async createIdVerification(data: any): Promise<any> {
    const [verification] = await db.insert(idVerifications).values(data).returning();
    return verification;
  },

  async getIdVerifications(customerId: string): Promise<any[]> {
    return db.select().from(idVerifications).where(eq(idVerifications.customerId, customerId));
  },

  async getPendingOrders(): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.status, "pending")).orderBy(desc(orders.createdAt));
  },

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  },

  async updateRestaurant(id: string, data: any): Promise<Restaurant | undefined> {
    const [restaurant] = await db.update(restaurants).set(data).where(eq(restaurants.id, id)).returning();
    return restaurant;
  },

  async updateDriver(id: string, data: any): Promise<Driver | undefined> {
    const [driver] = await db.update(drivers).set(data).where(eq(drivers.id, id)).returning();
    return driver;
  },

  async getAllDriverStatuses(): Promise<DriverStatus[]> {
    return db.select().from(driverStatusTable).orderBy(desc(driverStatusTable.createdAt));
  },

  async createWallet(data: { userId: string; walletAddress: string; walletType?: string; chainId?: number }): Promise<Wallet> {
    const [wallet] = await db.insert(wallets).values({
      userId: data.userId,
      walletAddress: data.walletAddress,
      walletType: data.walletType || "coinbase",
      chainId: data.chainId || 8453,
    }).returning();
    return wallet;
  },

  async getWalletsByUserId(userId: string): Promise<Wallet[]> {
    return db.select().from(wallets).where(eq(wallets.userId, userId));
  },

  async getWalletByAddress(address: string): Promise<Wallet | undefined> {
    const [wallet] = await db.select().from(wallets).where(eq(wallets.walletAddress, address)).limit(1);
    return wallet;
  },

  async createEscrowTransaction(data: any): Promise<EscrowTransaction> {
    const [tx] = await db.insert(escrowTransactions).values(data).returning();
    return tx;
  },

  async getEscrowByOrderId(orderId: string): Promise<EscrowTransaction | undefined> {
    const [escrow] = await db.select().from(escrowTransactions).where(eq(escrowTransactions.orderId, orderId)).limit(1);
    return escrow;
  },

  async updateEscrowStatus(id: string, status: string, extra?: Record<string, any>): Promise<EscrowTransaction | undefined> {
    const updateData: any = { status };
    if (extra) Object.assign(updateData, extra);
    const [escrow] = await db.update(escrowTransactions).set(updateData).where(eq(escrowTransactions.id, id)).returning();
    return escrow;
  },

  async getEscrowTransactions(userId: string): Promise<EscrowTransaction[]> {
    const userWallets = await storage.getWalletsByUserId(userId);
    if (userWallets.length === 0) return [];
    const addresses = userWallets.map(w => w.walletAddress);
    const results: EscrowTransaction[] = [];
    for (const addr of addresses) {
      const depositorTxs = await db.select().from(escrowTransactions).where(eq(escrowTransactions.depositorAddress, addr));
      const sellerTxs = await db.select().from(escrowTransactions).where(eq(escrowTransactions.sellerAddress, addr));
      results.push(...depositorTxs, ...sellerTxs);
    }
    const unique = Array.from(new Map(results.map(r => [r.id, r])).values());
    return unique.sort((a, b) => new Date(b.depositedAt).getTime() - new Date(a.depositedAt).getTime());
  },

  async createNftReward(data: any): Promise<NftReward> {
    const [nft] = await db.insert(nftRewards).values(data).returning();
    return nft;
  },

  async getNftsByUserId(userId: string): Promise<NftReward[]> {
    return db.select().from(nftRewards).where(eq(nftRewards.userId, userId)).orderBy(desc(nftRewards.createdAt));
  },

  async updateNftStatus(id: string, status: string, extra?: Record<string, any>): Promise<NftReward | undefined> {
    const updateData: any = { status };
    if (extra) Object.assign(updateData, extra);
    const [nft] = await db.update(nftRewards).set(updateData).where(eq(nftRewards.id, id)).returning();
    return nft;
  },

  async createNftListing(data: any): Promise<NftListing> {
    const [listing] = await db.insert(nftListings).values(data).returning();
    return listing;
  },

  async getActiveNftListings(): Promise<NftListing[]> {
    return db.select().from(nftListings).where(eq(nftListings.status, "active")).orderBy(desc(nftListings.listedAt));
  },

  async getNftListingById(id: string): Promise<NftListing | undefined> {
    const [listing] = await db.select().from(nftListings).where(eq(nftListings.id, id)).limit(1);
    return listing;
  },

  async updateNftListing(id: string, data: any): Promise<NftListing | undefined> {
    const [listing] = await db.update(nftListings).set(data).where(eq(nftListings.id, id)).returning();
    return listing;
  },

  async checkAndMintMilestoneNFT(userId: string, type: "customer" | "driver"): Promise<NftReward | null> {
    const customerMilestones = [
      { count: 10, name: "Foodie Explorer", description: "Completed 10 orders on CryptoEats" },
      { count: 25, name: "Crypto Connoisseur", description: "Completed 25 orders on CryptoEats" },
      { count: 50, name: "Diamond Diner", description: "Completed 50 orders on CryptoEats" },
      { count: 100, name: "CryptoEats Legend", description: "Completed 100 orders on CryptoEats" },
    ];

    const driverMilestones = [
      { count: 10, name: "Rising Star", description: "Completed 10 deliveries on CryptoEats" },
      { count: 50, name: "Road Warrior", description: "Completed 50 deliveries on CryptoEats" },
      { count: 100, name: "Delivery Hero", description: "Completed 100 deliveries on CryptoEats" },
      { count: 500, name: "Legendary Driver", description: "Completed 500 deliveries on CryptoEats" },
    ];

    try {
      let currentCount = 0;
      const milestones = type === "customer" ? customerMilestones : driverMilestones;

      if (type === "customer") {
        const customer = await storage.getCustomerByUserId(userId);
        if (!customer) return null;
        const customerOrders = await storage.getOrdersByCustomerId(customer.id);
        currentCount = customerOrders.filter(o => o.status === "delivered").length;
      } else {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) return null;
        currentCount = driver.totalDeliveries || 0;
      }

      const existingNfts = await storage.getNftsByUserId(userId);
      const existingMilestoneNames = existingNfts.map(n => n.name);

      for (const milestone of milestones) {
        if (currentCount >= milestone.count && !existingMilestoneNames.includes(milestone.name)) {
          const nft = await storage.createNftReward({
            userId,
            name: milestone.name,
            description: milestone.description,
            milestoneType: type,
            milestoneValue: milestone.count,
            status: "pending",
          });
          return nft;
        }
      }

      return null;
    } catch (error: any) {
      console.error("Error checking milestone NFT:", error.message);
      return null;
    }
  },
};
