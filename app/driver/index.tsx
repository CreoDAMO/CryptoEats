import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

interface OrderItem {
  id: string;
  restaurant: string;
  customerAddress: string;
  items: string[];
  itemCount: number;
  specialInstructions: string;
  basePay: number;
  tip: number;
  distance: string;
  isAlcohol: boolean;
  status: 'available' | 'accepted' | 'picked_up' | 'arrived' | 'verify_age' | 'delivered';
}

const ACTIVE_ORDER: OrderItem = {
  id: '1',
  restaurant: 'Cuban Corner',
  customerAddress: '742 Evergreen Terrace, Miami, FL 33101',
  items: ['Ropa Vieja', 'Tostones'],
  itemCount: 2,
  specialInstructions: 'Ring doorbell twice. Leave at door.',
  basePay: 4.50,
  tip: 3.00,
  distance: '2.3 mi',
  isAlcohol: false,
  status: 'accepted',
};

const AVAILABLE_ORDERS: OrderItem[] = [
  {
    id: '2',
    restaurant: 'Sakura Sushi Bar',
    customerAddress: '1550 Collins Ave, Miami Beach, FL 33139',
    items: ['Dragon Roll', 'Miso Soup', 'Edamame'],
    itemCount: 3,
    specialInstructions: '',
    basePay: 5.75,
    tip: 4.00,
    distance: '3.1 mi',
    isAlcohol: false,
    status: 'available',
  },
  {
    id: '3',
    restaurant: 'Wine & Dine Bistro',
    customerAddress: '800 Brickell Ave, Miami, FL 33131',
    items: ['Steak Frites', 'Pinot Noir Bottle'],
    itemCount: 2,
    specialInstructions: 'Must verify age - contains alcohol',
    basePay: 6.25,
    tip: 5.50,
    distance: '1.8 mi',
    isAlcohol: true,
    status: 'available',
  },
  {
    id: '4',
    restaurant: 'Taco Loco',
    customerAddress: '220 NW 8th Ave, Miami, FL 33128',
    items: ['Burrito Bowl', 'Chips & Guac', 'Horchata', 'Churros'],
    itemCount: 4,
    specialInstructions: 'Call on arrival',
    basePay: 3.50,
    tip: 2.00,
    distance: '4.5 mi',
    isAlcohol: false,
    status: 'available',
  },
];

const STATUS_FLOW = ['accepted', 'picked_up', 'arrived', 'delivered'] as const;
const STATUS_LABELS: Record<string, string> = {
  accepted: 'Picked Up',
  picked_up: 'Arrived',
  arrived: 'Delivered',
};

