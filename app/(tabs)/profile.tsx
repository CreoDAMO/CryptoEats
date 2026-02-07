import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
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

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function ProfileScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [referralCode, setReferralCode] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('cryptoeats_profile').then(data => {
      if (data) setProfile(JSON.parse(data));
    });
    AsyncStorage.getItem('cryptoeats_referral').then(code => {
      if (code) {
        setReferralCode(code);
      } else {
        const newCode = generateReferralCode();
        setReferralCode(newCode);
        AsyncStorage.setItem('cryptoeats_referral', newCode);
      }
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

  const handleShareReferral = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Use my CryptoEats referral code ${referralCode} to get $10 off your first order!`,
      });
    } catch {}
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
          <View style={styles.sectionHeader}>
            <Ionicons name="shield-checkmark-outline" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>ID Verification</Text>
          </View>
          <View style={styles.verificationRow}>
            <View style={[styles.verificationDot, { backgroundColor: profile.idVerified ? c.green : c.red }]} />
            <Text style={[styles.verificationStatus, { color: profile.idVerified ? c.green : c.red, fontFamily: 'DMSans_500Medium' }]}>
              {profile.idVerified ? 'Verified' : 'Not Verified'}
            </Text>
          </View>
          <Text style={[styles.verificationDesc, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            {profile.idVerified ? 'Your identity has been verified for alcohol delivery.' : 'Verify your ID to order alcohol items.'}
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="gift" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Referral</Text>
          </View>
          <View style={styles.referralRow}>
            <View style={[styles.referralCodeBox, { backgroundColor: c.background }]}>
              <Text style={[styles.referralCode, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>{referralCode}</Text>
            </View>
            <Pressable onPress={handleShareReferral} style={({ pressed }) => [styles.shareBtn, { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 }]}>
              <Feather name="share-2" size={18} color="#000" />
            </Pressable>
          </View>
          <Text style={[styles.referralHint, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            Share your code and both get $10 off
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="heart-outline" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Favorites</Text>
          </View>
          <View style={styles.favoritesEmpty}>
            <Feather name="heart" size={28} color={c.textTertiary} />
            <Text style={[styles.favoritesEmptyText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              No favorites yet
            </Text>
          </View>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 16, marginBottom: 4 },
  sectionSubtitle: { fontSize: 12, marginBottom: 12 },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  verificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  verificationStatus: { fontSize: 14 },
  verificationDesc: { fontSize: 12 },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  referralCodeBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  referralCode: { fontSize: 20, letterSpacing: 3 },
  shareBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralHint: { fontSize: 12, marginTop: 8 },
  favoritesEmpty: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  favoritesEmptyText: { fontSize: 14 },
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
