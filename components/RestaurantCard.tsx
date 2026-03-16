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
        <View style={styles.compactInfo}>
          <Text style={[styles.compactName, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.row}>
            <Ionicons name="star" size={11} color={c.yellow} />
            <Text style={[styles.ratingText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>
              {restaurant.rating}
            </Text>
            <Text style={[styles.dot, { color: c.textTertiary }]}>&middot;</Text>
            <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              {restaurant.deliveryTime}
            </Text>
          </View>
          <Text style={[styles.metaText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            {restaurant.cuisine}
          </Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: c.surface, opacity: pressed ? 0.92 : 1 }]}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: restaurant.image }} style={styles.image} contentFit="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)']}
          style={styles.imageGradient}
        />

        <View style={styles.badgesRow}>
          {restaurant.featured && (
            <View style={[styles.badge, { backgroundColor: c.orange }]}>
              <Ionicons name="flame" size={10} color="#fff" />
              <Text style={[styles.badgeText, { color: '#fff', fontFamily: 'DMSans_700Bold' }]}>Featured</Text>
            </View>
          )}
          {restaurant.hasAlcohol && (
            <View style={[styles.badge, { backgroundColor: 'rgba(0,0,0,0.55)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }]}>
              <Ionicons name="wine" size={10} color="#fff" />
              <Text style={[styles.badgeText, { color: '#fff', fontFamily: 'DMSans_700Bold' }]}>21+</Text>
            </View>
          )}
        </View>

        <View style={[styles.ratingPill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Ionicons name="star" size={11} color={c.yellow} />
          <Text style={[styles.ratingPillText, { color: '#fff', fontFamily: 'DMSans_700Bold' }]}>
            {restaurant.rating}
          </Text>
        </View>
      </View>

      <View style={styles.info}>
        <View style={styles.infoTop}>
          <Text style={[styles.name, { color: c.text, fontFamily: 'DMSans_700Bold' }]} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={[styles.timePill, { backgroundColor: c.surfaceElevated }]}>
            <Feather name="clock" size={11} color={c.textSecondary} />
            <Text style={[styles.timeText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>
              {restaurant.deliveryTime}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Text style={[styles.cuisineTag, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            {restaurant.cuisine}
          </Text>
          <View style={styles.dotSep} />
          <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            {restaurant.distance}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={styles.feeRow}>
          <View style={styles.feeLeft}>
            <View style={[styles.feeIconWrap, { backgroundColor: restaurant.deliveryFee === 0 ? c.accentLight : c.surfaceElevated }]}>
              <Feather name="truck" size={12} color={restaurant.deliveryFee === 0 ? c.accent : c.textSecondary} />
            </View>
            <Text style={[styles.feeText, {
              color: restaurant.deliveryFee === 0 ? c.accent : c.textSecondary,
              fontFamily: 'DMSans_600SemiBold',
            }]}>
              {restaurant.deliveryFee === 0 ? 'Free delivery' : `$${restaurant.deliveryFee.toFixed(2)} delivery`}
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
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 180,
  },
  imageGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  badgesRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
  },
  ratingPill: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
    backdropFilter: 'blur(10px)',
  },
  ratingPillText: {
    fontSize: 12,
  },
  info: {
    padding: 16,
    gap: 8,
  },
  infoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 17,
    flex: 1,
    marginRight: 10,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
  },
  timeText: {
    fontSize: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cuisineTag: {
    fontSize: 13,
  },
  dotSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#5A5A6E',
  },
  metaText: {
    fontSize: 13,
  },
  divider: {
    height: 1,
    marginVertical: 2,
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  feeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  feeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeText: {
    fontSize: 13,
  },
  minText: {
    fontSize: 12,
  },

  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, marginLeft: 1 },
  dot: { fontSize: 12 },
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
  },
});
