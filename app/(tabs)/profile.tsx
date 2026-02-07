import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { UserProfile } from '@/lib/data';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Alex Rivera',
  email: 'alex@cryptoeats.io',
  phone: '+1 (305) 555-0123',
  tastePreferences: ['Bold', 'Dry'],
  dietaryRestrictions: [],
  savedAddresses: [
    { label: 'Home', address: '420 Ocean Dr, Miami Beach, FL 33139' },
    { label: 'Work', address: '1200 Brickell Ave, Miami, FL 33131' },
  ],
  idVerified: true,
};

const TASTE_OPTIONS = ['Sweet', 'Dry', 'Bold', 'Light', 'Fruity', 'Smoky', 'Spicy', 'Mellow'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Nut-free'];

export default function ProfileScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    AsyncStorage.getItem('cryptoeats_profile').then(data => {
      if (data) setProfile(JSON.parse(data));
    });
  }, []);

  const saveProfile = (updated: UserProfile) => {
    setProfile(updated);
    AsyncStorage.setItem('cryptoeats_profile', JSON.stringify(updated));
  };

  const toggleTaste = (taste: string) => {
    const prefs = profile.tastePreferences.includes(taste)
      ? profile.tastePreferences.filter(t => t !== taste)
      : [...profile.tastePreferences, taste];
    saveProfile({ ...profile, tastePreferences: prefs });
  };

  const toggleDietary = (diet: string) => {
    const restrictions = profile.dietaryRestrictions.includes(diet)
      ? profile.dietaryRestrictions.filter(d => d !== diet)
      : [...profile.dietaryRestrictions, diet];
    saveProfile({ ...profile, dietaryRestrictions: restrictions });
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: topPad + 8, paddingBottom: isWeb ? 84 : 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.pageTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Profile</Text>

        <View style={[styles.profileCard, { backgroundColor: c.surface }]}>
          <View style={[styles.avatar, { backgroundColor: c.accent }]}>
            <Text style={[styles.avatarText, { fontFamily: 'DMSans_700Bold' }]}>
              {profile.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{profile.name}</Text>
            <Text style={[styles.profileEmail, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{profile.email}</Text>
            <Text style={[styles.profilePhone, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{profile.phone}</Text>
          </View>
          {profile.idVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: c.greenLight }]}>
              <Ionicons name="shield-checkmark" size={14} color={c.green} />
              <Text style={[styles.verifiedText, { color: c.green, fontFamily: 'DMSans_600SemiBold' }]}>ID Verified</Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Saved Addresses</Text>
          {profile.savedAddresses.map((addr, i) => (
            <View key={i} style={[styles.addressRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}>
              <Ionicons
                name={addr.label === 'Home' ? 'home-outline' : 'briefcase-outline'}
                size={18}
                color={c.accent}
              />
              <View style={styles.addressInfo}>
                <Text style={[styles.addressLabel, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{addr.label}</Text>
                <Text style={[styles.addressText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{addr.address}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Taste Preferences</Text>
          <Text style={[styles.sectionSubtitle, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            Used by AI Sommelier for personalized recommendations
          </Text>
          <View style={styles.chipGrid}>
            {TASTE_OPTIONS.map(taste => {
              const active = profile.tastePreferences.includes(taste);
              return (
                <Pressable
                  key={taste}
                  onPress={() => toggleTaste(taste)}
                  style={[styles.chip, { backgroundColor: active ? c.accent : c.surfaceElevated }]}
                >
                  <Text style={[styles.chipText, { color: active ? '#000' : c.textSecondary, fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular' }]}>
                    {taste}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Dietary Restrictions</Text>
          <Text style={[styles.sectionSubtitle, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            Used for smart substitutions and filtering
          </Text>
          <View style={styles.chipGrid}>
            {DIETARY_OPTIONS.map(diet => {
              const active = profile.dietaryRestrictions.includes(diet);
              return (
                <Pressable
                  key={diet}
                  onPress={() => toggleDietary(diet)}
                  style={[styles.chip, { backgroundColor: active ? c.orange : c.surfaceElevated }]}
                >
                  <Text style={[styles.chipText, { color: active ? '#000' : c.textSecondary, fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular' }]}>
                    {diet}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Payment Methods</Text>
          <View style={styles.paymentItem}>
            <Feather name="credit-card" size={18} color={c.accent} />
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Visa ending 4242</Text>
              <Text style={[styles.paymentSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Default</Text>
            </View>
            <Ionicons name="checkmark-circle" size={20} color={c.accent} />
          </View>
          <View style={[styles.paymentItem, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Feather name="dollar-sign" size={18} color={c.green} />
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Cash App</Text>
              <Text style={[styles.paymentSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>$CryptoEats</Text>
            </View>
          </View>
          <View style={[styles.paymentItem, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Feather name="zap" size={18} color={c.yellow} />
            <View style={styles.paymentInfo}>
              <Text style={[styles.paymentLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Coinbase</Text>
              <Text style={[styles.paymentSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>BTC, ETH, USDC</Text>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Pressable style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.menuItemText, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Help & Support</Text>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Ionicons name="document-text-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.menuItemText, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Legal & Privacy</Text>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Ionicons name="notifications-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.menuItemText, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Notifications</Text>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  pageTitle: { fontSize: 28, marginBottom: 4 },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, color: '#000' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18 },
  profileEmail: { fontSize: 13, marginTop: 2 },
  profilePhone: { fontSize: 12, marginTop: 1 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  verifiedText: { fontSize: 11 },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionTitle: { fontSize: 16, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { fontSize: 13 },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  addressInfo: { flex: 1 },
  addressLabel: { fontSize: 14 },
  addressText: { fontSize: 12, marginTop: 1 },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 14 },
  paymentSub: { fontSize: 12, marginTop: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: { flex: 1, fontSize: 15 },
});
