import React, { useState, useMemo, useRef } from 'react';
import {
  StyleSheet, View, Text, FlatList, Pressable, ScrollView,
  Platform, TextInput, Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import { RESTAURANTS, CUISINE_FILTERS, Restaurant } from '@/lib/data';
import { RestaurantCard } from '@/components/RestaurantCard';

const CUISINE_ICONS: Record<string, string> = {
  All: '🍽️',
  Pizza: '🍕',
  Sushi: '🍣',
  Mexican: '🌮',
  Chinese: '🥡',
  Indian: '🍛',
  Thai: '🍜',
  American: '🍔',
  Mediterranean: '🥙',
  'Wine Bar': '🍷',
  Brewery: '🍺',
};

const PROMOS = [
  {
    id: '1',
    title: 'Free delivery on your first order',
    subtitle: 'Use code CRYPTO10 at checkout',
    gradient: ['#00D4AA', '#00A67E'] as [string, string],
    icon: 'rocket-outline' as const,
  },
  {
    id: '2',
    title: 'Earn NFT rewards',
    subtitle: 'Every order unlocks a unique collectible',
    gradient: ['#7C3AED', '#4F46E5'] as [string, string],
    icon: 'diamond-outline' as const,
  },
  {
    id: '3',
    title: 'Pay with USDC on Base',
    subtitle: 'Gasless transactions, instant escrow',
    gradient: ['#FF6B35', '#E85D04'] as [string, string],
    icon: 'wallet-outline' as const,
  },
];

export default function HomeScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [promoIndex, setPromoIndex] = useState(0);
  const isWeb = Platform.OS === 'web';

  const featured = useMemo(() => RESTAURANTS.filter(r => r.featured), []);

  const filtered = useMemo(() => {
    let list = RESTAURANTS;
    if (selectedCuisine !== 'All') {
      list = list.filter(r => r.cuisine === selectedCuisine);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) || r.cuisine.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCuisine, search]);

  const topPad = isWeb ? 67 : insets.top;

  const renderHeader = () => (
    <View>
      {/* ── Top bar ── */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <View>
          <Text style={[styles.greeting, { color: c.textSecondary }]}>Deliver to</Text>
          <Pressable style={styles.locationRow}>
            <Ionicons name="location" size={15} color={c.accent} />
            <Text style={[styles.location, { color: c.text }]}>Miami Beach, FL</Text>
            <Feather name="chevron-down" size={15} color={c.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => router.push('/sommelier')}
            style={[styles.actionButton, { backgroundColor: c.surfaceElevated }]}
          >
            <Ionicons name="wine" size={19} color={c.accent} />
          </Pressable>
          <Pressable style={[styles.actionButton, { backgroundColor: c.surfaceElevated }]}>
            <Ionicons name="notifications-outline" size={19} color={c.textSecondary} />
          </Pressable>
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={[styles.searchBar, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
        <Feather name="search" size={17} color={c.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          placeholder="Search restaurants, cuisines…"
          placeholderTextColor={c.textTertiary}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} style={styles.clearBtn}>
            <Feather name="x" size={14} color={c.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* ── Promo banner ── */}
      {search.length === 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e => {
            const idx = Math.round(e.nativeEvent.contentOffset.x / (isWeb ? 340 : 320));
            setPromoIndex(idx);
          }}
          contentContainerStyle={styles.promoScroll}
          style={styles.promoScrollView}
        >
          {PROMOS.map((promo) => (
            <LinearGradient
              key={promo.id}
              colors={promo.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.promoBanner}
            >
              <View style={styles.promoContent}>
                <View style={styles.promoIconWrap}>
                  <Ionicons name={promo.icon} size={28} color="rgba(255,255,255,0.95)" />
                </View>
                <View style={styles.promoText}>
                  <Text style={styles.promoTitle}>{promo.title}</Text>
                  <Text style={styles.promoSubtitle}>{promo.subtitle}</Text>
                </View>
              </View>
              <View style={styles.promoDots}>
                {PROMOS.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.promoDot, { opacity: i === promoIndex ? 1 : 0.4 }]}
                  />
                ))}
              </View>
            </LinearGradient>
          ))}
        </ScrollView>
      )}

      {/* ── Cuisine filters ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersRow}
      >
        {CUISINE_FILTERS.map(cuisine => {
          const active = cuisine === selectedCuisine;
          return (
            <Pressable
              key={cuisine}
              onPress={() => setSelectedCuisine(cuisine)}
              style={[
                styles.filterChip,
                active
                  ? { backgroundColor: c.accent }
                  : { backgroundColor: c.surfaceElevated, borderColor: c.border, borderWidth: 1 },
              ]}
            >
              <Text style={styles.filterEmoji}>{CUISINE_ICONS[cuisine] ?? '🍽️'}</Text>
              <Text style={[
                styles.filterText,
                { color: active ? '#000' : c.textSecondary },
              ]}>
                {cuisine}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ── Popular near you ── */}
      {selectedCuisine === 'All' && search.length === 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Popular near you</Text>
            <Pressable>
              <Text style={[styles.seeAll, { color: c.accent }]}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredScroll}
          >
            {featured.map(r => (
              <PopularCard
                key={r.id}
                restaurant={r}
                onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: r.id } })}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Section header for list ── */}
      <View style={[styles.sectionHeader, { paddingHorizontal: 20, marginBottom: 12, marginTop: 4 }]}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          {selectedCuisine === 'All' ? 'All restaurants' : selectedCuisine}
        </Text>
        <View style={[styles.countBadge, { backgroundColor: c.surfaceElevated }]}>
          <Text style={[styles.countText, { color: c.textSecondary }]}>{filtered.length}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <RestaurantCard
              restaurant={item}
              onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item.id } })}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: isWeb ? 90 : 110 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: c.surfaceElevated }]}>
              <Feather name="search" size={32} color={c.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No restaurants found</Text>
            <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
              Try a different search or cuisine filter
            </Text>
          </View>
        }
      />
    </View>
  );
}

