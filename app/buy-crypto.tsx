import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Alert, TextInput, ActivityIndicator, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

interface BuyOption {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
}

interface CryptoOption {
  code: string;
  name: string;
  network: string;
  decimals: number;
  minAmount: number;
  contractAddress?: string;
}

interface Quote {
  purchaseCurrency: string;
  quotePrice: string;
  coinbaseFee: string;
  networkFee: string;
  totalFee: string;
  expiresAt: string;
  gasless: boolean;
}

interface OnrampTx {
  id: string;
  fiatAmount: string;
  cryptoCurrency: string;
  cryptoAmount: string | null;
  status: string;
  paymentMethod: string | null;
  createdAt: string;
  completedAt: string | null;
}

const AMOUNT_PRESETS = [10, 25, 50, 100, 250];

export default function BuyCryptoScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const params = useLocalSearchParams<{ prefill?: string }>();

  const [amount, setAmount] = useState(params.prefill || '');
  const [selectedCrypto, setSelectedCrypto] = useState('USDC');
  const [selectedPayment, setSelectedPayment] = useState('CARD');
  const [paymentMethods, setPaymentMethods] = useState<BuyOption[]>([]);
  const [cryptos, setCryptos] = useState<CryptoOption[]>([]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [history, setHistory] = useState<OnrampTx[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [step, setStep] = useState<'amount' | 'review' | 'processing' | 'success'>('amount');
  const [walletAddress, setWalletAddress] = useState('');

  const loadBuyOptions = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/onramp/buy-options?country=US&subdivision=FL', baseUrl).toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.paymentMethods || []);
        setCryptos(data.purchaseCurrencies || []);
      }
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/onramp/history', baseUrl).toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch {}
  }, []);

  const loadWallet = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/wallet/me', baseUrl).toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0) {
          setWalletAddress(data[0].walletAddress);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadBuyOptions();
    loadHistory();
    loadWallet();
  }, [loadBuyOptions, loadHistory, loadWallet]);

  const getQuote = async () => {
    if (!amount || parseFloat(amount) < 1) {
      Alert.alert('Invalid Amount', 'Please enter at least $1.');
      return;
    }
    setLoadingQuote(true);
    try {
      const res = await apiRequest('POST', '/api/onramp/buy-quote', {
        purchaseCurrency: selectedCrypto,
        paymentAmount: amount,
        paymentCurrency: 'USD',
        paymentMethod: selectedPayment,
        network: 'base',
      });
      const data = await res.json();
      setQuote(data);
      setStep('review');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message || '';
      if (msg.includes('rate limit') || msg.includes('too many')) {
        Alert.alert('Please Wait', 'Too many quote requests. Try again in a moment.');
      } else if (msg.includes('network') || msg.includes('chain')) {
        Alert.alert('Network Issue', 'Could not reach Base network. Check your connection and try again.');
      } else {
        Alert.alert('Quote Error', msg || 'Failed to get quote. Please try again.');
      }
    }
    setLoadingQuote(false);
  };

  const handlePurchase = async () => {
    if (!walletAddress) {
      Alert.alert('No Wallet', 'Please connect a wallet first.');
      return;
    }
    setPurchasing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const res = await apiRequest('POST', '/api/onramp/initiate', {
        fiatAmount: parseFloat(amount),
        cryptoCurrency: selectedCrypto,
        paymentMethod: selectedPayment,
        walletAddress,
      });
      const data = await res.json();
      setStep('processing');
      setTimeout(async () => {
        try {
          await apiRequest('POST', '/api/onramp/simulate-complete', {
            transactionId: data.transaction.id,
            cryptoAmount: quote?.quotePrice || amount,
          });
        } catch {}
        setStep('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        loadHistory();
      }, 2500);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err.message || '';
      if (msg.includes('payment') || msg.includes('402')) {
        Alert.alert('Payment Issue', 'Your payment method could not be processed. Please check your details and try again.');
      } else if (msg.includes('policy') || msg.includes('rejected')) {
        Alert.alert('Transaction Blocked', 'This transaction was blocked by our security policy. Please contact support if this persists.');
      } else if (msg.includes('gas') || msg.includes('estimate')) {
        Alert.alert('Transaction Error', 'Could not process this gasless transaction. The Paymaster service may be temporarily unavailable.');
      } else {
        Alert.alert('Purchase Failed', msg || 'Could not complete purchase. Please try again.');
      }
      setPurchasing(false);
    }
  };

  const resetFlow = () => {
    setStep('amount');
    setAmount('');
    setQuote(null);
    setPurchasing(false);
  };

  const paymentIcons: Record<string, string> = {
    CARD: 'card-outline',
    APPLE_PAY: 'logo-apple',
    GOOGLE_PAY: 'logo-google',
    PAYPAL: 'logo-paypal',
  };

  const cryptoIcons: Record<string, { icon: string; color: string }> = {
    USDC: { icon: 'disc-outline', color: '#2775CA' },
    ETH: { icon: 'diamond-outline', color: '#627EEA' },
    cbBTC: { icon: 'logo-bitcoin', color: '#F7931A' },
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => step === 'amount' ? router.back() : setStep('amount')}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
          {step === 'success' ? 'Purchase Complete' : 'Buy Crypto'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 20) + 20 }]} showsVerticalScrollIndicator={false}>
        {step === 'amount' && (
          <>
            <View style={[styles.amountCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.amountLabel, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>You pay (USD)</Text>
              <View style={styles.amountInputRow}>
                <Text style={[styles.dollarSign, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>$</Text>
                <TextInput
                  style={[styles.amountInput, { color: c.text, fontFamily: 'DMSans_700Bold' }]}
                  placeholder="0.00"
                  placeholderTextColor={c.textTertiary}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                />
              </View>
              <View style={styles.presets}>
                {AMOUNT_PRESETS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => { setAmount(p.toString()); Haptics.selectionAsync(); }}
                    style={[styles.presetBtn, { backgroundColor: amount === p.toString() ? c.accent + '22' : c.background, borderColor: amount === p.toString() ? c.accent : c.border, borderWidth: 1 }]}
                  >
                    <Text style={[styles.presetText, { color: amount === p.toString() ? c.accent : c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>${p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>You receive</Text>
              <View style={styles.cryptoOptions}>
                {cryptos.map((cr) => {
                  const active = selectedCrypto === cr.code;
                  const iconInfo = cryptoIcons[cr.code] || { icon: 'ellipse-outline', color: c.accent };
                  return (
                    <Pressable
                      key={cr.code}
                      onPress={() => { setSelectedCrypto(cr.code); Haptics.selectionAsync(); }}
                      style={[styles.cryptoOption, { backgroundColor: active ? iconInfo.color + '15' : c.background, borderColor: active ? iconInfo.color : c.border, borderWidth: 1 }]}
                    >
                      <Ionicons name={iconInfo.icon as any} size={22} color={iconInfo.color} />
                      <View style={styles.cryptoInfo}>
                        <Text style={[styles.cryptoName, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{cr.code}</Text>
                        <Text style={[styles.cryptoSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{cr.name}</Text>
                      </View>
                      {cr.code === 'USDC' && (
                        <View style={[styles.gaslessBadge, { backgroundColor: c.greenLight }]}>
                          <Ionicons name="flash" size={10} color={c.green} />
                          <Text style={[styles.gaslessText, { color: c.green, fontFamily: 'DMSans_600SemiBold' }]}>Gasless</Text>
                        </View>
                      )}
                      {active && <Ionicons name="checkmark-circle" size={20} color={iconInfo.color} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Pay with</Text>
              <View style={styles.paymentOptions}>
                {paymentMethods.map((pm) => {
                  const active = selectedPayment === pm.id;
                  return (
                    <Pressable
                      key={pm.id}
                      onPress={() => { setSelectedPayment(pm.id); Haptics.selectionAsync(); }}
                      style={[styles.paymentOption, { backgroundColor: active ? c.accentLight : c.background, borderColor: active ? c.accent : c.border, borderWidth: 1 }]}
                    >
                      <Ionicons name={paymentIcons[pm.id] as any || 'card-outline'} size={20} color={active ? c.accent : c.textSecondary} />
                      <Text style={[styles.paymentName, { color: active ? c.accent : c.text, fontFamily: 'DMSans_500Medium' }]}>{pm.name}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={getQuote}
              disabled={loadingQuote || !amount || parseFloat(amount) < 1}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.accent, opacity: (loadingQuote || !amount || parseFloat(amount) < 1) ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              {loadingQuote ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.primaryBtnText, { fontFamily: 'DMSans_700Bold' }]}>Get Quote</Text>
              )}
            </Pressable>

            {history.length > 0 && (
              <View style={[styles.section, { backgroundColor: c.surface }]}>
                <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Recent Purchases</Text>
                {history.slice(0, 5).map((tx) => (
                  <View key={tx.id} style={[styles.historyRow, { borderBottomColor: c.border }]}>
                    <View style={[styles.historyIcon, { backgroundColor: tx.status === 'completed' ? c.greenLight : c.yellowLight }]}>
                      <Ionicons name={tx.status === 'completed' ? 'checkmark' : 'time-outline'} size={16} color={tx.status === 'completed' ? c.green : c.yellow} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyAmount, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                        ${parseFloat(tx.fiatAmount).toFixed(2)} {tx.cryptoCurrency}
                      </Text>
                      <Text style={[styles.historyDate, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: tx.status === 'completed' ? c.greenLight : c.yellowLight }]}>
                      <Text style={[styles.statusText, { color: tx.status === 'completed' ? c.green : c.yellow, fontFamily: 'DMSans_600SemiBold' }]}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {step === 'review' && quote && (
          <>
            <View style={[styles.reviewCard, { backgroundColor: c.surface }]}>
              <View style={styles.reviewHeader}>
                <Ionicons name={(cryptoIcons[selectedCrypto]?.icon as any) || 'disc-outline'} size={36} color={cryptoIcons[selectedCrypto]?.color || c.accent} />
                <Text style={[styles.reviewAmount, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                  {parseFloat(quote.quotePrice).toFixed(selectedCrypto === 'USDC' ? 2 : 6)} {selectedCrypto}
                </Text>
                <Text style={[styles.reviewFiat, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                  for ${parseFloat(amount).toFixed(2)} USD
                </Text>
              </View>

              <View style={[styles.reviewDivider, { backgroundColor: c.border }]} />

              <View style={styles.reviewDetails}>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Amount</Text>
                  <Text style={[styles.reviewValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${parseFloat(amount).toFixed(2)}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Coinbase Fee</Text>
                  <Text style={[styles.reviewValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${quote.coinbaseFee}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Network Fee</Text>
                  <Text style={[styles.reviewValue, { color: quote.gasless ? c.green : c.text, fontFamily: 'DMSans_500Medium' }]}>
                    {quote.gasless ? 'Free (Gasless)' : `$${quote.networkFee}`}
                  </Text>
                </View>
                <View style={[styles.reviewRow, { paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }]}>
                  <Text style={[styles.reviewLabel, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>You receive</Text>
                  <Text style={[styles.reviewValue, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>
                    {parseFloat(quote.quotePrice).toFixed(selectedCrypto === 'USDC' ? 2 : 6)} {selectedCrypto}
                  </Text>
                </View>
              </View>
            </View>

            {quote.gasless && (
              <View style={[styles.gaslessCard, { backgroundColor: c.greenLight, borderColor: c.green }]}>
                <Ionicons name="flash" size={16} color={c.green} />
                <Text style={[styles.gaslessCardText, { color: c.green, fontFamily: 'DMSans_500Medium' }]}>
                  Gas fees are sponsored by Base Paymaster. No ETH needed for USDC transfers.
                </Text>
              </View>
            )}

            <View style={[styles.reviewCard, { backgroundColor: c.surface }]}>
              <View style={styles.reviewRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color={c.accent} />
                <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular', flex: 1, marginLeft: 8 }]}>
                  Powered by Coinbase. Funds go directly to your Base wallet.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handlePurchase}
              disabled={purchasing}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.accent, opacity: purchasing ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              {purchasing ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[styles.primaryBtnText, { fontFamily: 'DMSans_700Bold' }]}>
                  Buy ${parseFloat(amount).toFixed(2)} of {selectedCrypto}
                </Text>
              )}
            </Pressable>
          </>
        )}

        {step === 'processing' && (
          <View style={styles.processingState}>
            <ActivityIndicator size="large" color={c.accent} />
            <Text style={[styles.processingTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Processing Purchase</Text>
            <Text style={[styles.processingDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              Your {selectedCrypto} is being purchased on the Base network. This usually takes a few seconds...
            </Text>
          </View>
        )}

        {step === 'success' && (
          <>
            <View style={styles.successState}>
              <View style={[styles.successIcon, { backgroundColor: c.greenLight }]}>
                <Ionicons name="checkmark-circle" size={64} color={c.green} />
              </View>
              <Text style={[styles.successTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Purchase Successful</Text>
              <Text style={[styles.successDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                {quote ? parseFloat(quote.quotePrice).toFixed(selectedCrypto === 'USDC' ? 2 : 6) : amount} {selectedCrypto} has been added to your Base wallet.
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/wallet')}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.primaryBtnText, { fontFamily: 'DMSans_700Bold' }]}>View Wallet</Text>
            </Pressable>

            <Pressable
              onPress={resetFlow}
              style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.secondaryBtnText, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>Buy More</Text>
            </Pressable>
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
  amountCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  amountLabel: { fontSize: 14 },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dollarSign: { fontSize: 36 },
  amountInput: {
    fontSize: 36,
    minWidth: 120,
    textAlign: 'center',
  },
  presets: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  presetText: { fontSize: 14 },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  sectionTitle: { fontSize: 16 },
  cryptoOptions: { gap: 8 },
  cryptoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  cryptoInfo: { flex: 1, gap: 1 },
  cryptoName: { fontSize: 15 },
  cryptoSub: { fontSize: 12 },
  gaslessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  gaslessText: { fontSize: 10 },
  paymentOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  paymentName: { fontSize: 13 },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 16, color: '#000' },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
  },
  secondaryBtnText: { fontSize: 16 },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: { flex: 1, gap: 2 },
  historyAmount: { fontSize: 14 },
  historyDate: { fontSize: 12 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11 },
  reviewCard: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  reviewHeader: {
    alignItems: 'center',
    gap: 8,
  },
  reviewAmount: { fontSize: 28 },
  reviewFiat: { fontSize: 15 },
  reviewDivider: { height: 1 },
  reviewDetails: { gap: 10 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: { fontSize: 14 },
  reviewValue: { fontSize: 14 },
  gaslessCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
  },
  gaslessCardText: { flex: 1, fontSize: 13, lineHeight: 18 },
  processingState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 20,
  },
  processingTitle: { fontSize: 22 },
  processingDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  successState: {
    alignItems: 'center',
    paddingTop: 40,
    gap: 14,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 24 },
  successDesc: { fontSize: 15, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20, marginBottom: 12 },
});
