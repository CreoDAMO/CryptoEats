import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable } from 'react-native';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';

const STORAGE_KEY = 'cryptoeats_notification_prefs';

interface NotificationPrefs {
  orderUpdates: boolean;
  promotionalOffers: boolean;
  driverUpdates: boolean;
  nftRewards: boolean;
  securityAlerts: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  orderUpdates: true,
  promotionalOffers: true,
  driverUpdates: true,
  nftRewards: true,
  securityAlerts: true,
};

const NOTIFICATION_ITEMS: {
  key: keyof NotificationPrefs;
  title: string;
  subtitle: string;
  icon: string;
  iconType: 'ionicons' | 'feather';
  color: string;
  bgColor: string;
  locked?: boolean;
}[] = [
  {
    key: 'orderUpdates',
    title: 'Order Updates',
    subtitle: 'Status changes and delivery progress',
    icon: 'receipt-outline',
    iconType: 'ionicons',
    color: '#00D4AA',
    bgColor: '#00D4AA22',
  },
  {
    key: 'promotionalOffers',
    title: 'Promotions & Deals',
    subtitle: 'Discounts and special offers from restaurants',
    icon: 'tag',
    iconType: 'feather',
    color: '#FF6B35',
    bgColor: '#FF6B3522',
  },
  {
    key: 'driverUpdates',
    title: 'Driver Updates',
    subtitle: 'Real-time updates from your delivery driver',
    icon: 'car-outline',
    iconType: 'ionicons',
    color: '#0052FF',
    bgColor: '#0052FF22',
  },
  {
    key: 'nftRewards',
    title: 'NFT & Rewards',
    subtitle: 'Milestone achievements and new NFT rewards',
    icon: 'trophy-outline',
    iconType: 'ionicons',
    color: '#FFD700',
    bgColor: '#FFD70022',
  },
  {
    key: 'securityAlerts',
    title: 'Security Alerts',
    subtitle: 'Always enabled to keep your account safe',
    icon: 'shield-checkmark-outline',
    iconType: 'ionicons',
    color: '#FF4757',
    bgColor: '#FF475722',
    locked: true,
  },
];

export default function NotificationSettingsScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) {
        const saved = JSON.parse(data) as Partial<NotificationPrefs>;
        setPrefs({ ...DEFAULT_PREFS, ...saved, securityAlerts: true });
      }
    });
  }, []);

  const togglePref = useCallback((key: keyof NotificationPrefs) => {
    setPrefs(prev => {
      const updated = { ...prev, [key]: !prev[key] };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const enabledCount = Object.values(prefs).filter(Boolean).length;

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 40 : Math.max(insets.bottom, 20) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#00D4AA18', '#0052FF10', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={[styles.heroIcon, { backgroundColor: c.accentLight }]}>
            <Ionicons name="notifications-outline" size={26} color={c.accent} />
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Stay in the loop</Text>
            <Text style={[styles.heroSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              {enabledCount} of {NOTIFICATION_ITEMS.length} notifications enabled
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          {NOTIFICATION_ITEMS.map((item, index) => (
            <View key={item.key}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
              <View style={styles.row}>
                <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
                  {item.iconType === 'ionicons' ? (
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  ) : (
                    <Feather name={item.icon as any} size={20} color={item.color} />
                  )}
                </View>
                <View style={styles.textWrap}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.title, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{item.title}</Text>
                    {item.locked && (
                      <View style={[styles.lockedBadge, { backgroundColor: '#FF475722' }]}>
                        <Ionicons name="lock-closed" size={10} color="#FF4757" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.subtitle, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={() => { if (!item.locked) togglePref(item.key); }}
                  disabled={item.locked}
                  trackColor={{ false: c.surfaceElevated, true: item.color }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={c.surfaceElevated}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Feather name="info" size={15} color={c.textTertiary} />
          <Text style={[styles.infoText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            Notification preferences are saved locally on your device. Push notifications require app permissions.
          </Text>
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
    paddingBottom: 16,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 18 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  heroBanner: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: '#00D4AA20',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  heroTitle: { fontSize: 18 },
  heroSub: { fontSize: 13 },
  section: { borderRadius: 16, padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15 },
  lockedBadge: {
    width: 18,
    height: 18,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: { fontSize: 12, lineHeight: 17 },
  divider: { height: 1 },
  infoCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
