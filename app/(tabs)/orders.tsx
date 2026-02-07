import React, { useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useCart } from '@/lib/cart-context';
import { Order } from '@/lib/data';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  confirmed: { label: 'Confirmed', color: Colors.dark.accent, icon: 'check-circle' },
  preparing: { label: 'Preparing', color: Colors.dark.orange, icon: 'clock' },
  picked_up: { label: 'Picked up', color: Colors.dark.yellow, icon: 'truck' },
  arriving: { label: 'Arriving', color: Colors.dark.green, icon: 'navigation' },
  delivered: { label: 'Delivered', color: Colors.dark.textSecondary, icon: 'package' },
};

function OrderCard({ order }: { order: Order }) {
  const c = Colors.dark;
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Pressable
      style={({ pressed }) => [styles.orderCard, { backgroundColor: c.surface, opacity: pressed ? 0.9 : 1 }]}
      onPress={() => {
        if (order.status !== 'delivered') {
          router.push({ pathname: '/tracking/[id]', params: { id: order.id } });
        }
      }}
    >
      <View style={styles.orderTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.restaurantName, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{order.restaurantName}</Text>
          <Text style={[styles.date, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{dateStr}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: config.color + '22' }]}>
          <Feather name={config.icon as any} size={12} color={config.color} />
          <Text style={[styles.statusText, { color: config.color, fontFamily: 'DMSans_600SemiBold' }]}>{config.label}</Text>
        </View>
      </View>

      <View style={styles.orderItems}>
        {order.items.slice(0, 3).map((item, i) => (
          <Text key={i} style={[styles.itemText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            {item.quantity}x {item.menuItem.name}
          </Text>
        ))}
        {order.items.length > 3 && (
          <Text style={[styles.itemText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            +{order.items.length - 3} more items
          </Text>
        )}
      </View>

      <View style={styles.orderBottom}>
        <Text style={[styles.total, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>${order.total.toFixed(2)}</Text>
        <View style={styles.paymentRow}>
          <Feather
            name={order.paymentMethod === 'bitcoin' || order.paymentMethod === 'ethereum' || order.paymentMethod === 'usdc' ? 'zap' : 'credit-card'}
            size={12}
            color={c.textTertiary}
          />
          <Text style={[styles.paymentText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            {order.paymentMethod === 'card' ? 'Card' : order.paymentMethod === 'cashapp' ? 'Cash App' : order.paymentMethod.toUpperCase()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { orders, loadOrders } = useCart();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 84 : 100 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={56} color={c.textTertiary} />
            <Text style={[styles.emptyTitle, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>No orders yet</Text>
            <Text style={[styles.emptyText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              Your order history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28 },
  list: { paddingHorizontal: 20 },
  orderCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  orderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  restaurantName: { fontSize: 16 },
  date: { fontSize: 12, marginTop: 2 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: { fontSize: 12 },
  orderItems: { gap: 2 },
  itemText: { fontSize: 13 },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: 10,
  },
  total: { fontSize: 17 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paymentText: { fontSize: 12 },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
