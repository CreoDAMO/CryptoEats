import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Pressable, Platform, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/lib/cart-context';
import { Order } from '@/lib/data';

const STATUSES: { key: Order['status']; label: string; icon: string; description: string }[] = [
  { key: 'confirmed', label: 'Order Confirmed', icon: 'check-circle', description: 'Your order has been received' },
  { key: 'preparing', label: 'Preparing', icon: 'clock', description: 'The restaurant is making your food' },
  { key: 'picked_up', label: 'Picked Up', icon: 'package', description: 'Driver has picked up your order' },
  { key: 'arriving', label: 'On the Way', icon: 'navigation', description: 'Your driver is heading to you' },
  { key: 'delivered', label: 'Delivered', icon: 'check', description: 'Enjoy your meal!' },
];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { orders, updateOrderStatus } = useCart();

  const order = orders.find(o => o.id === id);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (order) {
      const idx = STATUSES.findIndex(s => s.key === order.status);
      setCurrentStatusIndex(idx >= 0 ? idx : 0);
    }
  }, [order?.status]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: currentStatusIndex / (STATUSES.length - 1),
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [currentStatusIndex, progressAnim]);

  useEffect(() => {
    if (!order || order.status === 'delivered') return;

    const statusOrder: Order['status'][] = ['confirmed', 'preparing', 'picked_up', 'arriving', 'delivered'];
    const currentIdx = statusOrder.indexOf(order.status);

    const timers: ReturnType<typeof setTimeout>[] = [];

    statusOrder.slice(currentIdx + 1).forEach((status, i) => {
      const timer = setTimeout(() => {
        updateOrderStatus(order.id, status);
        Haptics.notificationAsync(
          status === 'delivered'
            ? Haptics.NotificationFeedbackType.Success
            : Haptics.NotificationFeedbackType.Warning
        );
      }, (i + 1) * 5000);
      timers.push(timer);
    });

    return () => timers.forEach(clearTimeout);
  }, [order?.id]);

  if (!order) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 4 }]}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={c.text} />
          </Pressable>
        </View>
        <View style={styles.centerContent}>
          <Text style={{ color: c.textSecondary }}>Order not found</Text>
        </View>
      </View>
    );
  }

  const isDelivered = order.status === 'delivered';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.replace('/(tabs)')}>
          <Feather name="x" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
          {isDelivered ? 'Order Complete' : 'Live Tracking'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.statusCard, { backgroundColor: c.surface }]}>
          <View style={styles.statusCardTop}>
            {!isDelivered && (
              <Animated.View style={[styles.pulseCircle, { backgroundColor: c.accentLight, transform: [{ scale: pulseAnim }] }]}>
                <View style={[styles.statusDot, { backgroundColor: c.accent }]} />
              </Animated.View>
            )}
            {isDelivered && (
              <View style={[styles.deliveredCircle, { backgroundColor: c.greenLight }]}>
                <Ionicons name="checkmark" size={28} color={c.green} />
              </View>
            )}
            <Text style={[styles.currentStatus, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
              {STATUSES[currentStatusIndex]?.label}
            </Text>
            <Text style={[styles.statusDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              {STATUSES[currentStatusIndex]?.description}
            </Text>
          </View>

          <View style={styles.progressContainer}>
            <View style={[styles.progressBg, { backgroundColor: c.surfaceElevated }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: c.accent,
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
            <View style={styles.progressDots}>
              {STATUSES.map((status, i) => (
                <View
                  key={status.key}
                  style={[
                    styles.dot,
                    {
                      backgroundColor: i <= currentStatusIndex ? c.accent : c.surfaceElevated,
                      borderColor: i <= currentStatusIndex ? c.accent : c.border,
                    },
                  ]}
                />
              ))}
            </View>
          </View>

          <View style={styles.statusList}>
            {STATUSES.map((status, i) => {
              const done = i <= currentStatusIndex;
              const current = i === currentStatusIndex;
              return (
                <View key={status.key} style={styles.statusItem}>
                  <View style={[styles.statusIcon, { backgroundColor: done ? c.accentLight : c.surfaceElevated }]}>
                    <Feather name={status.icon as any} size={14} color={done ? c.accent : c.textTertiary} />
                  </View>
                  <Text style={[
                    styles.statusLabel,
                    {
                      color: done ? c.text : c.textTertiary,
                      fontFamily: current ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                    },
                  ]}>
                    {status.label}
                  </Text>
                  {done && <Ionicons name="checkmark" size={16} color={c.accent} />}
                </View>
              );
            })}
          </View>
        </View>

        {!isDelivered && (
          <View style={[styles.driverCard, { backgroundColor: c.surface }]}>
            <View style={[styles.driverAvatar, { backgroundColor: c.accent }]}>
              <Text style={[styles.driverInitial, { fontFamily: 'DMSans_700Bold' }]}>{order.driverName[0]}</Text>
            </View>
            <View style={styles.driverInfo}>
              <Text style={[styles.driverName, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{order.driverName}</Text>
              <View style={styles.driverMeta}>
                <Ionicons name="star" size={12} color={c.yellow} />
                <Text style={[styles.driverRating, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                  {order.driverRating.toFixed(1)}
                </Text>
                <Text style={[styles.driverDot, { color: c.textTertiary }]}>&middot;</Text>
                <Text style={[styles.driverVehicle, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{order.driverVehicle}</Text>
              </View>
            </View>
            <Pressable style={[styles.contactBtn, { backgroundColor: c.accentLight }]}>
              <Feather name="message-circle" size={18} color={c.accent} />
            </Pressable>
          </View>
        )}

        <View style={[styles.orderSummary, { backgroundColor: c.surface }]}>
          <Text style={[styles.summaryTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
            {order.restaurantName}
          </Text>
          {order.items.map((item, i) => (
            <View key={i} style={styles.summaryItem}>
              <Text style={[styles.summaryItemQty, { color: c.textTertiary, fontFamily: 'DMSans_500Medium' }]}>
                {item.quantity}x
              </Text>
              <Text style={[styles.summaryItemName, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                {item.menuItem.name}
              </Text>
              <Text style={[styles.summaryItemPrice, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>
                ${(item.menuItem.price * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={[styles.summaryTotal, { borderTopColor: c.border }]}>
            <Text style={[styles.summaryTotalLabel, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Total</Text>
            <Text style={[styles.summaryTotalValue, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>${order.total.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18 },
  content: { flex: 1, paddingHorizontal: 20, gap: 14 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statusCard: {
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  statusCardTop: { alignItems: 'center', gap: 8 },
  pulseCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  deliveredCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStatus: { fontSize: 22 },
  statusDesc: { fontSize: 14 },
  progressContainer: { gap: 6 },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  statusList: { gap: 10 },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: { flex: 1, fontSize: 14 },
  driverCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  driverAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverInitial: { fontSize: 18, color: '#000' },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 15 },
  driverMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  driverRating: { fontSize: 13 },
  driverDot: { fontSize: 13 },
  driverVehicle: { fontSize: 13 },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderSummary: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  summaryTitle: { fontSize: 16, marginBottom: 4 },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryItemQty: { fontSize: 13, width: 24 },
  summaryItemName: { flex: 1, fontSize: 13 },
  summaryItemPrice: { fontSize: 13 },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  summaryTotalLabel: { fontSize: 16 },
  summaryTotalValue: { fontSize: 16 },
});
