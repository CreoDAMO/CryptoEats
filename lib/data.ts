export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  reviewCount: number;
  deliveryTime: string;
  deliveryFee: number;
  minOrder: number;
  image: string;
  hasAlcohol: boolean;
  featured: boolean;
  address: string;
  distance: string;
}

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  isAlcohol: boolean;
  dietaryTags: string[];
  pairingSuggestions: string[];
  image: string;
}

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  restaurantId: string;
  restaurantName: string;
}

export interface Order {
  id: string;
  restaurantName: string;
  restaurantId: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  taxRate: number;
  tip: number;
  total: number;
  status: 'confirmed' | 'preparing' | 'picked_up' | 'arriving' | 'delivered';
  paymentMethod: string;
  createdAt: string;
  deliveredAt?: string;
  eta: string;
  driverName: string;
  driverRating: number;
  driverVehicle: string;
  requiresAgeVerification: boolean;
  ageVerified: boolean;
  deliveryAddress: string;
  specialInstructions?: string;
  rated?: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  tastePreferences: string[];
  dietaryRestrictions: string[];
  savedAddresses: { label: string; address: string }[];
  idVerified: boolean;
}

export const CUISINE_FILTERS = [
  'All', 'Pizza', 'Sushi', 'Mexican', 'Chinese', 'Indian', 'Thai', 'American', 'Mediterranean', 'Wine Bar', 'Brewery'
];

