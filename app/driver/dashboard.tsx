import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const ENGAGEMENT_TIERS = [
  { name: 'Active', icon: 'zap', color: '#00D4AA', message: 'You\'re doing amazing!' },
  { name: 'Regular', icon: 'trending-up', color: '#FFD93D', message: 'Great consistency!' },
  { name: 'Casual', icon: 'coffee', color: '#FF6B35', message: 'Every delivery counts!' },
  { name: 'On Break', icon: 'moon', color: '#8F8FA3', message: 'Rest up, we\'ll be here!' },
];

const STATS = [
  { label: 'Total Deliveries', value: '234', icon: 'package', message: 'Incredible milestone!' },
  { label: 'Rating', value: '4.92', icon: 'star', message: 'Customers love you!' },
  { label: 'Acceptance Rate', value: '87%', icon: 'check-circle', message: 'Take all the time you need' },
  { label: 'On-Time Rate', value: '94%', icon: 'clock', message: 'Great job staying on track!' },
];

export default function DashboardScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [isOnBreak, setIsOnBreak] = useState(false);
  const currentTier = isOnBreak ? ENGAGEMENT_TIERS[3] : ENGAGEMENT_TIERS[0];

  const handleBreakToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsOnBreak(!isOnBreak);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 84 : insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.tierCard, { backgroundColor: c.surface, borderColor: currentTier.color, borderWidth: 1 }]}>
          <View style={[styles.tierIconWrap, { backgroundColor: currentTier.color + '22' }]}>
            <Feather name={currentTier.icon as any} size={28} color={currentTier.color} />
          </View>
          <Text style={[styles.tierLabel, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>Engagement Tier</Text>
          <Text style={[styles.tierName, { color: currentTier.color, fontFamily: 'DMSans_700Bold' }]}>{currentTier.name}</Text>
          <Text style={[styles.tierMessage, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{currentTier.message}</Text>
        </View>

        <View style={styles.statsGrid}>
          {STATS.map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: c.surface }]}>
              <View style={[styles.statIconWrap, { backgroundColor: c.accentLight }]}>
                <Feather name={stat.icon as any} size={18} color={c.accent} />
              </View>
              <Text style={[styles.statValue, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>{stat.label}</Text>
              <Text style={[styles.statMessage, { color: c.green, fontFamily: 'DMSans_400Regular' }]}>{stat.message}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="shield" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Fair Ratings</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            We protect you from unfair reviews. Our system flags and excludes ratings that appear biased or unrelated to your service.
          </Text>
          <View style={styles.fairRatingsRow}>
            <View style={[styles.fairRatingItem, { backgroundColor: c.background }]}>
              <Text style={[styles.fairRatingNum, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>3</Text>
              <Text style={[styles.fairRatingLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Flagged reviews</Text>
            </View>
            <View style={[styles.fairRatingItem, { backgroundColor: c.background }]}>
              <Text style={[styles.fairRatingNum, { color: c.green, fontFamily: 'DMSans_700Bold' }]}>2</Text>
              <Text style={[styles.fairRatingLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Excluded from score</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Training & Compliance</Text>
          </View>
          <View style={styles.trainingRow}>
            <MaterialIcons name="local-bar" size={20} color={c.orange} />
            <View style={styles.trainingInfo}>
              <Text style={[styles.trainingLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Alcohol Delivery Certification</Text>
              <Text style={[styles.trainingStatus, { color: c.green, fontFamily: 'DMSans_400Regular' }]}>Completed</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={c.green} />
          </View>
          <View style={[styles.trainingRow, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Feather name="award" size={20} color={c.yellow} />
            <View style={styles.trainingInfo}>
              <Text style={[styles.trainingLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Food Safety Basics</Text>
              <Text style={[styles.trainingStatus, { color: c.green, fontFamily: 'DMSans_400Regular' }]}>Completed</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color={c.green} />
          </View>
          <View style={[styles.trainingRow, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Feather name="navigation" size={20} color={c.accent} />
            <View style={styles.trainingInfo}>
              <Text style={[styles.trainingLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Delivery Best Practices</Text>
              <Text style={[styles.trainingStatus, { color: c.yellow, fontFamily: 'DMSans_400Regular' }]}>Optional</Text>
            </View>
            <Feather name="arrow-right" size={18} color={c.textTertiary} />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="moon" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Quick Status</Text>
          </View>
          <View style={styles.breakRow}>
            <View style={styles.breakInfo}>
              <Text style={[styles.breakLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Set as On Break</Text>
              <Text style={[styles.breakDesc, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                Take all the time you need. No penalties, ever.
              </Text>
            </View>
            <Switch
              value={isOnBreak}
              onValueChange={handleBreakToggle}
              trackColor={{ false: c.border, true: c.accent }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="umbrella" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Insurance Status</Text>
          </View>
          <View style={styles.insuranceRow}>
            <View style={[styles.insuranceBadge, { backgroundColor: c.greenLight }]}>
              <Ionicons name="shield-checkmark" size={16} color={c.green} />
            </View>
            <View style={styles.insuranceInfo}>
              <Text style={[styles.insuranceLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Coverage Active</Text>
              <Text style={[styles.insuranceExpiry, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                Valid through Dec 31, 2026
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  tierCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  tierIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  tierLabel: { fontSize: 12 },
  tierName: { fontSize: 26 },
  tierMessage: { fontSize: 14 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%' as any,
    flexGrow: 1,
    flexBasis: '47%',
    borderRadius: 14,
    padding: 14,
    gap: 6,
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: { fontSize: 24 },
  statLabel: { fontSize: 12 },
  statMessage: { fontSize: 11 },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16 },
  sectionDesc: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  fairRatingsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  fairRatingItem: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  fairRatingNum: { fontSize: 22 },
  fairRatingLabel: { fontSize: 11, textAlign: 'center' },
  trainingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  trainingInfo: { flex: 1, gap: 2 },
  trainingLabel: { fontSize: 14 },
  trainingStatus: { fontSize: 12 },
  breakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  breakInfo: { flex: 1, gap: 4 },
  breakLabel: { fontSize: 14 },
  breakDesc: { fontSize: 12 },
  insuranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  insuranceBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insuranceInfo: { flex: 1, gap: 2 },
  insuranceLabel: { fontSize: 14 },
  insuranceExpiry: { fontSize: 12 },
});
