import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Alert, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/lib/cart-context';
import { PAYMENT_METHODS } from '@/lib/data';

const TIP_OPTIONS = [
  { label: '15%', multiplier: 0.15 },
  { label: '18%', multiplier: 0.18 },
  { label: '20%', multiplier: 0.20 },
  { label: '25%', multiplier: 0.25 },
];

function isAlcoholWindowOpen(): boolean {
  const hour = new Date().getHours();
  return hour >= 8 && hour < 22;
}

export default function CheckoutScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const {
    items, subtotal, deliveryFee, serviceFee, tax, total, taxRate,
    tip, setTip, paymentMethod, setPaymentMethod,
    hasAlcohol, ageVerified, setAgeVerified, placeOrder,
    specialInstructions, setSpecialInstructions,
  } = useCart();

  const [selectedTipIndex, setSelectedTipIndex] = useState(1);
  const [isPlacing, setIsPlacing] = useState(false);
  const deliveryAddress = '420 Ocean Dr, Miami Beach, FL 33139';

  const alcoholWindowOpen = useMemo(() => isAlcoholWindowOpen(), []);
  const alcoholBlocked = hasAlcohol && !alcoholWindowOpen;

  const handleTipSelect = (index: number) => {
    setSelectedTipIndex(index);
    const tipAmount = parseFloat((subtotal * TIP_OPTIONS[index].multiplier).toFixed(2));
    setTip(tipAmount);
  };

  const handlePlaceOrder = async () => {
    if (hasAlcohol && !ageVerified) {
      Alert.alert('Age Verification Required', 'Please verify your age to order alcohol items.');
      return;
    }
    if (alcoholBlocked) {
      Alert.alert('Alcohol Delivery Unavailable', 'Alcohol delivery is only available between 8 AM and 10 PM.');
      return;
    }
    setIsPlacing(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const order = await placeOrder(deliveryAddress);
      router.replace({ pathname: '/tracking/[id]', params: { id: order.id } });
    } catch {
      Alert.alert('Error', 'Failed to place order. Please try again.');
    } finally {
      setIsPlacing(false);
    }
  };

  if (items.length === 0) {
    router.back();
    return null;
  }

  const isCrypto = paymentMethod === 'bitcoin' || paymentMethod === 'ethereum' || paymentMethod === 'usdc';
  const checkoutDisabled = isPlacing || (hasAlcohol && !ageVerified) || alcoholBlocked;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 140 : 140 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="map-pin" size={16} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Delivery address</Text>
          </View>
          <Text style={[styles.address, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{deliveryAddress}</Text>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="edit-3" size={16} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Special instructions</Text>
          </View>
          <TextInput
            style={[styles.instructionsInput, { color: c.text, backgroundColor: c.background, fontFamily: 'DMSans_400Regular' }]}
            placeholder="Add delivery instructions, allergies, etc."
            placeholderTextColor={c.textTertiary}
            value={specialInstructions}
            onChangeText={setSpecialInstructions}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {hasAlcohol && (
          <View style={[styles.section, { backgroundColor: c.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="shield-checkmark" size={16} color={c.accent} />
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Age Verification</Text>
            </View>
            <Text style={[styles.ageDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              Your order contains alcohol. You must be 21+ to order. ID will be verified at delivery.
            </Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAgeVerified(!ageVerified);
              }}
              style={[
                styles.ageBtn,
                { backgroundColor: ageVerified ? c.greenLight : c.surfaceElevated, borderColor: ageVerified ? c.green : c.border },
              ]}
            >
              {ageVerified ? (
                <Ionicons name="checkmark-circle" size={20} color={c.green} />
              ) : (
                <View style={[styles.emptyCircle, { borderColor: c.textTertiary }]} />
              )}
              <Text style={[styles.ageBtnText, { color: ageVerified ? c.green : c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>
                I confirm I am 21 years or older
              </Text>
            </Pressable>
          </View>
        )}

        {hasAlcohol && (
          <View style={[styles.alcoholNotice, { backgroundColor: alcoholBlocked ? c.redLight : c.accentSoft }]}>
            <Feather name="clock" size={14} color={alcoholBlocked ? c.red : c.accent} />
            <Text style={[styles.alcoholNoticeText, { color: alcoholBlocked ? c.red : c.accent, fontFamily: 'DMSans_500Medium' }]}>
              {alcoholBlocked
                ? 'Alcohol delivery is unavailable right now (8 AM - 10 PM only)'
                : 'Alcohol delivery available 8 AM - 10 PM'}
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="credit-card" size={16} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Payment method</Text>
          </View>
          {PAYMENT_METHODS.map(method => {
            const active = paymentMethod === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPaymentMethod(method.id);
                }}
                style={[
                  styles.paymentOption,
                  { backgroundColor: active ? c.accentSoft : 'transparent', borderColor: active ? c.accent : c.border },
                ]}
              >
                <Feather name={method.icon as any} size={18} color={active ? c.accent : c.textSecondary} />
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{method.label}</Text>
                  <Text style={[styles.paymentSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{method.sublabel}</Text>
                </View>
                {active && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
              </Pressable>
            );
          })}
          {isCrypto && (
            <View style={[styles.cryptoNote, { backgroundColor: c.yellowLight }]}>
              <Feather name="info" size={14} color={c.yellow} />
              <Text style={[styles.cryptoNoteText, { color: c.yellow, fontFamily: 'DMSans_400Regular' }]}>
                Rate locked for 15 minutes. USD value recorded for tax purposes.
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="heart" size={16} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Driver tip</Text>
          </View>
          <View style={styles.tipRow}>
            {TIP_OPTIONS.map((opt, i) => {
              const active = selectedTipIndex === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => handleTipSelect(i)}
                  style={[styles.tipOption, { backgroundColor: active ? c.accent : c.surfaceElevated }]}
                >
                  <Text style={[styles.tipLabel, { color: active ? '#000' : c.textSecondary, fontFamily: active ? 'DMSans_700Bold' : 'DMSans_500Medium' }]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.tipAmount, { color: active ? '#000' : c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                    ${(subtotal * opt.multiplier).toFixed(2)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="file-text" size={16} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Price breakdown (SB 676)</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Subtotal</Text>
            <Text style={[styles.priceValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Delivery fee</Text>
            <Text style={[styles.priceValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${deliveryFee.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Service fee (12%)</Text>
            <Text style={[styles.priceValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${serviceFee.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Tax ({(taxRate * 100).toFixed(0)}%)</Text>
            <Text style={[styles.priceValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${tax.toFixed(2)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={[styles.priceLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Driver tip</Text>
            <Text style={[styles.priceValue, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>${tip.toFixed(2)}</Text>
          </View>
          <View style={[styles.priceRow, styles.totalRow, { borderTopColor: c.border }]}>
            <Text style={[styles.totalLabel, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Total</Text>
            <Text style={[styles.totalValue, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: c.surface, paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 16) }]}>
        <Pressable
          onPress={handlePlaceOrder}
          disabled={checkoutDisabled}
          style={({ pressed }) => [
            styles.placeBtn,
            {
              backgroundColor: checkoutDisabled ? c.surfaceElevated : c.accent,
              opacity: pressed ? 0.85 : isPlacing ? 0.7 : 1,
            },
          ]}
        >
          {isPlacing ? (
            <Text style={[styles.placeBtnText, { fontFamily: 'DMSans_700Bold' }]}>Placing order...</Text>
          ) : (
            <>
              <Text style={[styles.placeBtnText, { fontFamily: 'DMSans_700Bold', color: checkoutDisabled ? c.textTertiary : '#000' }]}>
                Place order
              </Text>
              <Text style={[styles.placeBtnTotal, { fontFamily: 'DMSans_700Bold', color: checkoutDisabled ? c.textTertiary : '#000' }]}>
                ${total.toFixed(2)}
              </Text>
            </>
          )}
        </Pressable>
      </View>
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
  scroll: { paddingHorizontal: 20, gap: 14 },
  section: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: { fontSize: 16 },
  address: { fontSize: 14, marginLeft: 24 },
  instructionsInput: {
    minHeight: 70,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  ageDesc: { fontSize: 13, lineHeight: 18 },
  ageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  ageBtnText: { fontSize: 14 },
  emptyCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  alcoholNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  alcoholNoticeText: { flex: 1, fontSize: 13 },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 14 },
  paymentSub: { fontSize: 12, marginTop: 1 },
  cryptoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  cryptoNoteText: { flex: 1, fontSize: 12 },
  tipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tipOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 2,
  },
  tipLabel: { fontSize: 15 },
  tipAmount: { fontSize: 12 },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceLabel: { fontSize: 14 },
  priceValue: { fontSize: 14 },
  totalRow: { borderTopWidth: 1, paddingTop: 12, marginTop: 4 },
  totalLabel: { fontSize: 17 },
  totalValue: { fontSize: 17 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  placeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  placeBtnText: { fontSize: 16, color: '#000' },
  placeBtnTotal: { fontSize: 16, color: '#000' },
});
