import React, { useMemo } from 'react';
import { StyleSheet, View, Text, SectionList, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getRestaurant, getMenuForRestaurant, getMenuCategories, MenuItem } from '@/lib/data';
import { useCart } from '@/lib/cart-context';
import { MenuItemCard } from '@/components/MenuItemCard';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { items, addItem, updateQuantity, removeItem } = useCart();

  const restaurant = getRestaurant(id);
  const menuItems = getMenuForRestaurant(id);
  const categories = getMenuCategories(id);

  const sections = useMemo(() => {
    return categories.map(cat => ({
      title: cat,
      data: menuItems.filter(item => item.category === cat),
    }));
  }, [categories, menuItems]);

  const getQuantity = (itemId: string) => {
    const cartItem = items.find(i => i.menuItem.id === itemId);
    return cartItem?.quantity ?? 0;
  };

  const cartItemCount = items.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = items.reduce((s, i) => s + i.menuItem.price * i.quantity, 0);

  if (!restaurant) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <Text style={{ color: c.text, textAlign: 'center', marginTop: 100 }}>Restaurant not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={styles.heroContainer}>
        <Image source={{ uri: restaurant.image }} style={styles.heroImage} contentFit="cover" />
        <View style={styles.heroOverlay} />
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtn, { top: topPad + 4 }]}
        >
          <Feather name="arrow-left" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={[styles.infoCard, { backgroundColor: c.surface }]}>
        <View style={styles.infoTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{restaurant.name}</Text>
            <Text style={[styles.cuisine, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{restaurant.cuisine}</Text>
          </View>
          <View style={[styles.ratingPill, { backgroundColor: c.yellowLight }]}>
            <Ionicons name="star" size={14} color={c.yellow} />
            <Text style={[styles.ratingNum, { color: c.yellow, fontFamily: 'DMSans_700Bold' }]}>{restaurant.rating}</Text>
            <Text style={[styles.ratingCount, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>({restaurant.reviewCount})</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="clock" size={14} color={c.textTertiary} />
            <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{restaurant.deliveryTime}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="truck" size={14} color={c.accent} />
            <Text style={[styles.metaText, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>${restaurant.deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.metaItem}>
            <Feather name="map-pin" size={14} color={c.textTertiary} />
            <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{restaurant.distance}</Text>
          </View>
          {restaurant.hasAlcohol && (
            <View style={[styles.alcTag, { backgroundColor: c.accentLight }]}>
              <Ionicons name="wine" size={12} color={c.accent} />
              <Text style={[styles.alcTagText, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>Alcohol</Text>
            </View>
          )}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.menuItemWrapper}>
            <MenuItemCard
              item={item}
              quantity={getQuantity(item.id)}
              onAdd={() => addItem(item, restaurant.id, restaurant.name)}
              onRemove={() => {
                const q = getQuantity(item.id);
                if (q <= 1) removeItem(item.id);
                else updateQuantity(item.id, q - 1);
              }}
            />
          </View>
        )}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: c.background }]}>
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{section.title}</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: cartItemCount > 0 ? 120 : 40 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />

      {cartItemCount > 0 && (
        <View style={[styles.cartBar, { backgroundColor: c.surface, paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(tabs)/cart');
            }}
            style={({ pressed }) => [styles.cartBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={styles.cartBtnLeft}>
              <View style={styles.cartCount}>
                <Text style={[styles.cartCountText, { fontFamily: 'DMSans_700Bold' }]}>{cartItemCount}</Text>
              </View>
              <Text style={[styles.cartBtnText, { fontFamily: 'DMSans_700Bold' }]}>View cart</Text>
            </View>
            <Text style={[styles.cartBtnTotal, { fontFamily: 'DMSans_700Bold' }]}>${cartTotal.toFixed(2)}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroContainer: { position: 'relative' },
  heroImage: { width: '100%', height: 200 },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    zIndex: 10,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  name: { fontSize: 22 },
  cuisine: { fontSize: 14, marginTop: 2 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ratingNum: { fontSize: 14 },
  ratingCount: { fontSize: 12 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13 },
  alcTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  alcTagText: { fontSize: 11 },
  menuItemWrapper: { paddingHorizontal: 16 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 18 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  cartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  cartBtnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cartCount: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartCountText: { fontSize: 13, color: '#000' },
  cartBtnText: { fontSize: 16, color: '#000' },
  cartBtnTotal: { fontSize: 16, color: '#000' },
});
