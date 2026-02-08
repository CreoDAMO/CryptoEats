import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, ActivityIndicator, Alert, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

interface NftListing {
  id: string;
  nftId: string;
  sellerUserId: string;
  price: string;
  currency: string;
  listing_status: string;
  listedAt: string;
  nft?: {
    id: string;
    name: string;
    description: string;
    milestoneType: string;
    milestoneValue: number;
    status: string;
    tokenId: string | null;
    imageUrl?: string | null;
    aiGenerated?: boolean;
    nftCategory?: string;
  };
}

const NFT_COLORS: Record<string, string> = {
  'Foodie Explorer': '#00D4AA',
  'Crypto Connoisseur': '#7B61FF',
  'Diamond Diner': '#00BFFF',
  'CryptoEats Legend': '#FFD700',
  'Rising Star': '#FF6B35',
  'Road Warrior': '#00D4AA',
  'Delivery Hero': '#7B61FF',
  'Legendary Driver': '#FFD700',
};

const CATEGORY_COLORS: Record<string, string> = {
  'merchant_dish': '#FF6B35',
  'driver_avatar': '#00D4AA',
  'customer_loyalty': '#7B61FF',
  'marketplace_art': '#00BFFF',
};

const CATEGORY_LABELS: Record<string, string> = {
  'merchant_dish': 'Dish',
  'driver_avatar': 'Avatar',
  'customer_loyalty': 'Loyalty',
  'marketplace_art': 'Art',
};

const NFT_ICONS: Record<string, string> = {
  'Foodie Explorer': 'compass-outline',
  'Crypto Connoisseur': 'wine-outline',
  'Diamond Diner': 'diamond-outline',
  'CryptoEats Legend': 'star-outline',
  'Rising Star': 'rocket-outline',
  'Road Warrior': 'car-sport-outline',
  'Delivery Hero': 'shield-checkmark-outline',
  'Legendary Driver': 'trophy-outline',
};

const SAMPLE_LISTINGS: NftListing[] = [
  {
    id: 'listing-1',
    nftId: 'nft-1',
    sellerUserId: 'user-1',
    price: '25.00',
    currency: 'USDC',
    listing_status: 'active',
    listedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    nft: { id: 'nft-1', name: 'Foodie Explorer', description: 'Completed 10 orders', milestoneType: 'customer', milestoneValue: 10, status: 'minted', tokenId: '42' },
  },
  {
    id: 'listing-2',
    nftId: 'nft-2',
    sellerUserId: 'user-2',
    price: '75.00',
    currency: 'USDC',
    listing_status: 'active',
    listedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    nft: { id: 'nft-2', name: 'Crypto Connoisseur', description: 'Completed 25 orders', milestoneType: 'customer', milestoneValue: 25, status: 'minted', tokenId: '18' },
  },
  {
    id: 'listing-3',
    nftId: 'nft-3',
    sellerUserId: 'user-3',
    price: '150.00',
    currency: 'USDC',
    listing_status: 'active',
    listedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    nft: { id: 'nft-3', name: 'Road Warrior', description: 'Completed 50 deliveries', milestoneType: 'driver', milestoneValue: 50, status: 'minted', tokenId: '7' },
  },
];