export const RESTAURANTS: Restaurant[] = [
  {
    id: 'r1',
    name: 'Sakura Japanese',
    cuisine: 'Sushi',
    rating: 4.8,
    reviewCount: 342,
    deliveryTime: '25-35 min',
    deliveryFee: 2.99,
    minOrder: 15,
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400',
    hasAlcohol: true,
    featured: true,
    address: '123 Brickell Ave, Miami, FL',
    distance: '1.2 mi',
  },
  {
    id: 'r2',
    name: 'Bella Napoli',
    cuisine: 'Pizza',
    rating: 4.6,
    reviewCount: 518,
    deliveryTime: '20-30 min',
    deliveryFee: 1.99,
    minOrder: 12,
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    hasAlcohol: true,
    featured: true,
    address: '456 Collins Ave, Miami, FL',
    distance: '0.8 mi',
  },
  {
    id: 'r3',
    name: 'El Taco Loco',
    cuisine: 'Mexican',
    rating: 4.5,
    reviewCount: 287,
    deliveryTime: '15-25 min',
    deliveryFee: 1.49,
    minOrder: 10,
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400',
    hasAlcohol: true,
    featured: false,
    address: '789 Ocean Dr, Miami, FL',
    distance: '1.5 mi',
  },
  {
    id: 'r4',
    name: 'Golden Dragon',
    cuisine: 'Chinese',
    rating: 4.4,
    reviewCount: 196,
    deliveryTime: '30-40 min',
    deliveryFee: 2.49,
    minOrder: 18,
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400',
    hasAlcohol: false,
    featured: false,
    address: '101 Miracle Mile, Miami, FL',
    distance: '2.1 mi',
  },
  {
    id: 'r5',
    name: 'Spice Route',
    cuisine: 'Indian',
    rating: 4.7,
    reviewCount: 234,
    deliveryTime: '25-35 min',
    deliveryFee: 2.99,
    minOrder: 20,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400',
    hasAlcohol: false,
    featured: true,
    address: '222 Coral Way, Miami, FL',
    distance: '1.8 mi',
  },
  {
    id: 'r6',
    name: 'Vine & Barrel',
    cuisine: 'Wine Bar',
    rating: 4.9,
    reviewCount: 156,
    deliveryTime: '20-30 min',
    deliveryFee: 3.99,
    minOrder: 25,
    image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400',
    hasAlcohol: true,
    featured: true,
    address: '333 Wynwood Blvd, Miami, FL',
    distance: '0.5 mi',
  },
  {
    id: 'r7',
    name: 'Bangkok Bites',
    cuisine: 'Thai',
    rating: 4.3,
    reviewCount: 178,
    deliveryTime: '25-35 min',
    deliveryFee: 2.49,
    minOrder: 14,
    image: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=400',
    hasAlcohol: true,
    featured: false,
    address: '444 NE 2nd Ave, Miami, FL',
    distance: '1.0 mi',
  },
  {
    id: 'r8',
    name: 'Craft & Tap',
    cuisine: 'Brewery',
    rating: 4.6,
    reviewCount: 203,
    deliveryTime: '15-25 min',
    deliveryFee: 2.99,
    minOrder: 15,
    image: 'https://images.unsplash.com/photo-1436076863939-06870fe779c2?w=400',
    hasAlcohol: true,
    featured: false,
    address: '555 SW 8th St, Miami, FL',
    distance: '1.3 mi',
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // Sakura Japanese
  { id: 'm1', restaurantId: 'r1', name: 'Dragon Roll', description: 'Shrimp tempura, avocado, eel, tobiko', price: 16.99, category: 'Rolls', isAlcohol: false, dietaryTags: [], pairingSuggestions: ['Sake Bomb'], image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=300' },
  { id: 'm2', restaurantId: 'r1', name: 'Salmon Sashimi', description: 'Fresh Atlantic salmon, 8 pieces', price: 14.99, category: 'Sashimi', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: ['Junmai Sake'], image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=300' },
  { id: 'm3', restaurantId: 'r1', name: 'Junmai Sake', description: 'Premium Japanese sake, 300ml', price: 18.99, category: 'Drinks', isAlcohol: true, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=300' },
  { id: 'm4', restaurantId: 'r1', name: 'Edamame', description: 'Steamed soybeans with sea salt', price: 5.99, category: 'Appetizers', isAlcohol: false, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1564093497595-593b96d80180?w=300' },
  { id: 'm5', restaurantId: 'r1', name: 'Spicy Tuna Roll', description: 'Fresh tuna, sriracha mayo, cucumber', price: 13.99, category: 'Rolls', isAlcohol: false, dietaryTags: [], pairingSuggestions: ['Asahi Beer'], image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=300' },
  { id: 'm6', restaurantId: 'r1', name: 'Asahi Beer', description: 'Japanese lager, 22oz bottle', price: 7.99, category: 'Drinks', isAlcohol: true, dietaryTags: ['vegan'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300' },

  // Bella Napoli
  { id: 'm7', restaurantId: 'r2', name: 'Margherita Pizza', description: 'San Marzano tomatoes, fresh mozzarella, basil', price: 14.99, category: 'Pizza', isAlcohol: false, dietaryTags: ['vegetarian'], pairingSuggestions: ['Chianti Classico'], image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300' },
  { id: 'm8', restaurantId: 'r2', name: 'Pepperoni Pizza', description: 'Pepperoni, mozzarella, house marinara', price: 16.99, category: 'Pizza', isAlcohol: false, dietaryTags: [], pairingSuggestions: ['Montepulciano'], image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=300' },
  { id: 'm9', restaurantId: 'r2', name: 'Chianti Classico', description: 'Italian red wine, 750ml bottle', price: 24.99, category: 'Wine', isAlcohol: true, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=300' },
  { id: 'm10', restaurantId: 'r2', name: 'Tiramisu', description: 'Classic Italian dessert with espresso and mascarpone', price: 9.99, category: 'Desserts', isAlcohol: false, dietaryTags: ['vegetarian'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300' },
  { id: 'm11', restaurantId: 'r2', name: 'Caesar Salad', description: 'Romaine, parmesan, croutons, house dressing', price: 10.99, category: 'Salads', isAlcohol: false, dietaryTags: ['vegetarian'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=300' },
  { id: 'm12', restaurantId: 'r2', name: 'Montepulciano', description: "Italian red wine, bold & fruity, 750ml", price: 22.99, category: 'Wine', isAlcohol: true, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300' },

  // El Taco Loco
  { id: 'm13', restaurantId: 'r3', name: 'Street Tacos', description: 'Three corn tortilla tacos, carne asada, onion, cilantro', price: 11.99, category: 'Tacos', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: ['Modelo Especial'], image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=300' },
  { id: 'm14', restaurantId: 'r3', name: 'Guacamole & Chips', description: 'Fresh avocado, lime, tomato, serrano pepper', price: 8.99, category: 'Appetizers', isAlcohol: false, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: ['Margarita Mix'], image: 'https://images.unsplash.com/photo-1615870216519-2f9fa575fa5c?w=300' },
  { id: 'm15', restaurantId: 'r3', name: 'Modelo Especial', description: 'Mexican lager, 6-pack', price: 12.99, category: 'Drinks', isAlcohol: true, dietaryTags: ['vegan'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1613145997970-db84a7975fbb?w=300' },
  { id: 'm16', restaurantId: 'r3', name: 'Burrito Bowl', description: 'Rice, black beans, grilled chicken, pico de gallo', price: 13.99, category: 'Bowls', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=300' },
  { id: 'm17', restaurantId: 'r3', name: 'Patron Silver Tequila', description: 'Premium tequila, 375ml', price: 29.99, category: 'Spirits', isAlcohol: true, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: ['Lime', 'Salt'], image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=300' },

  // Golden Dragon
  { id: 'm18', restaurantId: 'r4', name: 'Kung Pao Chicken', description: 'Spicy chicken with peanuts, bell peppers, and chili', price: 14.99, category: 'Entrees', isAlcohol: false, dietaryTags: [], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=300' },
  { id: 'm19', restaurantId: 'r4', name: 'Vegetable Lo Mein', description: 'Stir-fried noodles with seasonal vegetables', price: 12.99, category: 'Noodles', isAlcohol: false, dietaryTags: ['vegan'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=300' },
  { id: 'm20', restaurantId: 'r4', name: 'Spring Rolls', description: 'Crispy vegetable spring rolls, 4 pieces', price: 7.99, category: 'Appetizers', isAlcohol: false, dietaryTags: ['vegan'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300' },
  { id: 'm21', restaurantId: 'r4', name: 'Fried Rice', description: 'Egg fried rice with vegetables and soy sauce', price: 10.99, category: 'Rice', isAlcohol: false, dietaryTags: ['vegetarian'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=300' },

  // Spice Route
  { id: 'm22', restaurantId: 'r5', name: 'Butter Chicken', description: 'Tender chicken in creamy tomato sauce with spices', price: 16.99, category: 'Curries', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=300' },
  { id: 'm23', restaurantId: 'r5', name: 'Garlic Naan', description: 'Fresh baked naan with garlic butter', price: 4.99, category: 'Breads', isAlcohol: false, dietaryTags: ['vegetarian'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300' },
  { id: 'm24', restaurantId: 'r5', name: 'Samosas', description: 'Crispy pastry with spiced potato filling, 3 pieces', price: 6.99, category: 'Appetizers', isAlcohol: false, dietaryTags: ['vegan'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300' },
  { id: 'm25', restaurantId: 'r5', name: 'Paneer Tikka', description: 'Grilled cottage cheese with peppers and spices', price: 14.99, category: 'Appetizers', isAlcohol: false, dietaryTags: ['vegetarian', 'gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300' },

  // Vine & Barrel
  { id: 'm26', restaurantId: 'r6', name: 'Napa Valley Cabernet', description: 'Full-bodied California red, 750ml', price: 34.99, category: 'Red Wine', isAlcohol: true, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: ['Cheese Board'], image: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300' },
  { id: 'm27', restaurantId: 'r6', name: 'Sauvignon Blanc', description: 'Crisp New Zealand white, 750ml', price: 19.99, category: 'White Wine', isAlcohol: true, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: ['Bruschetta'], image: 'https://images.unsplash.com/photo-1558001373-7b93ee48ffa0?w=300' },
  { id: 'm28', restaurantId: 'r6', name: 'Cheese Board', description: 'Artisanal cheeses, crackers, honey, figs', price: 18.99, category: 'Platters', isAlcohol: false, dietaryTags: ['vegetarian', 'gluten-free'], pairingSuggestions: ['Napa Valley Cabernet'], image: 'https://images.unsplash.com/photo-1452195100486-9cc805987862?w=300' },
  { id: 'm29', restaurantId: 'r6', name: 'Bruschetta', description: 'Toasted bread with tomatoes, basil, balsamic', price: 10.99, category: 'Appetizers', isAlcohol: false, dietaryTags: ['vegan'], pairingSuggestions: ['Sauvignon Blanc'], image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=300' },
  { id: 'm30', restaurantId: 'r6', name: 'Prosecco', description: 'Italian sparkling wine, 750ml', price: 22.99, category: 'Sparkling', isAlcohol: true, dietaryTags: ['vegan', 'gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=300' },

  // Bangkok Bites
  { id: 'm31', restaurantId: 'r7', name: 'Pad Thai', description: 'Rice noodles, shrimp, peanuts, bean sprouts', price: 14.99, category: 'Noodles', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: ['Singha Beer'], image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=300' },
  { id: 'm32', restaurantId: 'r7', name: 'Green Curry', description: 'Coconut milk curry with chicken and Thai basil', price: 15.99, category: 'Curries', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=300' },
  { id: 'm33', restaurantId: 'r7', name: 'Singha Beer', description: 'Thai lager, 22oz bottle', price: 6.99, category: 'Drinks', isAlcohol: true, dietaryTags: ['vegan'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300' },
  { id: 'm34', restaurantId: 'r7', name: 'Tom Yum Soup', description: 'Spicy shrimp soup with lemongrass and galangal', price: 8.99, category: 'Soups', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=300' },

  // Craft & Tap
  { id: 'm35', restaurantId: 'r8', name: 'IPA Flight', description: 'Four 5oz pours of craft IPAs', price: 14.99, category: 'Beer', isAlcohol: true, dietaryTags: ['vegan'], pairingSuggestions: ['Loaded Nachos'], image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300' },
  { id: 'm36', restaurantId: 'r8', name: 'Loaded Nachos', description: 'Tortilla chips, cheddar, jalapeños, sour cream', price: 12.99, category: 'Appetizers', isAlcohol: false, dietaryTags: ['vegetarian', 'gluten-free'], pairingSuggestions: ['IPA Flight'], image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300' },
  { id: 'm37', restaurantId: 'r8', name: 'Smoked Wings', description: 'Hickory smoked wings, choice of sauce, 10 pieces', price: 15.99, category: 'Entrees', isAlcohol: false, dietaryTags: ['gluten-free'], pairingSuggestions: ['Craft Stout'], image: 'https://images.unsplash.com/photo-1527477396000-e27163b4f35f?w=300' },
  { id: 'm38', restaurantId: 'r8', name: 'Craft Stout', description: 'Rich chocolate stout, 16oz pour', price: 8.99, category: 'Beer', isAlcohol: true, dietaryTags: ['vegan'], pairingSuggestions: [], image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=300' },
];

export const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: 'credit-card', sublabel: 'Visa ending 4242' },
  { id: 'cashapp', label: 'Cash App Pay', icon: 'dollar-sign', sublabel: '$CryptoEats' },
  { id: 'escrow', label: 'USDC Escrow (Base)', icon: 'lock', sublabel: 'Smart contract secured' },
  { id: 'bitcoin', label: 'Bitcoin', icon: 'zap', sublabel: 'via Coinbase' },
  { id: 'ethereum', label: 'Ethereum', icon: 'hexagon', sublabel: 'via Coinbase' },
  { id: 'usdc', label: 'USDC', icon: 'disc', sublabel: 'via Coinbase' },
];

export const DRIVER_NAMES = ['Marcus J.', 'Sofia R.', 'Jayden K.', 'Aria L.', 'Noah T.'];
export const DRIVER_VEHICLES = ['Toyota Camry', 'Honda Civic', 'Tesla Model 3', 'Hyundai Elantra', 'Ford Maverick'];

export function getMenuForRestaurant(restaurantId: string): MenuItem[] {
  return MENU_ITEMS.filter(item => item.restaurantId === restaurantId);
}

export function getMenuCategories(restaurantId: string): string[] {
  const items = getMenuForRestaurant(restaurantId);
  return [...new Set(items.map(item => item.category))];
}

export function getRestaurant(id: string): Restaurant | undefined {
  return RESTAURANTS.find(r => r.id === id);
}

export const MIAMI_DADE_TAX_RATE = 0.07;
export const SERVICE_FEE_RATE = 0.12;

export function calculateOrderTotals(items: CartItem[], tip: number, restaurant?: Restaurant) {
  const subtotal = items.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const deliveryFee = restaurant?.deliveryFee ?? 2.99;
  const serviceFee = parseFloat((subtotal * SERVICE_FEE_RATE).toFixed(2));
  const taxableAmount = subtotal + deliveryFee + serviceFee;
  const tax = parseFloat((taxableAmount * MIAMI_DADE_TAX_RATE).toFixed(2));
  const total = parseFloat((subtotal + deliveryFee + serviceFee + tax + tip).toFixed(2));

  return { subtotal, deliveryFee, serviceFee, tax, taxRate: MIAMI_DADE_TAX_RATE, total, taxableAmount };
}