function PopularCard({ restaurant, onPress }: { restaurant: Restaurant; onPress: () => void }) {
  const c = Colors.dark;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.popularCard, { opacity: pressed ? 0.88 : 1 }]}
    >
      <Image source={{ uri: restaurant.image }} style={styles.popularImage} contentFit="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.78)']}
        style={styles.popularGradient}
      />
      {restaurant.featured && (
        <View style={[styles.popularBadge, { backgroundColor: c.orange }]}>
          <Ionicons name="flame" size={9} color="#fff" />
          <Text style={styles.popularBadgeText}>Hot</Text>
        </View>
      )}
      <View style={styles.popularInfo}>
        <Text style={styles.popularName} numberOfLines={1}>{restaurant.name}</Text>
        <View style={styles.popularMeta}>
          <Ionicons name="star" size={10} color={c.yellow} />
          <Text style={styles.popularRating}>{restaurant.rating}</Text>
          <Text style={styles.popularDot}>·</Text>
          <Text style={styles.popularTime}>{restaurant.deliveryTime}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  greeting: { fontSize: 12, marginBottom: 3, fontFamily: 'DMSans_400Regular' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  headerActions: { flexDirection: 'row', gap: 8, marginTop: 2 },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    fontFamily: 'DMSans_400Regular',
  },
  clearBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  promoScrollView: { marginBottom: 16 },
  promoScroll: { paddingHorizontal: 20, gap: 12 },
  promoBanner: {
    width: 320,
    borderRadius: 18,
    padding: 18,
    justifyContent: 'space-between',
  },
  promoContent: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  promoIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: { flex: 1 },
  promoTitle: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 4,
    lineHeight: 20,
  },
  promoSubtitle: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
  },
  promoDots: { flexDirection: 'row', gap: 5, alignSelf: 'flex-end' },
  promoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },

  filtersRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 22,
    gap: 5,
  },
  filterEmoji: { fontSize: 13 },
  filterText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
  },

  section: { marginBottom: 4 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: 'DMSans_700Bold',
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
  },

  featuredScroll: { paddingHorizontal: 20, gap: 12, paddingBottom: 4 },

  popularCard: {
    width: 170,
    height: 210,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  popularImage: { width: '100%', height: '100%' },
  popularGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  popularBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
  popularInfo: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  popularName: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    marginBottom: 4,
  },
  popularMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  popularRating: { color: 'rgba(255,255,255,0.9)', fontSize: 11, fontFamily: 'DMSans_500Medium' },
  popularDot: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  popularTime: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'DMSans_400Regular' },

  cardWrapper: { paddingHorizontal: 20 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 14 },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontFamily: 'DMSans_700Bold' },
  emptySubtitle: { fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
});
