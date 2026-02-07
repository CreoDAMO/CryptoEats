import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

interface NftReward {
  id: string;
  name: string;
  description: string;
  milestoneType: string;
  milestoneValue: number;
  status: string;
  tokenId: string | null;
  imageUrl: string | null;
  mintedAt: string | null;
  createdAt: string;
}

interface MilestoneInfo {
  type: string;
  value: number;
  name: string;
  description: string;
  earned: boolean;
}

interface MilestoneData {
  milestones: MilestoneInfo[];
  progress: {
    orders: number;
    deliveries: number;
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

export default function NftCollectionScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [nfts, setNfts] = useState<NftReward[]>([]);
  const [milestoneData, setMilestoneData] = useState<MilestoneData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'collection' | 'milestones'>('collection');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const baseUrl = getApiUrl();
      const [nftRes, msRes] = await Promise.all([
        fetch(new URL('/api/nft/my', baseUrl).toString(), { credentials: 'include' }).catch(() => null),
        fetch(new URL('/api/nft/milestones', baseUrl).toString(), { credentials: 'include' }).catch(() => null),
      ]);
      if (nftRes?.ok) setNfts(await nftRes.json());
      if (msRes?.ok) setMilestoneData(await msRes.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getColor = (name: string) => NFT_COLORS[name] || c.accent;
  const getIcon = (name: string) => NFT_ICONS[name] || 'diamond-outline';

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>NFT Rewards</Text>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/marketplace'); }}>
          <Ionicons name="storefront-outline" size={22} color={c.accent} />
        </Pressable>
      </View>

      <View style={styles.tabRow}>
        {(['collection', 'milestones'] as const).map(t => (
          <Pressable
            key={t}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setTab(t); }}
            style={[styles.tab, tab === t && { backgroundColor: c.accent }]}
          >
            <Text style={[styles.tabText, { color: tab === t ? '#000' : c.textSecondary, fontFamily: tab === t ? 'DMSans_700Bold' : 'DMSans_500Medium' }]}>
              {t === 'collection' ? 'My Collection' : 'Milestones'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 20) }]} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={c.accent} />
          </View>
        ) : tab === 'collection' ? (
          nfts.length > 0 ? (
            <View style={styles.nftGrid}>
              {nfts.map(nft => {
                const color = getColor(nft.name);
                const icon = getIcon(nft.name);
                return (
                  <View key={nft.id} style={[styles.nftCard, { backgroundColor: c.surface }]}>
                    <View style={[styles.nftImagePlaceholder, { backgroundColor: color + '22' }]}>
                      <Ionicons name={icon as any} size={42} color={color} />
                    </View>
                    <View style={styles.nftInfo}>
                      <Text style={[styles.nftName, { color: c.text, fontFamily: 'DMSans_700Bold' }]} numberOfLines={1}>{nft.name}</Text>
                      <Text style={[styles.nftMilestone, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]} numberOfLines={1}>
                        {nft.milestoneType} - {nft.milestoneValue} {nft.milestoneType === 'customer' ? 'orders' : 'deliveries'}
                      </Text>
                      <View style={[styles.statusBadge, { backgroundColor: nft.status === 'minted' ? c.greenLight : c.yellowLight }]}>
                        <Text style={[styles.statusText, { color: nft.status === 'minted' ? c.green : c.yellow, fontFamily: 'DMSans_600SemiBold' }]}>
                          {nft.status === 'minted' ? 'Minted' : nft.status === 'pending' ? 'Ready to Mint' : nft.status}
                        </Text>
                      </View>
                    </View>
                    {nft.tokenId && (
                      <Text style={[styles.tokenId, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                        #{nft.tokenId}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: c.surface }]}>
                <Ionicons name="diamond-outline" size={48} color={c.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>No NFTs Yet</Text>
              <Text style={[styles.emptyDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                Complete milestones to earn exclusive achievement NFTs on Base chain
              </Text>
            </View>
          )
        ) : (
          <View style={styles.milestonesWrap}>
            {milestoneData && (
              <View style={[styles.progressCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.progressTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Your Progress</Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressItem}>
                    <Text style={[styles.progressValue, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>
                      {milestoneData.progress.orders}
                    </Text>
                    <Text style={[styles.progressLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Orders</Text>
                  </View>
                  <View style={[styles.progressDivider, { backgroundColor: c.border }]} />
                  <View style={styles.progressItem}>
                    <Text style={[styles.progressValue, { color: c.orange, fontFamily: 'DMSans_700Bold' }]}>
                      {milestoneData.progress.deliveries}
                    </Text>
                    <Text style={[styles.progressLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Deliveries</Text>
                  </View>
                </View>
              </View>
            )}

            {milestoneData?.milestones.map((ms, i) => {
              const color = getColor(ms.name);
              const icon = getIcon(ms.name);
              return (
                <View key={i} style={[styles.milestoneCard, { backgroundColor: c.surface, borderColor: ms.earned ? color + '44' : c.border, borderWidth: 1 }]}>
                  <View style={[styles.milestoneIcon, { backgroundColor: ms.earned ? color + '22' : c.surfaceElevated }]}>
                    <Ionicons name={icon as any} size={28} color={ms.earned ? color : c.textTertiary} />
                  </View>
                  <View style={styles.milestoneInfo}>
                    <Text style={[styles.milestoneName, { color: ms.earned ? color : c.text, fontFamily: 'DMSans_700Bold' }]}>{ms.name}</Text>
                    <Text style={[styles.milestoneDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{ms.description}</Text>
                    <View style={styles.milestoneProgress}>
                      <View style={[styles.milestoneBar, { backgroundColor: c.surfaceElevated }]}>
                        <View
                          style={[
                            styles.milestoneBarFill,
                            {
                              backgroundColor: color,
                              width: `${Math.min(
                                ((ms.type === 'customer'
                                  ? milestoneData?.progress.orders || 0
                                  : milestoneData?.progress.deliveries || 0) /
                                  ms.value) *
                                  100,
                                100
                              )}%`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.milestoneCount, { color: c.textTertiary, fontFamily: 'DMSans_500Medium' }]}>
                        {ms.type === 'customer'
                          ? milestoneData?.progress.orders || 0
                          : milestoneData?.progress.deliveries || 0}
                        /{ms.value}
                      </Text>
                    </View>
                  </View>
                  {ms.earned && (
                    <Ionicons name="checkmark-circle" size={24} color={color} />
                  )}
                </View>
              );
            })}
          </View>
        )}
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
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabText: { fontSize: 14 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  loadingWrap: { paddingTop: 80, alignItems: 'center' },
  nftGrid: { gap: 12 },
  nftCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  nftImagePlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nftInfo: { flex: 1, gap: 4 },
  nftName: { fontSize: 16 },
  nftMilestone: { fontSize: 12 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 4,
  },
  statusText: { fontSize: 11 },
  tokenId: { fontSize: 12 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 14,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 22 },
  emptyDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  milestonesWrap: { gap: 12 },
  progressCard: {
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  progressTitle: { fontSize: 16 },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressItem: { flex: 1, alignItems: 'center', gap: 4 },
  progressValue: { fontSize: 32 },
  progressLabel: { fontSize: 13 },
  progressDivider: { width: 1, height: 40 },
  milestoneCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  milestoneIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: { flex: 1, gap: 4 },
  milestoneName: { fontSize: 15 },
  milestoneDesc: { fontSize: 12 },
  milestoneProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  milestoneBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  milestoneBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  milestoneCount: { fontSize: 12, minWidth: 40, textAlign: 'right' },
});
