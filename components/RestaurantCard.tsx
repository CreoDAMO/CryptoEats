import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={styles.compactGradient} />
        {restaurant.featured && (
          <View style={[styles.compactBadge, { backgroundColor: c.orange }]}>
            <Ionicons name="flame" size={9} color="#fff" />
            <Text style={[styles.compactBadgeText, { fontFamily: 'DMSans_700Bold' }]}>Hot</Text>
          </View>
        )}
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: '#fff', fontFamily: 'DMSans_700Bold' }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.row}>
            <Ionicons name="star" size={10} color={c.yellow} />
            <Text style={[styles.ratingText, { color: 'rgba(255,255,255,0.85)', fontFamily: 'DMSans_500Medium' }]}>
              {restaurant.rating}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10 }}>&middot;</Text>
            <Text style={[styles.metaText, { color: 'rgba(255,255,255,0.7)', fontFamily: 'DMSans_400Regular' }]}>
              {restaurant.deliveryTime}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: c.surface, opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: restaurant.image }} style={styles.image} contentFit="cover" />
        {restaurant.featured && (
          <View style={[styles.badge, { backgroundColor: c.orange }]}>
            <Ionicons name="flame" size={9} color="#fff" />
            <Text style={[styles.badgeText, { color: '#fff', fontFamily: 'DMSans_700Bold' }]}>Featured</Text>
          </View>
        )}
        {restaurant.hasAlcohol && (
          <View style={[styles.badge21, { backgroundColor: 'rgba(0,0,0,0.65)', borderColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="wine" size={9} color="#fff" />
            <Text style={[styles.badgeText, { color: '#fff', fontFamily: 'DMSans_700Bold' }]}>21+</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={[styles.name, { color: c.text, fontFamily: 'DMSans_700Bold' }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color={c.yellow} />
            <Text style={[styles.ratingVal, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
              {restaurant.rating}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.cuisineText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            {restaurant.cuisine}
          </Text>
          <View style={styles.dotSep} />
          <Feather name="clock" size={11} color={c.textTertiary} />
          <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            {restaurant.deliveryTime}
          </Text>
          <View style={styles.dotSep} />
          <Text style={[styles.metaText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            {restaurant.distance}
          </Text>
        </View>

        <View style={styles.feeRow}>
          <View style={[styles.feePill, {
            backgroundColor: restaurant.deliveryFee === 0 ? c.accentLight : c.surfaceElevated,
          }]}>
            <Feather name="truck" size={11} color={restaurant.deliveryFee === 0 ? c.accent : c.textTertiary} />
            <Text style={[styles.feeText, {
              color: restaurant.deliveryFee === 0 ? c.accent : c.textTertiary,
              fontFamily: 'DMSans_600SemiBold',
            }]}>
              {restaurant.deliveryFee === 0 ? 'Free' : `$${restaurant.deliveryFee.toFixed(2)}`}
            </Text>
          </View>
          <Text style={[styles.minText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            ${restaurant.minOrder} min
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
    flexDirection: 'row',
    minHeight: 110,
  },
  imageWrap: {
    width: 120,
    position: 'relative',
  },
  image: {
    width: 120,
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  badge21: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  badgeText: {
    fontSize: 9,
  },
  info: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
    gap: 7,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    fontSize: 15,
    flex: 1,
    lineHeight: 20,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ratingVal: {
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  cuisineText: { fontSize: 12 },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#5A5A6E',
  },
  metaText: { fontSize: 12 },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  feeText: { fontSize: 12 },
  minText: { fontSize: 12 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11 },

  compactCard: {
    width: 170,
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
  },
  compactImage: { width: '100%', height: '100%' },
  compactGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  compactBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },
  compactBadgeText: {
    color: '#fff',
    fontSize: 10,
  },
  compactInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    gap: 4,
  },
  compactName: { fontSize: 14, lineHeight: 18 },
});
