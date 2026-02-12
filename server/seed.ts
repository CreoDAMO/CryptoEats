import { db } from "./db";
import { restaurants, menuItems, taxJurisdictions, deliveryWindows, bundles, users, drivers } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function seedDatabase() {
  try {
    const existingRestaurants = await db.select().from(restaurants).limit(1);
    if (existingRestaurants.length > 0) {
      await seedAdminUser();
      await seedDriverUser();
      return;
    }
  } catch (err: any) {
    if (err?.code === "42P01") {
      console.warn("[Seed] Tables not created yet. Run database migrations first (npx drizzle-kit push).");
      console.warn("[Seed] Skipping seed — tables will be created on next deployment.");
      return;
    }
    throw err;
  }

  console.log("Seeding database...");
  await seedAdminUser();
  await seedDriverUser();

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
    operatingHours: { open: "10:00", close: "23:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
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
    operatingHours: { open: "11:00", close: "22:00", days: ["Tue","Wed","Thu","Fri","Sat","Sun"] },
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
    operatingHours: { open: "11:30", close: "22:30", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
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
    operatingHours: { open: "11:00", close: "23:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
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
    operatingHours: { open: "10:00", close: "22:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
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
    operatingHours: { open: "11:00", close: "22:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
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
    operatingHours: { open: "10:30", close: "21:30", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
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
    operatingHours: { open: "11:00", close: "22:00", days: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"] },
  }).returning();

  await db.insert(menuItems).values([
    { restaurantId: r1.id, name: "Ropa Vieja", description: "Shredded beef in tomato-based sauce with peppers and onions", price: "18.99", category: "Entrees", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1574484284002-952d92456975?w=300" },
    { restaurantId: r1.id, name: "Cuban Sandwich", description: "Ham, roasted pork, Swiss cheese, pickles, mustard on Cuban bread", price: "12.99", category: "Sandwiches", imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300" },
    { restaurantId: r1.id, name: "Lechon Asado", description: "Slow-roasted pork with mojo sauce, black beans and rice", price: "16.99", category: "Entrees", dietaryTags: ["gluten-free"], imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300" },
    { restaurantId: r1.id, name: "Tres Leches Cake", description: "Classic three-milk cake with whipped cream", price: "8.99", category: "Desserts", imageUrl: "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=300" },
    { restaurantId: r1.id, name: "Mojito", description: "Classic Cuban cocktail with rum, mint, lime, sugar and soda", price: "11.99", category: "Beverages", isAlcohol: true, ageVerificationRequired: true, imageUrl: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300" },
    { restaurantId: r1.id, name: "Café Cubano", description: "Strong espresso sweetened with sugar", price: "3.99", category: "Beverages", imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefda?w=300" },
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
    { restaurantId: r8.id, name: "Smoked Wings", description: "Hickory-smoked chicken wings with ranch", price: "13.99", category: "Appetizers", imageUrl: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=300" },
  ]);

  await db.insert(taxJurisdictions).values([
    {
      zipCode: "33101",
      city: "Miami",
      county: "Miami-Dade",
      state: "FL",
      stateRate: "0.0600",
      localRate: "0.0100",
      totalRate: "0.0700",
    },
    {
      zipCode: "33139",
      city: "Miami Beach",
      county: "Miami-Dade",
      state: "FL",
      stateRate: "0.0600",
      localRate: "0.0100",
      totalRate: "0.0700",
    },
    {
      zipCode: "33134",
      city: "Coral Gables",
      county: "Miami-Dade",
      state: "FL",
      stateRate: "0.0600",
      localRate: "0.0100",
      totalRate: "0.0700",
    },
  ]);

  await db.insert(deliveryWindows).values([
    {
      region: "Miami-Dade",
      alcoholStartHour: 8,
      alcoholEndHour: 22,
      isActive: true,
    },
    {
      region: "Miami Beach",
      alcoholStartHour: 10,
      alcoholEndHour: 2,
      isActive: true,
    },
    {
      region: "Coral Gables",
      alcoholStartHour: 9,
      alcoholEndHour: 21,
      isActive: true,
    },
  ]);

  await db.insert(bundles).values([
    {
      name: "Date Night Bundle",
      items: ["Wine", "Pasta", "Dessert"],
      discountPercentage: 15,
      active: true,
      conditions: { minItems: 3, validDays: ["Fri", "Sat"] },
    },
    {
      name: "Game Day Pack",
      items: ["Wings", "Beer", "Nachos"],
      discountPercentage: 10,
      active: true,
      conditions: { minItems: 3, validDays: ["Sun"] },
    },
    {
      name: "Lunch Special",
      items: ["Sandwich", "Drink", "Side"],
      discountPercentage: 20,
      active: true,
      conditions: { minItems: 2, validHours: { start: 11, end: 14 } },
    },
    {
      name: "Happy Hour Deal",
      items: ["Cocktail", "Appetizer"],
      discountPercentage: 25,
      active: true,
      conditions: { minItems: 2, validHours: { start: 16, end: 19 } },
    },
  ]);

  console.log("Database seeded successfully!");
}

async function seedAdminUser() {
  try {
    const existing = await db.select().from(users).where(eq(users.email, "admin@cryptoeats.net")).limit(1);
    if (existing.length > 0) return;

    const passwordHash = await bcrypt.hash("CryptoEats2026!", 12);
    await db.insert(users).values({
      email: "admin@cryptoeats.net",
      passwordHash,
      role: "admin",
    });
    console.log("[Seed] Default admin user created (admin@cryptoeats.net)");
  } catch (err: any) {
    console.warn("[Seed] Admin user seed warning:", err.message);
  }
}

async function seedDriverUser() {
  try {
    const existing = await db.select().from(users).where(eq(users.email, "driver@cryptoeats.net")).limit(1);
    if (existing.length > 0) return;

    const passwordHash = await bcrypt.hash("CryptoEats2026!", 12);
    const [driverUser] = await db.insert(users).values({
      email: "driver@cryptoeats.net",
      passwordHash,
      role: "driver",
    }).returning();

    await db.insert(drivers).values({
      userId: driverUser.id,
      firstName: "Demo",
      lastName: "Driver",
      licenseNumber: "FL-DL-2026-001",
      vehicleInfo: "2024 Toyota Camry - White",
      backgroundCheckStatus: "approved",
      isAvailable: true,
      currentLat: 25.7617,
      currentLng: -80.1918,
      rating: 4.9,
      totalDeliveries: 47,
      earningsData: { totalEarnings: 1842.50, weeklyEarnings: 385.75 },
      bio: "Experienced delivery driver in the Miami area. Fast and reliable.",
    });
    console.log("[Seed] Default driver user created (driver@cryptoeats.net)");
  } catch (err: any) {
    console.warn("[Seed] Driver user seed warning:", err.message);
  }
}
