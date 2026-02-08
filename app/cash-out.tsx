import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Alert, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { apiRequest, getApiUrl } from '@/lib/query-client';
import { fetch } from 'expo/fetch';

interface CashoutMethod {
  id: string;
  name: string;
  estimatedDays: string;
  minAmount: number;
  maxAmount: number;
  fee?: string;
}

interface SellCurrency {
  code: string;
  name: string;
  network: string;
  decimals: number;
  minAmount: number;
  contractAddress?: string;
}

interface SellQuote {
  sellCurrency: string;
  sellAmount: string;
  fiatCurrency: string;
  grossAmount: string;
  fee: string;
  netAmount: string;
  exchangeRate: string;
  cashoutMethod: string;
  estimatedArrival: string;
  quoteId: string;
  expiresAt: string;
}

interface OfframpTx {
  id: string;
  cryptoAmount: string;
  cryptoCurrency: string;
  fiatAmount: string | null;
  status: string;
  cashoutMethod: string | null;
  estimatedArrival: string | null;
  createdAt: string;
  completedAt: string | null;
}

const AMOUNT_PRESETS = [10, 25, 50, 100, 'ALL'];

export default function CashOutScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [amount, setAmount] = useState('');
  const [selectedCrypto, setSelectedCrypto] = useState('USDC');
  const [selectedMethod, setSelectedMethod] = useState('BANK_ACCOUNT');
  const [cashoutMethods, setCashoutMethods] = useState<CashoutMethod[]>([]);
  const [sellCurrencies, setSellCurrencies] = useState<SellCurrency[]>([]);
  const [quote, setQuote] = useState<SellQuote | null>(null);
  const [history, setHistory] = useState<OfframpTx[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'amount' | 'review' | 'processing' | 'success'>('amount');
  const [walletAddress, setWalletAddress] = useState('');
  const [walletBalance, setWalletBalance] = useState<string | null>(null);

  const loadSellOptions = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/offramp/sell-options', baseUrl).toString(), { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setCashoutMethods(data.cashoutMethods || []);
        setSellCurrencies(data.sellCurrencies || []);
      }
    } catch {}
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/offramp/history', baseUrl).toString(), { credentials: 'include' });
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
          if (data[0].balance) setWalletBalance(data[0].balance);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    loadSellOptions();
    loadHistory();
    loadWallet();
  }, [loadSellOptions, loadHistory, loadWallet]);

  const getQuote = async () => {
    if (!amount || parseFloat(amount) < 1) {
      Alert.alert('Invalid Amount', 'Please enter at least 1 USDC.');
      return;
    }
    setLoadingQuote(true);
    try {
      const res = await apiRequest('POST', '/api/offramp/sell-quote', {
        sellCurrency: selectedCrypto,
        sellAmount: amount,
        cashoutMethod: selectedMethod,
      });
      const data = await res.json();
      setQuote(data);
      setStep('review');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Quote Error', err.message || 'Failed to get quote. Please try again.');
    }
    setLoadingQuote(false);
  };

  const handleCashOut = async () => {
    if (!walletAddress) {
      Alert.alert('No Wallet', 'Please connect a wallet first.');
      return;
    }
    setProcessing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const res = await apiRequest('POST', '/api/offramp/initiate', {
        cryptoAmount: parseFloat(amount),
        cryptoCurrency: selectedCrypto,
        cashoutMethod: selectedMethod,
        walletAddress,
        quoteId: quote?.quoteId,
        fee: quote?.fee,
        exchangeRate: quote?.exchangeRate,
        estimatedArrival: quote?.estimatedArrival,
      });
      const data = await res.json();
      setStep('processing');
      setTimeout(async () => {
        try {
          await apiRequest('POST', '/api/offramp/simulate-complete', {
            transactionId: data.transaction.id,
            fiatAmount: quote?.netAmount || amount,
          });
        } catch {}
        setStep('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        loadHistory();
      }, 3000);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Cash Out Failed', err.message || 'Could not complete cash out. Please try again.');
      setProcessing(false);
    }
  };

  const resetFlow = () => {
    setStep('amount');
    setAmount('');
    setQuote(null);
    setProcessing(false);
  };

  const cryptoIcons: Record<string, { icon: string; color: string }> = {
    USDC: { icon: 'disc-outline', color: '#2775CA' },
    ETH: { icon: 'diamond-outline', color: '#627EEA' },
  };

  const methodIcons: Record<string, string> = {
    BANK_ACCOUNT: 'business-outline',
    INSTANT_BANK: 'flash-outline',
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => step === 'amount' ? router.back() : setStep('amount')}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
          {step === 'success' ? 'Cash Out Complete' : 'Cash Out'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 20) + 20 }]} showsVerticalScrollIndicator={false}>
        {step === 'amount' && (
          <>
            <View style={[styles.amountCard, { backgroundColor: c.surface }]}>
              <Text style={[styles.amountLabel, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>You sell ({selectedCrypto})</Text>
              <View style={styles.amountInputRow}>
                <View style={[styles.cryptoBadge, { backgroundColor: (cryptoIcons[selectedCrypto]?.color || c.accent) + '22' }]}>
                  <Ionicons name={(cryptoIcons[selectedCrypto]?.icon as any) || 'disc-outline'} size={20} color={cryptoIcons[selectedCrypto]?.color || c.accent} />
                </View>
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
              {walletBalance && (
                <Text style={[styles.balanceText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                  Balance: {walletBalance} {selectedCrypto}
                </Text>
              )}
              <View style={styles.presets}>
                {AMOUNT_PRESETS.map((p) => {
                  const isAll = p === 'ALL';
                  const val = isAll ? (walletBalance || '0') : p.toString();
                  const active = amount === val;
                  return (
                    <Pressable
                      key={p.toString()}
                      onPress={() => { setAmount(val); Haptics.selectionAsync(); }}
                      style={[styles.presetBtn, { backgroundColor: active ? c.accent + '22' : c.background, borderColor: active ? c.accent : c.border, borderWidth: 1 }]}
                    >
                      <Text style={[styles.presetText, { color: active ? c.accent : c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>
                        {isAll ? 'Max' : `${p}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Sell from</Text>
              <View style={styles.cryptoOptions}>
                {sellCurrencies.map((cr) => {
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
                        <Text style={[styles.cryptoSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{cr.name} on Base</Text>
                      </View>
                      {active && <Ionicons name="checkmark-circle" size={20} color={iconInfo.color} />}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Cash out to</Text>
              <View style={styles.methodOptions}>
                {cashoutMethods.map((m) => {
                  const active = selectedMethod === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => { setSelectedMethod(m.id); Haptics.selectionAsync(); }}
                      style={[styles.methodOption, { backgroundColor: active ? c.accentLight : c.background, borderColor: active ? c.accent : c.border, borderWidth: 1 }]}
                    >
                      <Ionicons name={(methodIcons[m.id] as any) || 'business-outline'} size={20} color={active ? c.accent : c.textSecondary} />
                      <View style={styles.methodInfo}>
                        <Text style={[styles.methodName, { color: active ? c.accent : c.text, fontFamily: 'DMSans_500Medium' }]}>{m.name}</Text>
                        <Text style={[styles.methodSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{m.estimatedDays}</Text>
                      </View>
                      {m.id === 'INSTANT_BANK' && (
                        <View style={[styles.instantBadge, { backgroundColor: c.orangeLight }]}>
                          <Ionicons name="flash" size={10} color={c.orange} />
                          <Text style={[styles.instantText, { color: c.orange, fontFamily: 'DMSans_600SemiBold' }]}>Fast</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={getQuote}
              disabled={loadingQuote || !amount || parseFloat(amount) < 1}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: '#FF6B35', opacity: (loadingQuote || !amount || parseFloat(amount) < 1) ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              {loadingQuote ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.primaryBtnText, { color: '#FFF', fontFamily: 'DMSans_700Bold' }]}>Get Cash Out Quote</Text>
              )}
            </Pressable>

            {history.length > 0 && (
              <View style={[styles.section, { backgroundColor: c.surface }]}>
                <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Recent Cash Outs</Text>
                {history.slice(0, 5).map((tx) => (
                  <View key={tx.id} style={[styles.historyRow, { borderBottomColor: c.border }]}>
                    <View style={[styles.historyIcon, { backgroundColor: tx.status === 'completed' ? c.greenLight : tx.status === 'failed' ? c.redLight : c.yellowLight }]}>
                      <Ionicons name={tx.status === 'completed' ? 'checkmark' : tx.status === 'failed' ? 'close' : 'time-outline'} size={16} color={tx.status === 'completed' ? c.green : tx.status === 'failed' ? c.red : c.yellow} />
                    </View>
                    <View style={styles.historyInfo}>
                      <Text style={[styles.historyAmount, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                        {parseFloat(tx.cryptoAmount).toFixed(2)} {tx.cryptoCurrency}
                      </Text>
                      <Text style={[styles.historyDate, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                        {tx.fiatAmount ? `$${parseFloat(tx.fiatAmount).toFixed(2)} USD` : ''} {new Date(tx.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: tx.status === 'completed' ? c.greenLight : tx.status === 'failed' ? c.redLight : c.yellowLight }]}>
                      <Text style={[styles.statusText, { color: tx.status === 'completed' ? c.green : tx.status === 'failed' ? c.red : c.yellow, fontFamily: 'DMSans_600SemiBold' }]}>
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
                <View style={[styles.reviewIconWrap, { backgroundColor: '#FF6B3515' }]}>
                  <MaterialCommunityIcons name="bank-transfer-out" size={40} color="#FF6B35" />
                </View>
                <Text style={[styles.reviewAmount, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                  ${parseFloat(quote.netAmount).toFixed(2)}
                </Text>
                <Text style={[styles.reviewFiat, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                  for {parseFloat(quote.sellAmount).toFixed(selectedCrypto === 'USDC' ? 2 : 6)} {selectedCrypto}
                </Text>
              </View>

              <View style={[styles.reviewDivider, { backgroundColor: c.border }]} />

              <View style={styles.reviewDetails}>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Selling</Text>
                  <Text style={[styles.reviewValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{parseFloat(quote.sellAmount).toFixed(selectedCrypto === 'USDC' ? 2 : 6)} {selectedCrypto}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Gross Value</Text>
                  <Text style={[styles.reviewValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${quote.grossAmount}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Fee</Text>
                  <Text style={[styles.reviewValue, { color: c.red, fontFamily: 'DMSans_500Medium' }]}>-${quote.fee}</Text>
                </View>
                <View style={styles.reviewRow}>
                  <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Estimated Arrival</Text>
                  <Text style={[styles.reviewValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{quote.estimatedArrival}</Text>
                </View>
                <View style={[styles.reviewRow, { paddingTop: 10, borderTopWidth: 1, borderTopColor: c.border }]}>
                  <Text style={[styles.reviewLabel, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>You receive</Text>
                  <Text style={[styles.reviewValue, { color: c.green, fontFamily: 'DMSans_700Bold' }]}>
                    ${parseFloat(quote.netAmount).toFixed(2)} USD
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={styles.reviewRow}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#FF6B35" />
                <Text style={[styles.reviewLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular', flex: 1, marginLeft: 8 }]}>
                  Powered by Coinbase. Funds sent directly to your linked bank account.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleCashOut}
              disabled={processing}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: '#FF6B35', opacity: processing ? 0.5 : pressed ? 0.85 : 1 }]}
            >
              {processing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.primaryBtnText, { color: '#FFF', fontFamily: 'DMSans_700Bold' }]}>
                  Cash Out {parseFloat(quote.sellAmount).toFixed(selectedCrypto === 'USDC' ? 2 : 6)} {selectedCrypto}
                </Text>
              )}
            </Pressable>
          </>
        )}

        {step === 'processing' && (
          <View style={styles.processingState}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={[styles.processingTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Processing Cash Out</Text>
            <Text style={[styles.processingDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              Your {selectedCrypto} is being sold and {selectedMethod === 'INSTANT_BANK' ? 'transferred instantly' : 'queued for ACH transfer'}. This usually takes a few seconds...
            </Text>
          </View>
        )}

        {step === 'success' && (
          <>
            <View style={styles.successState}>
              <View style={[styles.successIcon, { backgroundColor: c.greenLight }]}>
                <Ionicons name="checkmark-circle" size={64} color={c.green} />
              </View>
              <Text style={[styles.successTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Cash Out Initiated</Text>
              <Text style={[styles.successDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                ${quote ? parseFloat(quote.netAmount).toFixed(2) : amount} USD is on its way to your bank account.
                {selectedMethod === 'INSTANT_BANK' ? ' Expect it within minutes.' : ' Expect it in 1-3 business days.'}
              </Text>
            </View>

            <Pressable
              onPress={() => router.push('/wallet')}
              style={({ pressed }) => [styles.primaryBtn, { backgroundColor: '#FF6B35', opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.primaryBtnText, { color: '#FFF', fontFamily: 'DMSans_700Bold' }]}>View Wallet</Text>
            </Pressable>

            <Pressable
              onPress={resetFlow}
              style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.secondaryBtnText, { color: '#FF6B35', fontFamily: 'DMSans_600SemiBold' }]}>Cash Out More</Text>
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
    gap: 10,
  },
  cryptoBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountInput: {
    fontSize: 36,
    minWidth: 120,
    textAlign: 'center',
  },
  balanceText: { fontSize: 13 },
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
  methodOptions: { gap: 8 },
  methodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 12,
  },
  methodInfo: { flex: 1, gap: 2 },
  methodName: { fontSize: 14 },
  methodSub: { fontSize: 12 },
  instantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  instantText: { fontSize: 10 },
  primaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  primaryBtnText: { fontSize: 16 },
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
  statusText: { fontSize: 11, textTransform: 'capitalize' as const },
  reviewCard: {
    borderRadius: 20,
    padding: 24,
    gap: 16,
  },
  reviewHeader: {
    alignItems: 'center',
    gap: 8,
  },
  reviewIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  reviewAmount: { fontSize: 32 },
  reviewFiat: { fontSize: 15 },
  reviewDivider: { height: 1 },
  reviewDetails: { gap: 12 },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewLabel: { fontSize: 14 },
  reviewValue: { fontSize: 14 },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  processingState: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 80,
  },
  processingTitle: { fontSize: 20, marginTop: 12 },
  processingDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
  successState: {
    alignItems: 'center',
    gap: 12,
    paddingTop: 40,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successTitle: { fontSize: 22 },
  successDesc: { fontSize: 14, textAlign: 'center', lineHeight: 22, paddingHorizontal: 20 },
});
