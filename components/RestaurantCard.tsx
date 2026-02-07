import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { Restaurant } from '@/lib/data';

interface Props {
  restaurant: Restaurant;
  onPress: () => void;
  compact?: boolean;
}

export function RestaurantCard({ restaurant, onPress, compact }: Props) {
  const c = Colors.dark;

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.compactCard, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
      >
        <Image source={{ uri: restaurant.image }} style={styles.compactImage} contentFit="cover" />
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: c.text }]} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.row}>
            <Ionicons name="star" size={12} color={c.yellow} />
            <Text style={[styles.ratingText, { color: c.textSecondary }]}>{restaurant.rating}</Text>
            <Text style={[styles.dot, { color: c.textTertiary }]}>&middot;</Text>
            <Text style={[styles.metaText, { color: c.textSecondary }]}>{restaurant.deliveryTime}</Text>
          </View>
          <Text style={[styles.metaText, { color: c.textTertiary }]}>{restaurant.cuisine}</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: c.surface, opacity: pressed ? 0.9 : 1 }]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.image }} style={styles.image} contentFit="cover" />
        {restaurant.hasAlcohol && (
          <View style={[styles.badge, { backgroundColor: c.accent }]}>
            <Feather name="wine" size={10} color="#000" />
            <Text style={styles.badgeText}>21+</Text>
          </View>
        )}
        {restaurant.featured && (
          <View style={[styles.featuredBadge, { backgroundColor: c.orange }]}>
            <Ionicons name="flame" size={10} color="#fff" />
            <Text style={[styles.badgeText, { color: '#fff' }]}>Featured</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>{restaurant.name}</Text>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={12} color={c.yellow} />
            <Text style={[styles.ratingValue, { color: c.text }]}>{restaurant.rating}</Text>
          </View>
        </View>
        <View style={styles.metaRow}>
          <Text style={[styles.metaText, { color: c.textSecondary }]}>{restaurant.cuisine}</Text>
          <Text style={[styles.dot, { color: c.textTertiary }]}>&middot;</Text>
          <Text style={[styles.metaText, { color: c.textSecondary }]}>{restaurant.deliveryTime}</Text>
          <Text style={[styles.dot, { color: c.textTertiary }]}>&middot;</Text>
          <Text style={[styles.metaText, { color: c.textSecondary }]}>{restaurant.distance}</Text>
        </View>
        <View style={styles.metaRow}>
          <Feather name="truck" size={12} color={c.accent} />
          <Text style={[styles.feeText, { color: c.accent }]}>
            {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
          </Text>
          <Text style={[styles.dot, { color: c.textTertiary }]}>&middot;</Text>
          <Text style={[styles.metaText, { color: c.textTertiary }]}>${restaurant.minOrder} min</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 160,
  },
  badge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#000',
  },
  info: {
    padding: 14,
    gap: 6,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    fontWeight: '700' as const,
    flex: 1,
    marginRight: 8,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingValue: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
  },
  dot: {
    fontSize: 13,
  },
  ratingText: {
    fontSize: 12,
    marginLeft: 2,
  },
  feeText: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactCard: {
    width: 150,
    borderRadius: 14,
    overflow: 'hidden',
    marginRight: 12,
  },
  compactImage: {
    width: '100%',
    height: 100,
  },
  compactInfo: {
    padding: 10,
    gap: 3,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
