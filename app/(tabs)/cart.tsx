import React from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/lib/cart-context';
import { CartItem } from '@/lib/data';

function CartItemRow({ item }: { item: CartItem }) {
  const c = Colors.dark;
  const { updateQuantity, removeItem } = useCart();

  return (
    <View style={[styles.itemRow, { backgroundColor: c.surface }]}>
      <View style={styles.itemInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.itemName, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]} numberOfLines={1}>
            {item.menuItem.name}
          </Text>
          {item.menuItem.isAlcohol && (
            <View style={[styles.alcBadge, { backgroundColor: c.accentLight }]}>
              <Text style={[styles.alcText, { color: c.accent }]}>21+</Text>
            </View>
          )}
        </View>
        <Text style={[styles.itemPrice, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
          ${item.menuItem.price.toFixed(2)} each
        </Text>
      </View>
      <View style={styles.itemActions}>
        <View style={[styles.qtyControl, { backgroundColor: c.surfaceElevated }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (item.quantity <= 1) removeItem(item.menuItem.id);
              else updateQuantity(item.menuItem.id, item.quantity - 1);
            }}
            hitSlop={8}
          >
            <Feather name={item.quantity <= 1 ? 'trash-2' : 'minus'} size={14} color={item.quantity <= 1 ? c.red : c.text} />
          </Pressable>
          <Text style={[styles.qtyText, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{item.quantity}</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              updateQuantity(item.menuItem.id, item.quantity + 1);
            }}
            hitSlop={8}
          >
            <Feather name="plus" size={14} color={c.text} />
          </Pressable>
        </View>
        <Text style={[styles.lineTotal, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
          ${(item.menuItem.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

export default function CartScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { items, subtotal, deliveryFee, serviceFee, tax, total, taxRate, hasAlcohol, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Text style={[styles.title, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Cart</Text>
        </View>
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={64} color={c.textTertiary} />
          <Text style={[styles.emptyTitle, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>Your cart is empty</Text>
          <Text style={[styles.emptyText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            Add items from a restaurant to get started
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)')}
            style={({ pressed }) => [styles.browseBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
          >
            <Text style={[styles.browseBtnText, { fontFamily: 'DMSans_600SemiBold' }]}>Browse restaurants</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const restaurantName = items[0].restaurantName;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={[styles.title, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Cart</Text>
          <Text style={[styles.subtitle, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{restaurantName}</Text>
        </View>
        <Pressable onPress={clearCart}>
          <Feather name="trash-2" size={20} color={c.red} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItem.id}
        renderItem={({ item }) => <CartItemRow item={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={styles.summarySection}>
            {hasAlcohol && (
              <View style={[styles.alcoholNotice, { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
                <Ionicons name="wine" size={16} color={c.accent} />
                <Text style={[styles.alcoholNoticeText, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>
                  Age verification (21+) required at checkout & delivery
                </Text>
              </View>
            )}

            <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.summaryTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Order summary</Text>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Subtotal</Text>
                <Text style={[styles.summaryValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${subtotal.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Delivery fee</Text>
                <Text style={[styles.summaryValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${deliveryFee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Service fee (12%)</Text>
                <Text style={[styles.summaryValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${serviceFee.toFixed(2)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Tax ({(taxRate * 100).toFixed(0)}% Miami-Dade)</Text>
                <Text style={[styles.summaryValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${tax.toFixed(2)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow, { borderTopColor: c.border }]}>
                <Text style={[styles.totalLabel, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Total</Text>
                <Text style={[styles.totalValue, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>${total.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        }
      />

      <View style={[styles.checkoutBar, { backgroundColor: c.surface, paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/checkout');
          }}
          style={({ pressed }) => [styles.checkoutBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Text style={[styles.checkoutText, { fontFamily: 'DMSans_700Bold' }]}>Checkout  ${total.toFixed(2)}</Text>
          <Feather name="arrow-right" size={18} color="#000" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28 },
  subtitle: { fontSize: 14, marginTop: 2 },
  list: { paddingHorizontal: 20, paddingBottom: 180 },
  itemRow: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemInfo: { flex: 1, marginRight: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemName: { fontSize: 15, flexShrink: 1 },
  alcBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  alcText: { fontSize: 10, fontWeight: '700' as const },
  itemPrice: { fontSize: 13, marginTop: 2 },
  itemActions: { alignItems: 'flex-end', gap: 6 },
  qtyControl: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 12,
  },
  qtyText: { fontSize: 14, minWidth: 16, textAlign: 'center' as const },
  lineTotal: { fontSize: 15 },
  summarySection: { marginTop: 8, gap: 12, paddingBottom: 20 },
  alcoholNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  alcoholNoticeText: { flex: 1, fontSize: 13 },
  summaryCard: { borderRadius: 14, padding: 16, gap: 10 },
  summaryTitle: { fontSize: 16, marginBottom: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14 },
  totalRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 17 },
  totalValue: { fontSize: 17 },
  checkoutBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  checkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  checkoutText: { fontSize: 16, color: '#000' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingBottom: 100,
  },
  emptyTitle: { fontSize: 18 },
  emptyText: { fontSize: 14, textAlign: 'center' },
  browseBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  browseBtnText: { fontSize: 15, color: '#000' },
});
