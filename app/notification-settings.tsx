import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
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
    subtitle: 'Get notified about order status changes and delivery progress',
    icon: 'receipt-outline',
    iconType: 'ionicons',
    color: '#00D4AA',
    bgColor: '#00D4AA22',
  },
  {
    key: 'promotionalOffers',
    title: 'Promotional Offers',
    subtitle: 'Deals, discounts, and special offers from restaurants',
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
    subtitle: 'Milestone achievements and new NFT reward notifications',
    icon: 'trophy-outline',
    iconType: 'ionicons',
    color: '#FFD700',
    bgColor: '#FFD70022',
  },
  {
    key: 'securityAlerts',
    title: 'Security Alerts',
    subtitle: 'Important security notifications — always enabled for your safety',
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

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerBackTitle: 'Back',
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.text,
          headerTitleStyle: { fontFamily: 'DMSans_600SemiBold', fontSize: 17 },
        }}
      />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
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
                  <Text style={[styles.title, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{item.title}</Text>
                  <Text style={[styles.subtitle, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{item.subtitle}</Text>
                </View>
                <Switch
                  value={prefs[item.key]}
                  onValueChange={(_value: boolean) => { if (!item.locked) togglePref(item.key); }}
                  disabled={item.locked}
                  trackColor={{ false: c.surfaceElevated, true: c.accent }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={c.surfaceElevated}
                />
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
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  section: {
    borderRadius: 16,
    padding: 16,
  },
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
  textWrap: { flex: 1 },
  title: { fontSize: 15 },
  subtitle: { fontSize: 12, marginTop: 3, lineHeight: 17 },
  divider: { height: 1 },
});