export default function MarketplaceScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [listings, setListings] = useState<NftListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'customer' | 'driver' | 'ai'>('all');

  const loadListings = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/marketplace/listings', baseUrl).toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setListings(data);
        } else {
          setListings(SAMPLE_LISTINGS);
        }
      } else {
        setListings(SAMPLE_LISTINGS);
      }
    } catch {
      setListings(SAMPLE_LISTINGS);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const filteredListings = listings.filter(l => {
    if (filter === 'all') return true;
    if (filter === 'ai') return l.nft?.aiGenerated;
    return l.nft?.milestoneType === filter;
  });

  const getColor = (listing: NftListing) => {
    const nft = listing.nft;
    if (nft?.nftCategory && CATEGORY_COLORS[nft.nftCategory]) return CATEGORY_COLORS[nft.nftCategory];
    return NFT_COLORS[nft?.name || ''] || c.accent;
  };
  const getIcon = (name: string) => NFT_ICONS[name] || 'diamond-outline';

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${getApiUrl()}${url}`;
  };

  const handleBuy = (listing: NftListing) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Confirm Purchase',
      `Buy ${listing.nft?.name} for ${listing.price} ${listing.currency}?\n\nThis will be processed through smart contract escrow on Base.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Wallet Required', 'Connect your wallet to complete this purchase. Go to Profile > Wallet to connect.');
          },
        },
      ]
    );
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>NFT Marketplace</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/generate-nft'); }}>
            <MaterialCommunityIcons name="creation" size={22} color="#7B61FF" />
          </Pressable>
          <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/nft-collection'); }}>
            <Ionicons name="diamond-outline" size={22} color={c.accent} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.statsBar, { backgroundColor: c.surface }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>{filteredListings.length}</Text>
          <Text style={[styles.statLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Listed</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: c.yellow, fontFamily: 'DMSans_700Bold' }]}>
            ${filteredListings.reduce((sum, l) => sum + parseFloat(l.price), 0).toFixed(0)}
          </Text>
          <Text style={[styles.statLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Volume</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: c.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: c.green, fontFamily: 'DMSans_700Bold' }]}>Base</Text>
          <Text style={[styles.statLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Chain</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'ai', 'customer', 'driver'] as const).map(f => (
          <Pressable
            key={f}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFilter(f); }}
            style={[styles.filterChip, { backgroundColor: filter === f ? (f === 'ai' ? '#7B61FF' : c.accent) : c.surface }]}
          >
            {f === 'ai' && <MaterialCommunityIcons name="creation" size={14} color={filter === f ? '#FFF' : '#7B61FF'} />}
            <Text style={[styles.filterText, { color: filter === f ? (f === 'ai' ? '#FFF' : '#000') : c.textSecondary, fontFamily: filter === f ? 'DMSans_700Bold' : 'DMSans_500Medium' }]}>
              {f === 'all' ? 'All' : f === 'ai' ? 'AI Art' : f === 'customer' ? 'Customer' : 'Driver'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 20) }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        ) : filteredListings.length > 0 ? (
          filteredListings.map((listing, idx) => {
            const name = listing.nft?.name || 'Unknown NFT';
            const color = getColor(listing);
            const icon = getIcon(name);
            const hasAiImage = listing.nft?.imageUrl && listing.nft?.aiGenerated;
            const catLabel = listing.nft?.nftCategory ? CATEGORY_LABELS[listing.nft.nftCategory] : null;
            return (
              <Animated.View key={listing.id} entering={FadeInDown.delay(idx * 60).duration(400)}>
                <View style={[styles.listingCard, { backgroundColor: c.surface }]}>
                  <View style={styles.listingTop}>
                    {hasAiImage && listing.nft?.imageUrl ? (
                      <View style={styles.listingImageContainer}>
                        <Image
                          source={{ uri: getFullImageUrl(listing.nft.imageUrl) }}
                          style={styles.listingImageFull}
                          resizeMode="cover"
                        />
                        <View style={[styles.aiOverlay, { backgroundColor: '#7B61FF' }]}>
                          <MaterialCommunityIcons name="creation" size={10} color="#FFF" />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.listingImage, { backgroundColor: color + '22' }]}>
                        <Ionicons name={icon as any} size={36} color={color} />
                      </View>
                    )}
                    <View style={styles.listingInfo}>
                      <Text style={[styles.listingName, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{name}</Text>
                      <Text style={[styles.listingDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                        {listing.nft?.description}
                      </Text>
                      <View style={styles.listingMeta}>
                        {catLabel && (
                          <View style={[styles.catBadge, { backgroundColor: color + '18' }]}>
                            <Text style={[styles.catBadgeText, { color, fontFamily: 'DMSans_600SemiBold' }]}>{catLabel}</Text>
                          </View>
                        )}
                        {listing.nft?.tokenId && (
                          <View style={[styles.tokenBadge, { backgroundColor: c.surfaceElevated }]}>
                            <Text style={[styles.tokenBadgeText, { color: c.textTertiary, fontFamily: 'DMSans_500Medium' }]}>
                              #{listing.nft.tokenId}
                            </Text>
                          </View>
                        )}
                        <Text style={[styles.listingTime, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                          {timeAgo(listing.listedAt)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={[styles.listingBottom, { borderTopColor: c.border }]}>
                    <View>
                      <Text style={[styles.priceLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Price</Text>
                      <View style={styles.priceRow}>
                        <Text style={[styles.priceValue, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                          {listing.price}
                        </Text>
                        <Text style={[styles.priceCurrency, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>
                          {listing.currency}
                        </Text>
                      </View>
                    </View>
                    <Pressable
                      onPress={() => handleBuy(listing)}
                      style={({ pressed }) => [styles.buyBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
                    >
                      <Text style={[styles.buyBtnText, { fontFamily: 'DMSans_700Bold' }]}>Buy</Text>
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="storefront-outline" size={48} color={c.textTertiary} />
            <Text style={[styles.emptyTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>No Listings</Text>
            <Text style={[styles.emptyDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              No NFTs match this filter. Check back later!
            </Text>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: c.surface }]}>
          <MaterialCommunityIcons name="creation" size={16} color="#7B61FF" />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>AI-Powered NFTs</Text>
            <Text style={[styles.infoText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              Create unique AI-generated NFTs for signature dishes, driver avatars, and loyalty rewards. All minted on Base chain with USDC trading.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18 },
  headerRight: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  statsBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 11 },
  statDivider: { width: 1 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { fontSize: 13 },
  scroll: { paddingHorizontal: 20, gap: 12 },
  loadingWrap: { paddingTop: 80, alignItems: 'center' },
  listingCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  listingTop: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
  },
  listingImageContainer: {
    width: 72,
    height: 72,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  listingImageFull: {
    width: 72,
    height: 72,
  },
  aiOverlay: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 5,
  },
  listingImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listingInfo: { flex: 1, gap: 4 },
  listingName: { fontSize: 16 },
  listingDesc: { fontSize: 12 },
  listingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  catBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  catBadgeText: { fontSize: 10 },
  tokenBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tokenBadgeText: { fontSize: 11 },
  listingTime: { fontSize: 11 },
  listingBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  priceLabel: { fontSize: 11 },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceValue: { fontSize: 20 },
  priceCurrency: { fontSize: 13 },
  buyBtn: {
    paddingHorizontal: 28,
    paddingVertical: 10,
    borderRadius: 10,
  },
  buyBtnText: { fontSize: 15, color: '#000' },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: { fontSize: 20 },
  emptyDesc: { fontSize: 14, textAlign: 'center' },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 14,
    gap: 12,
    marginTop: 4,
  },
  infoContent: { flex: 1, gap: 4 },
  infoTitle: { fontSize: 14 },
  infoText: { fontSize: 12, lineHeight: 18 },
});
