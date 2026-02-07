import React, { useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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

function OrderCard({ order, onReorder, onRate }: { order: Order; onReorder: () => void; onRate: () => void }) {
  const c = Colors.dark;
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.confirmed;
  const date = new Date(order.createdAt);
  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const isDelivered = order.status === 'delivered';

  return (
    <Pressable
      style={({ pressed }) => [styles.orderCard, { backgroundColor: c.surface, opacity: pressed ? 0.9 : 1 }]}
      onPress={() => {
        if (!isDelivered) {
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
        {order.items.map((item, i) => (
          <View key={i} style={styles.itemRow}>
            <Text style={[styles.itemText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular', flex: 1 }]}>
              {item.quantity}x {item.menuItem.name}
            </Text>
            <Text style={[styles.itemPrice, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              ${(item.menuItem.price * item.quantity).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.orderBottom}>
        <Text style={[styles.total, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>${order.total.toFixed(2)}</Text>
        <View style={styles.actionsRow}>
          {isDelivered && (
            <>
              {!order.rated && (
                <Pressable
                  onPress={(e) => { e.stopPropagation(); onRate(); }}
                  style={({ pressed }) => [styles.actionBtn, { backgroundColor: c.yellowLight, opacity: pressed ? 0.7 : 1 }]}
                  hitSlop={4}
                >
                  <Ionicons name="star-outline" size={16} color={c.yellow} />
                </Pressable>
              )}
              <Pressable
                onPress={(e) => { e.stopPropagation(); onReorder(); }}
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: c.accentLight, opacity: pressed ? 0.7 : 1 }]}
                hitSlop={4}
              >
                <Feather name="refresh-cw" size={15} color={c.accent} />
              </Pressable>
            </>
          )}
          {!isDelivered && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                router.push({ pathname: '/chat/[orderId]', params: { orderId: order.id } });
              }}
              style={({ pressed }) => [styles.actionBtn, { backgroundColor: c.accentLight, opacity: pressed ? 0.7 : 1 }]}
              hitSlop={4}
            >
              <Feather name="message-circle" size={15} color={c.accent} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default function OrdersScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { orders, loadOrders, reorderFromHistory } = useCart();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleReorder = (order: Order) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    reorderFromHistory(order);
    router.push('/(tabs)/cart');
  };

  const handleRate = (order: Order) => {
    router.push({ pathname: '/review/[orderId]', params: { orderId: order.id } });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.title, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Orders</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            onReorder={() => handleReorder(item)}
            onRate={() => handleRate(item)}
          />
        )}
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
  orderItems: { gap: 4 },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: { fontSize: 13 },
  itemPrice: { fontSize: 12 },
  orderBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
    paddingTop: 10,
  },
  total: { fontSize: 17 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 10,
  },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
