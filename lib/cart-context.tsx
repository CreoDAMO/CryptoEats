import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, MenuItem, Order, RESTAURANTS, DRIVER_NAMES, DRIVER_VEHICLES, calculateOrderTotals } from './data';
import * as Crypto from 'expo-crypto';
import { apiRequest } from './query-client';

interface CartContextValue {
  items: CartItem[];
  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  tip: number;
  setTip: (tip: number) => void;
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  hasAlcohol: boolean;
  ageVerified: boolean;
  setAgeVerified: (v: boolean) => void;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  tax: number;
  total: number;
  taxRate: number;
  currentRestaurantId: string | null;
  placeOrder: (deliveryAddress: string) => Promise<Order>;
  orders: Order[];
  loadOrders: () => Promise<void>;
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  specialInstructions: string;
  setSpecialInstructions: (v: string) => void;
  reorderFromHistory: (order: Order) => void;
  markOrderRated: (orderId: string) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [tip, setTip] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [ageVerified, setAgeVerified] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState('');

  const currentRestaurantId = items.length > 0 ? items[0].restaurantId : null;

  const hasAlcohol = useMemo(() => items.some(i => i.menuItem.isAlcohol), [items]);

  const restaurant = currentRestaurantId ? RESTAURANTS.find(r => r.id === currentRestaurantId) : undefined;
  const totals = useMemo(() => calculateOrderTotals(items, tip, restaurant), [items, tip, restaurant]);

  const addItem = useCallback((item: MenuItem, restaurantId: string, restaurantName: string) => {
    setItems(prev => {
      if (prev.length > 0 && prev[0].restaurantId !== restaurantId) {
        return [{ menuItem: item, quantity: 1, restaurantId, restaurantName }];
      }
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1, restaurantId, restaurantName }];
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.menuItem.id !== itemId));
  }, []);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.menuItem.id !== itemId));
    } else {
      setItems(prev => prev.map(i => i.menuItem.id === itemId ? { ...i, quantity } : i));
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setTip(0);
    setAgeVerified(false);
    setSpecialInstructions('');
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('cryptoeats_orders');
      if (stored) setOrders(JSON.parse(stored));
    } catch {}
  }, []);

  const placeOrder = useCallback(async (deliveryAddress: string): Promise<Order> => {
    const orderPayload = {
      restaurantId: items[0]?.restaurantId ?? '',
      items: items.map(i => ({
        menuItemId: i.menuItem.id,
        name: i.menuItem.name,
        price: i.menuItem.price,
        quantity: i.quantity,
        isAlcohol: i.menuItem.isAlcohol || false,
      })),
      deliveryAddress,
      specialInstructions: specialInstructions || undefined,
      paymentMethod,
      tip,
      ageVerified,
    };

    try {
      const res = await apiRequest('POST', '/api/orders', orderPayload);
      const serverOrder = await res.json();

      const driverIndex = Math.floor(Math.random() * DRIVER_NAMES.length);
      const order: Order = {
        id: serverOrder.id,
        restaurantName: items[0]?.restaurantName ?? '',
        restaurantId: serverOrder.restaurantId || items[0]?.restaurantId || '',
        items: [...items],
        subtotal: parseFloat(serverOrder.subtotal) || totals.subtotal,
        deliveryFee: parseFloat(serverOrder.deliveryFee) || totals.deliveryFee,
        serviceFee: parseFloat(serverOrder.serviceFee) || totals.serviceFee,
        tax: parseFloat(serverOrder.taxCollected) || totals.tax,
        taxRate: parseFloat(serverOrder.taxRate) || totals.taxRate,
        tip: parseFloat(serverOrder.tip) || tip,
        total: parseFloat(serverOrder.total) || totals.total,
        status: serverOrder.status || 'confirmed',
        paymentMethod: serverOrder.paymentMethod || paymentMethod,
        createdAt: serverOrder.createdAt || new Date().toISOString(),
        eta: serverOrder.eta || '25-35 min',
        driverName: DRIVER_NAMES[driverIndex],
        driverRating: 4.5 + Math.random() * 0.5,
        driverVehicle: DRIVER_VEHICLES[driverIndex],
        requiresAgeVerification: hasAlcohol,
        ageVerified,
        deliveryAddress,
        specialInstructions: specialInstructions || undefined,
      };

      const updatedOrders = [order, ...orders];
      setOrders(updatedOrders);
      setActiveOrder(order);
      await AsyncStorage.setItem('cryptoeats_orders', JSON.stringify(updatedOrders));
      clearCart();
      return order;
    } catch (apiErr) {
      const driverIndex = Math.floor(Math.random() * DRIVER_NAMES.length);
      const order: Order = {
        id: Crypto.randomUUID(),
        restaurantName: items[0]?.restaurantName ?? '',
        restaurantId: items[0]?.restaurantId ?? '',
        items: [...items],
        subtotal: totals.subtotal,
        deliveryFee: totals.deliveryFee,
        serviceFee: totals.serviceFee,
        tax: totals.tax,
        taxRate: totals.taxRate,
        tip,
        total: totals.total,
        status: 'confirmed',
        paymentMethod,
        createdAt: new Date().toISOString(),
        eta: '25-35 min',
        driverName: DRIVER_NAMES[driverIndex],
        driverRating: 4.5 + Math.random() * 0.5,
        driverVehicle: DRIVER_VEHICLES[driverIndex],
        requiresAgeVerification: hasAlcohol,
        ageVerified,
        deliveryAddress,
        specialInstructions: specialInstructions || undefined,
      };

      const updatedOrders = [order, ...orders];
      setOrders(updatedOrders);
      setActiveOrder(order);
      await AsyncStorage.setItem('cryptoeats_orders', JSON.stringify(updatedOrders));
      clearCart();
      return order;
    }
  }, [items, totals, tip, paymentMethod, hasAlcohol, ageVerified, orders, clearCart, specialInstructions]);

  const reorderFromHistory = useCallback((order: Order) => {
    setItems(order.items.map(i => ({ ...i })));
  }, []);

  const markOrderRated = useCallback((orderId: string) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, rated: true } : o);
      AsyncStorage.setItem('cryptoeats_orders', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const updateOrderStatus = useCallback((orderId: string, status: Order['status']) => {
    setOrders(prev => {
      const updated = prev.map(o => o.id === orderId ? { ...o, status, ...(status === 'delivered' ? { deliveredAt: new Date().toISOString() } : {}) } : o);
      AsyncStorage.setItem('cryptoeats_orders', JSON.stringify(updated));
      return updated;
    });
    setActiveOrder(prev => prev && prev.id === orderId ? { ...prev, status } : prev);
  }, []);

  const value = useMemo(() => ({
    items, addItem, removeItem, updateQuantity, clearCart,
    tip, setTip, paymentMethod, setPaymentMethod,
    hasAlcohol, ageVerified, setAgeVerified,
    subtotal: totals.subtotal, deliveryFee: totals.deliveryFee,
    serviceFee: totals.serviceFee, tax: totals.tax, total: totals.total,
    taxRate: totals.taxRate, currentRestaurantId,
    placeOrder, orders, loadOrders, activeOrder, setActiveOrder, updateOrderStatus,
    specialInstructions, setSpecialInstructions, reorderFromHistory, markOrderRated,
  }), [items, addItem, removeItem, updateQuantity, clearCart, tip, paymentMethod,
    hasAlcohol, ageVerified, totals, currentRestaurantId, placeOrder, orders,
    loadOrders, activeOrder, updateOrderStatus, specialInstructions, reorderFromHistory, markOrderRated]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