export default function DriverOrdersScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [isOnline, setIsOnline] = useState(true);
  const [activeOrder, setActiveOrder] = useState<OrderItem | null>(ACTIVE_ORDER);
  const [availableOrders, setAvailableOrders] = useState<OrderItem[]>(AVAILABLE_ORDERS);
  const [needsAgeVerify, setNeedsAgeVerify] = useState(false);

  const handleToggleOnline = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOnline(!isOnline);
  };

  const handleAcceptOrder = (order: OrderItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveOrder({ ...order, status: 'accepted' });
    setAvailableOrders(prev => prev.filter(o => o.id !== order.id));
  };

  const handleAdvanceStatus = () => {
    if (!activeOrder) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (activeOrder.status === 'arrived' && activeOrder.isAlcohol && !needsAgeVerify) {
      setNeedsAgeVerify(true);
      return;
    }

    const currentIdx = STATUS_FLOW.indexOf(activeOrder.status as any);
    if (currentIdx < STATUS_FLOW.length - 1) {
      setActiveOrder({ ...activeOrder, status: STATUS_FLOW[currentIdx + 1] });
      setNeedsAgeVerify(false);
    } else {
      setActiveOrder(null);
      setNeedsAgeVerify(false);
    }
  };

  const handleVerifyAge = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setNeedsAgeVerify(false);
    setActiveOrder(prev => prev ? { ...prev, status: 'delivered' } : null);
    setTimeout(() => setActiveOrder(null), 1000);
  };

  const getNextActionLabel = () => {
    if (!activeOrder) return '';
    if (needsAgeVerify) return 'Verify Age';
    return STATUS_LABELS[activeOrder.status] || 'Complete';
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Heading to restaurant';
      case 'picked_up': return 'On the way to customer';
      case 'arrived': return 'At delivery location';
      case 'delivered': return 'Delivered!';
      default: return status;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 84 : insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusToggle, { backgroundColor: isOnline ? c.greenLight : c.surfaceElevated }]}>
          <View style={styles.statusToggleLeft}>
            <View style={[styles.statusDot, { backgroundColor: isOnline ? c.green : c.textTertiary }]} />
            <Text style={[styles.statusText, { color: isOnline ? c.green : c.textTertiary, fontFamily: 'DMSans_600SemiBold' }]}>
              {isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
          <Switch
            value={isOnline}
            onValueChange={handleToggleOnline}
            trackColor={{ false: c.border, true: c.green }}
            thumbColor="#fff"
          />
        </View>

        {!isOnline && (
          <View style={[styles.offlineBanner, { backgroundColor: c.surface }]}>
            <Feather name="moon" size={24} color={c.textTertiary} />
            <Text style={[styles.offlineText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>
              You're offline. Toggle online to receive orders.
            </Text>
          </View>
        )}

        {activeOrder && (
          <View style={[styles.activeCard, { backgroundColor: c.surface, borderColor: c.accent, borderWidth: 1 }]}>
            <View style={styles.activeCardHeader}>
              <Feather name="navigation" size={16} color={c.accent} />
              <Text style={[styles.activeLabel, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>Active Delivery</Text>
              <View style={[styles.statusBadge, { backgroundColor: c.accentLight }]}>
                <Text style={[styles.statusBadgeText, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>
                  {getStatusLabel(activeOrder.status)}
                </Text>
              </View>
            </View>

            <View style={styles.activeRestaurantRow}>
              <Ionicons name="restaurant-outline" size={18} color={c.orange} />
              <Text style={[styles.activeRestaurant, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{activeOrder.restaurant}</Text>
            </View>

            <View style={styles.activeDetailRow}>
              <Feather name="map-pin" size={14} color={c.textTertiary} />
              <Text style={[styles.activeAddress, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{activeOrder.customerAddress}</Text>
            </View>

            <View style={styles.activeDetailRow}>
              <Feather name="shopping-bag" size={14} color={c.textTertiary} />
              <Text style={[styles.activeItems, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{activeOrder.items.join(', ')}</Text>
            </View>

            {activeOrder.specialInstructions ? (
              <View style={[styles.instructionsBox, { backgroundColor: c.background }]}>
                <Feather name="info" size={14} color={c.yellow} />
                <Text style={[styles.instructionsText, { color: c.yellow, fontFamily: 'DMSans_400Regular' }]}>
                  {activeOrder.specialInstructions}
                </Text>
              </View>
            ) : null}

            <View style={styles.payRow}>
              <Text style={[styles.payLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Estimated pay</Text>
              <Text style={[styles.payAmount, { color: c.green, fontFamily: 'DMSans_700Bold' }]}>
                ${(activeOrder.basePay + activeOrder.tip).toFixed(2)}
              </Text>
            </View>

            {activeOrder.isAlcohol && (
              <View style={[styles.alcoholBadge, { backgroundColor: c.orangeLight }]}>
                <MaterialIcons name="local-bar" size={16} color={c.orange} />
                <Text style={[styles.alcoholText, { color: c.orange, fontFamily: 'DMSans_500Medium' }]}>
                  Age verification required
                </Text>
              </View>
            )}

            {needsAgeVerify ? (
              <Pressable
                onPress={handleVerifyAge}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: c.orange, opacity: pressed ? 0.8 : 1 }]}
              >
                <MaterialIcons name="verified-user" size={20} color="#000" />
                <Text style={[styles.actionBtnText, { fontFamily: 'DMSans_700Bold' }]}>Verify Age</Text>
              </Pressable>
            ) : activeOrder.status !== 'delivered' ? (
              <Pressable
                onPress={handleAdvanceStatus}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 }]}
              >
                <Feather name="check-circle" size={20} color="#000" />
                <Text style={[styles.actionBtnText, { fontFamily: 'DMSans_700Bold' }]}>{getNextActionLabel()}</Text>
              </Pressable>
            ) : (
              <View style={[styles.deliveredBanner, { backgroundColor: c.greenLight }]}>
                <Ionicons name="checkmark-circle" size={20} color={c.green} />
                <Text style={[styles.deliveredText, { color: c.green, fontFamily: 'DMSans_600SemiBold' }]}>Delivered!</Text>
              </View>
            )}
          </View>
        )}

        {isOnline && (
          <>
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
              Available Orders
            </Text>
            {availableOrders.length === 0 ? (
              <View style={[styles.emptyState, { backgroundColor: c.surface }]}>
                <Feather name="inbox" size={32} color={c.textTertiary} />
                <Text style={[styles.emptyText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>
                  No orders available right now
                </Text>
              </View>
            ) : (
              availableOrders.map(order => (
                <View key={order.id} style={[styles.orderCard, { backgroundColor: c.surface }]}>
                  <View style={styles.orderCardTop}>
                    <View style={styles.orderCardInfo}>
                      <Text style={[styles.orderRestaurant, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                        {order.restaurant}
                      </Text>
                      <View style={styles.orderMeta}>
                        <Feather name="map-pin" size={12} color={c.textTertiary} />
                        <Text style={[styles.orderAddress, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]} numberOfLines={1}>
                          {order.customerAddress}
                        </Text>
                      </View>
                      <View style={styles.orderMeta}>
                        <Feather name="shopping-bag" size={12} color={c.textTertiary} />
                        <Text style={[styles.orderItemCount, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                          {order.itemCount} items
                        </Text>
                        {order.isAlcohol && (
                          <View style={[styles.alcoholTag, { backgroundColor: c.orangeLight }]}>
                            <MaterialIcons name="local-bar" size={10} color={c.orange} />
                            <Text style={[styles.alcoholTagText, { color: c.orange, fontFamily: 'DMSans_500Medium' }]}>21+</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={styles.orderCardRight}>
                      <Text style={[styles.orderPay, { color: c.green, fontFamily: 'DMSans_700Bold' }]}>
                        ${(order.basePay + order.tip).toFixed(2)}
                      </Text>
                      <Text style={[styles.orderDistance, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                        {order.distance}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleAcceptOrder(order)}
                    disabled={!!activeOrder}
                    style={({ pressed }) => [
                      styles.acceptBtn,
                      { backgroundColor: activeOrder ? c.surfaceElevated : c.accent, opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Feather name="check" size={18} color={activeOrder ? c.textTertiary : '#000'} />
                    <Text style={[styles.acceptBtnText, { color: activeOrder ? c.textTertiary : '#000', fontFamily: 'DMSans_600SemiBold' }]}>
                      {activeOrder ? 'Complete active order first' : 'Accept'}
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  statusToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 16,
  },
  statusToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: { fontSize: 16 },
  offlineBanner: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  offlineText: { fontSize: 14, textAlign: 'center' },
  activeCard: {
    borderRadius: 16,
    padding: 18,
    gap: 12,
  },
  activeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeLabel: { fontSize: 14 },
  statusBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: { fontSize: 11 },
  activeRestaurantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeRestaurant: { fontSize: 18 },
  activeDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 2,
  },
  activeAddress: { fontSize: 13, flex: 1 },
  activeItems: { fontSize: 13, flex: 1 },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  instructionsText: { fontSize: 12, flex: 1 },
  payRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payLabel: { fontSize: 13 },
  payAmount: { fontSize: 20 },
  alcoholBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  alcoholText: { fontSize: 12 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  actionBtnText: { fontSize: 16, color: '#000' },
  deliveredBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  deliveredText: { fontSize: 16 },
  sectionTitle: { fontSize: 18, marginTop: 4 },
  emptyState: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 14 },
  orderCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  orderCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderCardInfo: {
    flex: 1,
    gap: 6,
  },
  orderRestaurant: { fontSize: 16 },
  orderMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orderAddress: { fontSize: 12, flex: 1 },
  orderItemCount: { fontSize: 12 },
  alcoholTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  alcoholTagText: { fontSize: 10 },
  orderCardRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  orderPay: { fontSize: 18 },
  orderDistance: { fontSize: 12 },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  acceptBtnText: { fontSize: 14 },
});
