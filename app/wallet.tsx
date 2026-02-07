import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

interface WalletData {
  id: string;
  walletAddress: string;
  walletType: string;
  chainId: number;
  isDefault: boolean;
  createdAt: string;
}

interface BalanceData {
  usdc: string;
  eth: string;
  chainId: number;
}

export default function WalletScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [balances, setBalances] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [inputAddress, setInputAddress] = useState('');
  const [showInput, setShowInput] = useState(false);

  const loadWallets = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/wallet/me', baseUrl).toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setWallets(data);
        if (data.length > 0) {
          loadBalance(data[0].walletAddress);
        }
      }
    } catch {}
  }, []);

  const loadBalance = async (address: string) => {
    setLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL(`/api/wallet/balance/${address}`, baseUrl).toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setBalances(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const connectWallet = async () => {
    if (!inputAddress || inputAddress.length < 42) {
      Alert.alert('Invalid Address', 'Please enter a valid Ethereum wallet address (0x...).');
      return;
    }
    setConnecting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await apiRequest('POST', '/api/wallet/connect', {
        walletAddress: inputAddress,
        walletType: 'coinbase',
        chainId: 8453,
      });
      const wallet = await res.json();
      setWallets(prev => [...prev, wallet]);
      setShowInput(false);
      setInputAddress('');
      loadBalance(wallet.walletAddress);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Connection Failed', err.message || 'Could not connect wallet.');
    }
    setConnecting(false);
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const hasWallet = wallets.length > 0;
  const defaultWallet = wallets.find(w => w.isDefault) || wallets[0];

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Wallet</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 20) }]} showsVerticalScrollIndicator={false}>
        {hasWallet ? (
          <>
            <View style={[styles.walletCard, { backgroundColor: c.surface }]}>
              <View style={styles.walletCardHeader}>
                <View style={[styles.chainBadge, { backgroundColor: '#0052FF22' }]}>
                  <MaterialCommunityIcons name="ethereum" size={20} color="#0052FF" />
                  <Text style={[styles.chainText, { color: '#0052FF', fontFamily: 'DMSans_600SemiBold' }]}>Base</Text>
                </View>
                <View style={[styles.connectedBadge, { backgroundColor: c.greenLight }]}>
                  <View style={[styles.connectedDot, { backgroundColor: c.green }]} />
                  <Text style={[styles.connectedText, { color: c.green, fontFamily: 'DMSans_600SemiBold' }]}>Connected</Text>
                </View>
              </View>

              <Text style={[styles.addressText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                {truncateAddress(defaultWallet.walletAddress)}
              </Text>

              {loading ? (
                <ActivityIndicator color={c.accent} style={{ marginTop: 20 }} />
              ) : balances ? (
                <View style={styles.balancesRow}>
                  <View style={styles.balanceItem}>
                    <Text style={[styles.balanceLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>USDC</Text>
                    <Text style={[styles.balanceValue, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                      ${parseFloat(balances.usdc).toFixed(2)}
                    </Text>
                  </View>
                  <View style={[styles.balanceDivider, { backgroundColor: c.border }]} />
                  <View style={styles.balanceItem}>
                    <Text style={[styles.balanceLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>ETH</Text>
                    <Text style={[styles.balanceValue, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                      {parseFloat(balances.eth).toFixed(4)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/marketplace'); }}
                  style={[styles.actionCard, { backgroundColor: c.background }]}
                >
                  <View style={[styles.actionIcon, { backgroundColor: c.accentLight }]}>
                    <Ionicons name="storefront-outline" size={22} color={c.accent} />
                  </View>
                  <Text style={[styles.actionLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>NFT Market</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/nft-collection'); }}
                  style={[styles.actionCard, { backgroundColor: c.background }]}
                >
                  <View style={[styles.actionIcon, { backgroundColor: c.orangeLight }]}>
                    <Ionicons name="trophy-outline" size={22} color={c.orange} />
                  </View>
                  <Text style={[styles.actionLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>My NFTs</Text>
                </Pressable>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); loadBalance(defaultWallet.walletAddress); }}
                  style={[styles.actionCard, { backgroundColor: c.background }]}
                >
                  <View style={[styles.actionIcon, { backgroundColor: c.yellowLight }]}>
                    <Feather name="refresh-cw" size={20} color={c.yellow} />
                  </View>
                  <Text style={[styles.actionLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Refresh</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Connected Wallets</Text>
              {wallets.map((w) => (
                <View key={w.id} style={[styles.walletRow, { borderBottomColor: c.border }]}>
                  <MaterialCommunityIcons name="wallet-outline" size={20} color={c.accent} />
                  <View style={styles.walletRowInfo}>
                    <Text style={[styles.walletRowAddr, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{truncateAddress(w.walletAddress)}</Text>
                    <Text style={[styles.walletRowType, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{w.walletType} - Chain {w.chainId}</Text>
                  </View>
                  {w.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: c.accentLight }]}>
                      <Text style={[styles.defaultText, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>Default</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>

            <View style={[styles.infoCard, { backgroundColor: c.accentSoft, borderColor: c.accent }]}>
              <Feather name="info" size={16} color={c.accent} />
              <Text style={[styles.infoText, { color: c.accent, fontFamily: 'DMSans_400Regular' }]}>
                Payments are secured by smart contract escrow on Base. USDC is held until delivery is confirmed.
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: c.surface }]}>
                <MaterialCommunityIcons name="wallet-outline" size={48} color={c.accent} />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Connect Your Wallet</Text>
              <Text style={[styles.emptyDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                Link your crypto wallet to pay with USDC via smart contract escrow, earn NFT rewards for milestones, and trade in the marketplace.
              </Text>
            </View>

            <View style={[styles.featureList, { backgroundColor: c.surface }]}>
              {[
                { icon: 'shield-checkmark-outline', title: 'Escrow Payments', desc: 'USDC locked until delivery confirmed' },
                { icon: 'trophy-outline', title: 'NFT Rewards', desc: 'Earn achievement NFTs for milestones' },
                { icon: 'storefront-outline', title: 'Marketplace', desc: 'Trade and collect exclusive NFTs' },
                { icon: 'flash-outline', title: 'Gasless on Base', desc: 'Low-cost transactions on Base chain' },
              ].map((feature, i) => (
                <View key={i} style={[styles.featureRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
                  <View style={[styles.featureIcon, { backgroundColor: c.accentLight }]}>
                    <Ionicons name={feature.icon as any} size={20} color={c.accent} />
                  </View>
                  <View style={styles.featureInfo}>
                    <Text style={[styles.featureTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{feature.title}</Text>
                    <Text style={[styles.featureDesc, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{feature.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {showInput ? (
              <View style={[styles.inputCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.inputLabel, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Wallet Address</Text>
                <TextInput
                  style={[styles.addressInput, { color: c.text, backgroundColor: c.background, fontFamily: 'DMSans_400Regular' }]}
                  placeholder="0x..."
                  placeholderTextColor={c.textTertiary}
                  value={inputAddress}
                  onChangeText={setInputAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <View style={styles.inputActions}>
                  <Pressable
                    onPress={() => { setShowInput(false); setInputAddress(''); }}
                    style={[styles.cancelBtn, { backgroundColor: c.surfaceElevated }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    onPress={connectWallet}
                    disabled={connecting}
                    style={[styles.connectSmallBtn, { backgroundColor: c.accent, opacity: connecting ? 0.6 : 1 }]}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={[styles.connectBtnText, { fontFamily: 'DMSans_700Bold' }]}>Connect</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowInput(true); }}
                style={({ pressed }) => [styles.connectBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
              >
                <MaterialCommunityIcons name="wallet-plus-outline" size={22} color="#000" />
                <Text style={[styles.connectBtnText, { fontFamily: 'DMSans_700Bold' }]}>Connect Wallet</Text>
              </Pressable>
            )}

            <View style={[styles.infoCard, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}>
              <Feather name="lock" size={14} color={c.textSecondary} />
              <Text style={[styles.infoText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                We never store your private keys. All transactions are signed locally in your wallet.
              </Text>
            </View>
          </>
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
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 18 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  walletCard: {
    borderRadius: 20,
    padding: 24,
    gap: 12,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chainBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  chainText: { fontSize: 13 },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
  },
  connectedDot: { width: 8, height: 8, borderRadius: 4 },
  connectedText: { fontSize: 12 },
  addressText: { fontSize: 15, letterSpacing: 1 },
  balancesRow: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 16,
  },
  balanceItem: { flex: 1, gap: 4 },
  balanceLabel: { fontSize: 12 },
  balanceValue: { fontSize: 22 },
  balanceDivider: { width: 1 },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 16 },
  actionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: { fontSize: 12 },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  walletRowInfo: { flex: 1 },
  walletRowAddr: { fontSize: 14 },
  walletRowType: { fontSize: 12, marginTop: 2 },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultText: { fontSize: 11 },
  infoCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
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
  emptyTitle: { fontSize: 24 },
  emptyDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  featureList: {
    borderRadius: 16,
    padding: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureInfo: { flex: 1, gap: 2 },
  featureTitle: { fontSize: 15 },
  featureDesc: { fontSize: 12 },
  inputCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  inputLabel: { fontSize: 14 },
  addressInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  cancelBtnText: { fontSize: 15 },
  connectSmallBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  connectBtnText: { fontSize: 16, color: '#000' },
});
