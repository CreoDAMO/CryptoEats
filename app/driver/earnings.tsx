import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const TODAY_EARNINGS = {
  basePay: 42.00,
  tips: 22.00,
  bonuses: 3.50,
  total: 67.50,
};

const WEEKLY_DATA = [
  { day: 'Mon', amount: 52.00 },
  { day: 'Tue', amount: 78.50 },
  { day: 'Wed', amount: 45.00 },
  { day: 'Thu', amount: 91.25 },
  { day: 'Fri', amount: 110.00 },
  { day: 'Sat', amount: 135.75 },
  { day: 'Sun', amount: 67.50 },
];

const DELIVERY_HISTORY = [
  { id: '1', restaurant: 'Cuban Corner', payout: 4.50, tip: 3.00, time: '2:15 PM' },
  { id: '2', restaurant: 'Sakura Sushi Bar', payout: 5.75, tip: 4.00, time: '1:30 PM' },
  { id: '3', restaurant: 'Pasta Palace', payout: 3.50, tip: 2.50, time: '12:45 PM' },
  { id: '4', restaurant: 'Burger Barn', payout: 4.00, tip: 5.00, time: '11:20 AM' },
  { id: '5', restaurant: 'Taco Loco', payout: 3.25, tip: 2.00, time: '10:05 AM' },
  { id: '6', restaurant: 'Thai Orchid', payout: 6.00, tip: 3.50, time: '9:30 AM' },
  { id: '7', restaurant: 'Green Bowl', payout: 5.00, tip: 2.00, time: '8:45 AM' },
  { id: '8', restaurant: 'Pizza Nova', payout: 10.00, tip: 0, time: '8:00 AM' },
];

const YEAR_EARNINGS = 8_420.50;
const maxWeekly = Math.max(...WEEKLY_DATA.map(d => d.amount));

export default function EarningsScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';

  const handleCashout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/cash-out');
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 84 : insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.todayCard, { backgroundColor: c.surface }]}>
          <Text style={[styles.todayLabel, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>Today's Earnings</Text>
          <Text style={[styles.todayTotal, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>
            ${TODAY_EARNINGS.total.toFixed(2)}
          </Text>
          <View style={styles.todayBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Base Pay</Text>
              <Text style={[styles.breakdownValue, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                ${TODAY_EARNINGS.basePay.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.breakdownDivider, { backgroundColor: c.border }]} />
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Tips</Text>
              <Text style={[styles.breakdownValue, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                ${TODAY_EARNINGS.tips.toFixed(2)}
              </Text>
            </View>
            <View style={[styles.breakdownDivider, { backgroundColor: c.border }]} />
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Bonuses</Text>
              <Text style={[styles.breakdownValue, { color: c.green, fontFamily: 'DMSans_600SemiBold' }]}>
                ${TODAY_EARNINGS.bonuses.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={handleCashout}
          style={({ pressed }) => [styles.cashoutBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather name="zap" size={20} color="#000" />
          <Text style={[styles.cashoutText, { fontFamily: 'DMSans_700Bold' }]}>Instant Cashout</Text>
          <Text style={[styles.cashoutAmount, { fontFamily: 'DMSans_700Bold' }]}>${TODAY_EARNINGS.total.toFixed(2)}</Text>
        </Pressable>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Weekly Earnings</Text>
          <View style={styles.chartContainer}>
            {WEEKLY_DATA.map((d, i) => {
              const height = (d.amount / maxWeekly) * 120;
              const isToday = i === WEEKLY_DATA.length - 1;
              return (
                <View key={d.day} style={styles.barCol}>
                  <Text style={[styles.barAmount, { color: isToday ? c.accent : c.textTertiary, fontFamily: 'DMSans_500Medium' }]}>
                    ${d.amount.toFixed(0)}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: c.background }]}>
                    <View
                      style={[
                        styles.barFill,
                        { height, backgroundColor: isToday ? c.accent : c.surfaceElevated },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barDay, { color: isToday ? c.accent : c.textTertiary, fontFamily: 'DMSans_500Medium' }]}>
                    {d.day}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.weeklyTotalRow}>
            <Text style={[styles.weeklyTotalLabel, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>Weekly Total</Text>
            <Text style={[styles.weeklyTotalValue, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
              ${WEEKLY_DATA.reduce((s, d) => s + d.amount, 0).toFixed(2)}
            </Text>
          </View>
        </View>

        {YEAR_EARNINGS > 600 && (
          <View style={[styles.taxCard, { backgroundColor: c.surface, borderColor: c.yellow, borderWidth: 1 }]}>
            <View style={styles.taxHeader}>
              <Feather name="file-text" size={18} color={c.yellow} />
              <Text style={[styles.taxTitle, { color: c.yellow, fontFamily: 'DMSans_600SemiBold' }]}>1099 Tax Tracking</Text>
            </View>
            <Text style={[styles.taxAmount, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
              ${YEAR_EARNINGS.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </Text>
            <Text style={[styles.taxNote, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              Year-to-date earnings (exceeds $600 threshold)
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Delivery Breakdown</Text>
          {DELIVERY_HISTORY.map((d, i) => (
            <View
              key={d.id}
              style={[styles.deliveryRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}
            >
              <View style={styles.deliveryInfo}>
                <Text style={[styles.deliveryRestaurant, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{d.restaurant}</Text>
                <Text style={[styles.deliveryTime, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{d.time}</Text>
              </View>
              <View style={styles.deliveryPay}>
                <Text style={[styles.deliveryPayout, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                  ${(d.payout + d.tip).toFixed(2)}
                </Text>
                {d.tip > 0 && (
                  <Text style={[styles.deliveryTip, { color: c.green, fontFamily: 'DMSans_400Regular' }]}>
                    +${d.tip.toFixed(2)} tip
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  todayCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 6,
  },
  todayLabel: { fontSize: 14 },
  todayTotal: { fontSize: 40 },
  todayBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 0,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  breakdownLabel: { fontSize: 11 },
  breakdownValue: { fontSize: 16 },
  breakdownDivider: {
    width: 1,
    height: 30,
  },
  cashoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  cashoutText: { fontSize: 16, color: '#000' },
  cashoutAmount: { fontSize: 16, color: '#000' },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, marginBottom: 14 },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 170,
    gap: 6,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  barAmount: { fontSize: 10 },
  barTrack: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barDay: { fontSize: 11 },
  weeklyTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#2A2A3C',
  },
  weeklyTotalLabel: { fontSize: 14 },
  weeklyTotalValue: { fontSize: 20 },
  taxCard: {
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  taxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taxTitle: { fontSize: 14 },
  taxAmount: { fontSize: 28 },
  taxNote: { fontSize: 12 },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  deliveryInfo: { flex: 1, gap: 2 },
  deliveryRestaurant: { fontSize: 14 },
  deliveryTime: { fontSize: 12 },
  deliveryPay: { alignItems: 'flex-end', gap: 2 },
  deliveryPayout: { fontSize: 15 },
  deliveryTip: { fontSize: 11 },
});
