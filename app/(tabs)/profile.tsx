import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Share, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { UserProfile } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';

const DEFAULT_PROFILE: UserProfile = {
  name: 'Guest',
  email: '',
  phone: '',
  tastePreferences: [],
  dietaryRestrictions: [],
  savedAddresses: [],
  idVerified: false,
};

const TASTE_OPTIONS = ['Sweet', 'Dry', 'Bold', 'Light', 'Fruity', 'Smoky', 'Spicy', 'Mellow'];
const DIETARY_OPTIONS = ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal', 'Kosher', 'Nut-free'];

const PAYMENT_METHODS = [
  { id: 'visa', icon: 'credit-card' as const, iconColor: '#00D4AA', title: 'Visa ending 4242', subtitle: 'Credit Card' },
  { id: 'cashapp', icon: 'dollar-sign' as const, iconColor: '#2ED573', title: 'Cash App', subtitle: '$CryptoEats' },
  { id: 'coinbase', icon: 'zap' as const, iconColor: '#FFD93D', title: 'Coinbase', subtitle: 'BTC, ETH, USDC' },
];

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
  const router = useRouter();
  const { user, customer, isAuthenticated, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [referralCode, setReferralCode] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('visa');

  useEffect(() => {
    if (customer) {
      const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(' ') || user?.email || 'User';
      setProfile(prev => ({
        ...prev,
        name: fullName,
        email: customer.email || user?.email || '',
        phone: customer.phone || '',
        idVerified: customer.idVerified || false,
      }));
    } else if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.email.split('@')[0],
        email: user.email,
      }));
    }
  }, [customer, user]);

  useEffect(() => {
    AsyncStorage.getItem('cryptoeats_profile_prefs').then(data => {
      if (data) {
        const prefs = JSON.parse(data);
        setProfile(prev => ({
          ...prev,
          tastePreferences: prefs.tastePreferences || prev.tastePreferences,
          dietaryRestrictions: prefs.dietaryRestrictions || prev.dietaryRestrictions,
          savedAddresses: prefs.savedAddresses || prev.savedAddresses,
        }));
      }
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
    AsyncStorage.getItem('cryptoeats_selected_payment').then(id => {
      if (id) setSelectedPayment(id);
    });
  }, []);

  const saveProfilePrefs = (updated: UserProfile) => {
    setProfile(updated);
    AsyncStorage.setItem('cryptoeats_profile_prefs', JSON.stringify({
      tastePreferences: updated.tastePreferences,
      dietaryRestrictions: updated.dietaryRestrictions,
      savedAddresses: updated.savedAddresses,
    }));
  };

  const toggleTaste = (taste: string) => {
    const prefs = profile.tastePreferences.includes(taste)
      ? profile.tastePreferences.filter(t => t !== taste)
      : [...profile.tastePreferences, taste];
    saveProfilePrefs({ ...profile, tastePreferences: prefs });
  };

  const toggleDietary = (diet: string) => {
    const restrictions = profile.dietaryRestrictions.includes(diet)
      ? profile.dietaryRestrictions.filter(d => d !== diet)
      : [...profile.dietaryRestrictions, diet];
    saveProfilePrefs({ ...profile, dietaryRestrictions: restrictions });
  };

  const handleSelectPayment = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPayment(id);
    AsyncStorage.setItem('cryptoeats_selected_payment', id);
    const method = PAYMENT_METHODS.find(m => m.id === id);
    if (method) {
      Alert.alert('Payment Updated', `${method.title} is now your default payment method.`);
    }
  };

  const handleShareReferral = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Use my CryptoEats referral code ${referralCode} to get $10 off your first order!`,
      });
    } catch {}
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/login');
            } catch {
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const displayName = profile.name || 'User';
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

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
              {initials}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{displayName}</Text>
            <Text style={[styles.profileEmail, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{profile.email}</Text>
            {profile.phone ? (
              <Text style={[styles.profilePhone, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{profile.phone}</Text>
            ) : null}
          </View>
          {profile.idVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: c.greenLight }]}>
              <Ionicons name="shield-checkmark" size={14} color={c.green} />
              <Text style={[styles.verifiedText, { color: c.green, fontFamily: 'DMSans_600SemiBold' }]}>ID Verified</Text>
            </View>
          )}
        </View>

        {isAuthenticated && (
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="log-out-outline" size={20} color={c.red} />
            <Text style={[styles.logoutText, { color: c.red, fontFamily: 'DMSans_600SemiBold' }]}>Log Out</Text>
          </Pressable>
        )}

        {!isAuthenticated && (
          <Pressable
            onPress={() => router.push('/login')}
            style={({ pressed }) => [styles.loginBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
          >
            <Ionicons name="log-in-outline" size={20} color="#000" />
            <Text style={[styles.loginText, { fontFamily: 'DMSans_600SemiBold' }]}>Sign In / Create Account</Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/driver'); }}
          style={({ pressed }) => [styles.driverCard, { backgroundColor: c.surface, borderColor: c.accent, borderWidth: 1, opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.driverIconWrap, { backgroundColor: c.accentLight }]}>
            <Ionicons name="car-outline" size={24} color={c.accent} />
          </View>
          <View style={styles.driverCardInfo}>
            <Text style={[styles.driverCardTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Switch to Driver Mode</Text>
            <Text style={[styles.driverCardDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Manage deliveries, earnings & more</Text>
          </View>
          <Feather name="chevron-right" size={20} color={c.accent} />
        </Pressable>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="briefcase" size={18} color={c.orange} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Join CryptoEats</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/onboarding/merchant'); }}
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
          >
            <View style={[styles.web3Icon, { backgroundColor: c.orangeLight }]}>
              <Ionicons name="restaurant-outline" size={18} color={c.orange} />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Become a Partner Restaurant</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>List your restaurant on CryptoEats</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/onboarding/driver'); }}
            style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: c.border }]}
          >
            <View style={[styles.web3Icon, { backgroundColor: c.accentLight }]}>
              <Feather name="truck" size={18} color={c.accent} />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Become a Delivery Driver</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Earn on your schedule with tips</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="diamond-outline" size={18} color="#7B61FF" />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Web3</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/wallet'); }}
            style={[styles.web3Row, { borderBottomColor: c.border }]}
          >
            <View style={[styles.web3Icon, { backgroundColor: '#0052FF22' }]}>
              <Ionicons name="wallet-outline" size={18} color="#0052FF" />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Wallet</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Connect wallet, view balances</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/nft-collection'); }}
            style={[styles.web3Row, { borderBottomColor: c.border }]}
          >
            <View style={[styles.web3Icon, { backgroundColor: '#FFD70022' }]}>
              <Ionicons name="trophy-outline" size={18} color="#FFD700" />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>NFT Rewards</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Milestones & achievements</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/marketplace'); }}
            style={[styles.web3Row, { borderBottomColor: c.border }]}
          >
            <View style={[styles.web3Icon, { backgroundColor: c.accentLight }]}>
              <Ionicons name="storefront-outline" size={18} color={c.accent} />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Marketplace</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Trade & collect NFTs</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/generate-nft' as any); }}
            style={[styles.web3Row, { borderBottomColor: c.border }]}
          >
            <View style={[styles.web3Icon, { backgroundColor: '#7B61FF22' }]}>
              <MaterialCommunityIcons name="creation" size={18} color="#7B61FF" />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>AI NFT Studio</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Create unique AI-generated NFT artwork</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/buy-crypto'); }}
            style={[styles.web3Row, { borderBottomColor: c.border }]}
          >
            <View style={[styles.web3Icon, { backgroundColor: '#0052FF22' }]}>
              <Ionicons name="add-circle-outline" size={18} color="#0052FF" />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Buy Crypto</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Coinbase Onramp - cards, Apple Pay</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/cash-out'); }}
            style={styles.web3Row}
          >
            <View style={[styles.web3Icon, { backgroundColor: '#FF6B3522' }]}>
              <MaterialCommunityIcons name="bank-transfer-out" size={18} color="#FF6B35" />
            </View>
            <View style={styles.web3Info}>
              <Text style={[styles.web3Label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Cash Out</Text>
              <Text style={[styles.web3Sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Coinbase Offramp - crypto to bank</Text>
            </View>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
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

        {profile.savedAddresses.length > 0 && (
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
        )}

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
          {PAYMENT_METHODS.map((method, i) => {
            const isSelected = selectedPayment === method.id;
            return (
              <Pressable
                key={method.id}
                onPress={() => handleSelectPayment(method.id)}
                style={[
                  styles.paymentItem,
                  i > 0 && { borderTopWidth: 1, borderTopColor: c.border },
                  isSelected && { backgroundColor: c.accentSoft, borderRadius: 12, marginHorizontal: -8, paddingHorizontal: 8 },
                ]}
              >
                <Feather name={method.icon} size={18} color={method.iconColor} />
                <View style={styles.paymentInfo}>
                  <Text style={[styles.paymentLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{method.title}</Text>
                  <Text style={[styles.paymentSub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                    {isSelected ? 'Default' : method.subtitle}
                  </Text>
                </View>
                {isSelected && <Ionicons name="checkmark-circle" size={20} color={c.accent} />}
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Pressable onPress={() => router.push('/help-support')} style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.menuItemText, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Help & Support</Text>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable onPress={() => router.push('/legal-privacy')} style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: c.border }]}>
            <Ionicons name="document-text-outline" size={20} color={c.textSecondary} />
            <Text style={[styles.menuItemText, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Legal & Privacy</Text>
            <Feather name="chevron-right" size={18} color={c.textTertiary} />
          </Pressable>
          <Pressable onPress={() => router.push('/notification-settings')} style={[styles.menuItem, { borderTopWidth: 1, borderTopColor: c.border }]}>
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
  logoutBtn: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FF475733',
  },
  logoutText: { fontSize: 15 },
  loginBtn: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginText: { fontSize: 15, color: '#000' },
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
  driverCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  driverIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverCardInfo: { flex: 1, gap: 2 },
  driverCardTitle: { fontSize: 16 },
  driverCardDesc: { fontSize: 12 },
  web3Row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  web3Icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  web3Info: { flex: 1 },
  web3Label: { fontSize: 15 },
  web3Sub: { fontSize: 12, marginTop: 1 },
});
