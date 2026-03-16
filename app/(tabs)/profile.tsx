import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, Share, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/colors';
import { UserProfile } from '@/lib/data';
import { useAuth } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/query-client';

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
  { id: 'visa', icon: 'credit-card' as const, iconColor: '#00D4AA', bg: '#00D4AA22', title: 'Visa ending 4242', subtitle: 'Credit Card' },
  { id: 'cashapp', icon: 'dollar-sign' as const, iconColor: '#2ED573', bg: '#2ED57322', title: 'Cash App', subtitle: '$CryptoEats' },
  { id: 'coinbase', icon: 'zap' as const, iconColor: '#FFD93D', bg: '#FFD93D22', title: 'Coinbase', subtitle: 'BTC, ETH, USDC' },
];

function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function SectionLabel({ icon, label, color = '#00D4AA' }: { icon: any; label: string; color?: string }) {
  const c = Colors.dark;
  return (
    <View style={sectionStyles.header}>
      <View style={[sectionStyles.iconWrap, { backgroundColor: color + '22' }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[sectionStyles.label, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>{label}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8 },
});

function Row({
  iconBg, iconColor, icon, label, sublabel, onPress, chevron = true, isLast = false, rightEl,
}: {
  iconBg: string; iconColor: string; icon: any; label: string; sublabel?: string;
  onPress?: () => void; chevron?: boolean; isLast?: boolean; rightEl?: React.ReactNode;
}) {
  const c = Colors.dark;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        rowStyles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: c.border },
        { opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <View style={[rowStyles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={17} color={iconColor} />
      </View>
      <View style={rowStyles.info}>
        <Text style={[rowStyles.label, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{label}</Text>
        {sublabel ? <Text style={[rowStyles.sub, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{sublabel}</Text> : null}
      </View>
      {rightEl ?? (chevron && <Feather name="chevron-right" size={17} color={c.textTertiary} />)}
    </Pressable>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  label: { fontSize: 15 },
  sub: { fontSize: 12, marginTop: 1 },
});

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
      setProfile(prev => ({ ...prev, name: user.email.split('@')[0], email: user.email }));
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
      const c = code || generateReferralCode();
      setReferralCode(c);
      if (!code) AsyncStorage.setItem('cryptoeats_referral', c);
    });
    AsyncStorage.getItem('cryptoeats_selected_payment').then(id => { if (id) setSelectedPayment(id); });
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
    if (method) Alert.alert('Payment Updated', `${method.title} is now your default payment method.`);
  };

  const handleShareReferral = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try { await Share.share({ message: `Use my CryptoEats referral code ${referralCode} to get $10 off your first order!` }); } catch {}
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          try { await logout(); router.replace('/login'); }
          catch { Alert.alert('Error', 'Failed to log out. Please try again.'); }
        },
      },
    ]);
  };

  const displayName = profile.name || 'User';
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: isWeb ? 90 : 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <LinearGradient
          colors={['#0D1F1C', '#0A0A0F']}
          style={[styles.hero, { paddingTop: topPad + 16 }]}
        >
          <View style={styles.heroTop}>
            <Text style={[styles.pageTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Profile</Text>
            <Pressable style={[styles.settingsBtn, { backgroundColor: c.surfaceElevated }]}>
              <Feather name="settings" size={18} color={c.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.heroBody}>
            <View style={[styles.avatarRing, { borderColor: c.accent + '55' }]}>
              <LinearGradient
                colors={['#00D4AA', '#00A67E']}
                style={styles.avatar}
              >
                <Text style={[styles.avatarText, { fontFamily: 'DMSans_700Bold' }]}>{initials}</Text>
              </LinearGradient>
            </View>
            <View style={styles.heroInfo}>
              <View style={styles.nameRow}>
                <Text style={[styles.displayName, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{displayName}</Text>
                {profile.idVerified && (
                  <View style={[styles.verifiedBadge, { backgroundColor: '#2ED57322' }]}>
                    <Ionicons name="shield-checkmark" size={12} color="#2ED573" />
                    <Text style={[styles.verifiedText, { color: '#2ED573', fontFamily: 'DMSans_600SemiBold' }]}>ID Verified</Text>
                  </View>
                )}
              </View>
              {profile.email ? (
                <Text style={[styles.heroEmail, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{profile.email}</Text>
              ) : null}
              {profile.phone ? (
                <Text style={[styles.heroPhone, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{profile.phone}</Text>
              ) : null}
            </View>
          </View>

          {/* Stats row */}
          <View style={[styles.statsRow, { backgroundColor: c.surfaceElevated }]}>
            {[
              { label: 'Orders', value: '0', icon: 'receipt-outline' as const, color: c.accent },
              { label: 'NFT Rewards', value: '0', icon: 'diamond-outline' as const, color: '#7B61FF' },
              { label: 'Referrals', value: '0', icon: 'people-outline' as const, color: c.orange },
            ].map((stat, i) => (
              <React.Fragment key={stat.label}>
                {i > 0 && <View style={[styles.statDivider, { backgroundColor: c.border }]} />}
                <View style={styles.stat}>
                  <Ionicons name={stat.icon} size={18} color={stat.color} style={{ marginBottom: 4 }} />
                  <Text style={[styles.statValue, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{stat.value}</Text>
                  <Text style={[styles.statLabel, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{stat.label}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Auth buttons */}
          {!isAuthenticated ? (
            <Pressable
              onPress={() => router.push('/login')}
              style={({ pressed }) => [styles.authBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="log-in-outline" size={20} color="#000" />
              <Text style={[styles.authBtnText, { color: '#000', fontFamily: 'DMSans_700Bold' }]}>Sign In / Create Account</Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={handleLogout}
              style={({ pressed }) => [styles.authBtn, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.red + '44', opacity: pressed ? 0.85 : 1 }]}
            >
              <Ionicons name="log-out-outline" size={20} color={c.red} />
              <Text style={[styles.authBtnText, { color: c.red, fontFamily: 'DMSans_600SemiBold' }]}>Log Out</Text>
            </Pressable>
          )}

          {/* Driver CTA */}
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/driver'); }}
            style={({ pressed }) => [styles.driverCta, { opacity: pressed ? 0.88 : 1 }]}
          >
            <LinearGradient colors={['#00D4AA22', '#00D4AA08']} style={styles.driverCtaGradient}>
              <View style={[styles.driverCtaIcon, { backgroundColor: c.accentLight }]}>
                <Ionicons name="car-sport-outline" size={22} color={c.accent} />
              </View>
              <View style={styles.driverCtaInfo}>
                <Text style={[styles.driverCtaTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Switch to Driver Mode</Text>
                <Text style={[styles.driverCtaSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Manage deliveries, earnings & tips</Text>
              </View>
              <Feather name="chevron-right" size={20} color={c.accent} />
            </LinearGradient>
          </Pressable>

          {/* Management */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="grid-outline" label="Management" color="#7B61FF" />
            <Row
              iconBg="#FF6B3522" iconColor="#FF6B35" icon="stats-chart-outline"
              label="Admin Dashboard" sublabel="Orders, drivers, compliance & KPIs"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (Platform.OS === 'web') window.open('/admin', '_blank');
                else WebBrowser.openBrowserAsync(`${getApiUrl()}/admin`);
              }}
              rightEl={<Feather name="external-link" size={15} color="#5A5A6E" />}
            />
            <Row
              iconBg="#FF6B3522" iconColor={c.orange} icon="restaurant-outline"
              label="Merchant Dashboard" sublabel="Menu, orders, reviews & analytics"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (Platform.OS === 'web') window.open('/merchant', '_blank');
                else WebBrowser.openBrowserAsync(`${getApiUrl()}/merchant`);
              }}
              rightEl={<Feather name="external-link" size={15} color="#5A5A6E" />}
              isLast
            />
          </View>

          {/* Web3 */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="diamond-outline" label="Web3" color="#7B61FF" />
            <Row iconBg="#0052FF22" iconColor="#0052FF" icon="wallet-outline" label="Wallet" sublabel="Connect wallet, view balances" onPress={() => router.push('/wallet')} />
            <Row iconBg="#FFD70022" iconColor="#FFD700" icon="trophy-outline" label="NFT Rewards" sublabel="Milestones & achievements" onPress={() => router.push('/nft-collection')} />
            <Row iconBg={c.accentLight} iconColor={c.accent} icon="storefront-outline" label="Marketplace" sublabel="Trade & collect NFTs" onPress={() => router.push('/marketplace')} />
            <Row iconBg="#7B61FF22" iconColor="#7B61FF" icon="color-wand-outline" label="AI NFT Studio" sublabel="Create AI-generated artwork" onPress={() => router.push('/generate-nft' as any)} isLast />
          </View>

          {/* Crypto Finance Cards */}
          <View style={styles.cryptoFinanceRow}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/buy-crypto'); }}
              style={({ pressed }) => [styles.financeCard, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={['#0036CC', '#0052FF', '#1A6AFF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.financeCardGradient}
              >
                <View style={styles.financeCardTop}>
                  <View style={[styles.financeCardIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  </View>
                  <View style={[styles.financeCardBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={[styles.financeCardBadgeText, { fontFamily: 'DMSans_600SemiBold' }]}>Coinbase</Text>
                  </View>
                </View>
                <Text style={[styles.financeCardTitle, { fontFamily: 'DMSans_700Bold' }]}>Buy Crypto</Text>
                <Text style={[styles.financeCardSub, { fontFamily: 'DMSans_400Regular' }]}>
                  Cards · Apple Pay · Google Pay
                </Text>
                <View style={styles.financeCardTokens}>
                  {['USDC', 'ETH', 'BTC'].map(token => (
                    <View key={token} style={[styles.financeTokenPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.financeTokenText, { fontFamily: 'DMSans_600SemiBold' }]}>{token}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/cash-out'); }}
              style={({ pressed }) => [styles.financeCard, { opacity: pressed ? 0.88 : 1 }]}
            >
              <LinearGradient
                colors={['#B83B00', '#FF6B35', '#FF8C5A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.financeCardGradient}
              >
                <View style={styles.financeCardTop}>
                  <View style={[styles.financeCardIconWrap, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
                  </View>
                  <View style={[styles.financeCardBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                    <Text style={[styles.financeCardBadgeText, { fontFamily: 'DMSans_600SemiBold' }]}>Offramp</Text>
                  </View>
                </View>
                <Text style={[styles.financeCardTitle, { fontFamily: 'DMSans_700Bold' }]}>Cash Out</Text>
                <Text style={[styles.financeCardSub, { fontFamily: 'DMSans_400Regular' }]}>
                  Crypto to bank account
                </Text>
                <View style={styles.financeCardTokens}>
                  {['Bank', 'ACH', 'Wire'].map(method => (
                    <View key={method} style={[styles.financeTokenPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                      <Text style={[styles.financeTokenText, { fontFamily: 'DMSans_600SemiBold' }]}>{method}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>
            </Pressable>
          </View>

          {/* Join CryptoEats */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="briefcase-outline" label="Join CryptoEats" color={c.orange} />
            <Row iconBg={c.orangeLight} iconColor={c.orange} icon="restaurant-outline" label="Become a Partner Restaurant" sublabel="List your restaurant on CryptoEats" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/onboarding/merchant'); }} />
            <Row iconBg={c.accentLight} iconColor={c.accent} icon="bicycle-outline" label="Become a Delivery Driver" sublabel="Earn on your schedule with tips" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/onboarding/driver'); }} isLast />
          </View>

          {/* Referral */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="gift-outline" label="Referral" color={c.accent} />
            <View style={styles.referralBody}>
              <View style={[styles.referralCodeBox, { backgroundColor: c.background, borderColor: c.accent + '44', borderWidth: 1 }]}>
                <Text style={[styles.referralCode, { color: c.accent, fontFamily: 'DMSans_700Bold' }]}>{referralCode}</Text>
              </View>
              <Pressable onPress={handleShareReferral} style={({ pressed }) => [styles.shareBtn, { backgroundColor: c.accent, opacity: pressed ? 0.8 : 1 }]}>
                <Feather name="share-2" size={17} color="#000" />
              </Pressable>
            </View>
            <Text style={[styles.referralHint, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              Share your code — both get $10 off
            </Text>
          </View>

          {/* Payment Methods */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="card-outline" label="Payment Methods" color={c.accent} />
            {PAYMENT_METHODS.map((method, i) => {
              const isSelected = selectedPayment === method.id;
              return (
                <Pressable
                  key={method.id}
                  onPress={() => handleSelectPayment(method.id)}
                  style={[
                    styles.paymentRow,
                    i < PAYMENT_METHODS.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                    isSelected && { backgroundColor: c.accentSoft, borderRadius: 12, marginHorizontal: -4, paddingHorizontal: 4 },
                  ]}
                >
                  <View style={[styles.paymentIcon, { backgroundColor: method.bg }]}>
                    <Feather name={method.icon} size={16} color={method.iconColor} />
                  </View>
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

          {/* ID Verification */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="shield-checkmark-outline" label="ID Verification" color={c.accent} />
            <View style={[styles.verifyStatus, { backgroundColor: profile.idVerified ? '#2ED57315' : '#FF475715', borderColor: profile.idVerified ? '#2ED57344' : '#FF475744' }]}>
              <View style={[styles.verifyDot, { backgroundColor: profile.idVerified ? '#2ED573' : '#FF4757' }]} />
              <Text style={[styles.verifyLabel, { color: profile.idVerified ? '#2ED573' : '#FF4757', fontFamily: 'DMSans_600SemiBold' }]}>
                {profile.idVerified ? 'Identity Verified' : 'Not Verified'}
              </Text>
              <Text style={[styles.verifyDesc, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                {profile.idVerified ? '· Alcohol delivery unlocked' : '· Required to order alcohol'}
              </Text>
            </View>
          </View>

          {/* Taste Preferences */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="heart-outline" label="Taste Preferences" color={c.accent} />
            <Text style={[styles.chipHint, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              Used by AI Sommelier for personalized picks
            </Text>
            <View style={styles.chipGrid}>
              {TASTE_OPTIONS.map(taste => {
                const active = profile.tastePreferences.includes(taste);
                return (
                  <Pressable
                    key={taste}
                    onPress={() => toggleTaste(taste)}
                    style={[styles.chip, active ? { backgroundColor: c.accent } : { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border }]}
                  >
                    <Text style={[styles.chipText, { color: active ? '#000' : c.textSecondary, fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular' }]}>
                      {taste}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Dietary */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="leaf-outline" label="Dietary Restrictions" color={c.green} />
            <Text style={[styles.chipHint, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              Used for smart substitutions and filtering
            </Text>
            <View style={styles.chipGrid}>
              {DIETARY_OPTIONS.map(diet => {
                const active = profile.dietaryRestrictions.includes(diet);
                return (
                  <Pressable
                    key={diet}
                    onPress={() => toggleDietary(diet)}
                    style={[styles.chip, active ? { backgroundColor: c.orange } : { backgroundColor: c.surfaceElevated, borderWidth: 1, borderColor: c.border }]}
                  >
                    <Text style={[styles.chipText, { color: active ? '#fff' : c.textSecondary, fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular' }]}>
                      {diet}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Settings */}
          <View style={[styles.card, { backgroundColor: c.surface }]}>
            <SectionLabel icon="settings-outline" label="Settings" color={c.textSecondary} />
            <Row iconBg={c.surfaceElevated} iconColor={c.textSecondary} icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/help-support')} />
            <Row iconBg={c.surfaceElevated} iconColor={c.textSecondary} icon="document-text-outline" label="Legal & Privacy" onPress={() => router.push('/legal-privacy')} />
            <Row iconBg={c.surfaceElevated} iconColor={c.textSecondary} icon="notifications-outline" label="Notifications" onPress={() => router.push('/notification-settings')} isLast />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  hero: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  pageTitle: { fontSize: 28 },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  heroBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    padding: 3,
  },
  avatar: {
    flex: 1,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 22, color: '#000' },
  heroInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  displayName: { fontSize: 20 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedText: { fontSize: 10 },
  heroEmail: { fontSize: 13 },
  heroPhone: { fontSize: 12 },

  statsRow: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
  },
  stat: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, marginVertical: 4 },
  statValue: { fontSize: 18 },
  statLabel: { fontSize: 11, marginTop: 1 },

  content: { padding: 16, gap: 12 },

  authBtn: {
    borderRadius: 14,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
  },
  authBtnText: { fontSize: 15 },

  driverCta: { borderRadius: 16, overflow: 'hidden' },
  driverCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#00D4AA33',
    borderRadius: 16,
  },
  driverCtaIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverCtaInfo: { flex: 1, gap: 2 },
  driverCtaTitle: { fontSize: 15 },
  driverCtaSub: { fontSize: 12 },

  card: {
    borderRadius: 18,
    padding: 16,
  },

  referralBody: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  referralCodeBox: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  referralCode: { fontSize: 20, letterSpacing: 4 },
  shareBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralHint: { fontSize: 12 },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentLabel: { fontSize: 14 },
  paymentSub: { fontSize: 12, marginTop: 1 },

  verifyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexWrap: 'wrap',
  },
  verifyDot: { width: 8, height: 8, borderRadius: 4 },
  verifyLabel: { fontSize: 14 },
  verifyDesc: { fontSize: 12 },

  chipHint: { fontSize: 12, marginBottom: 12 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: { fontSize: 13 },

  cryptoFinanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  financeCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  financeCardGradient: {
    padding: 18,
    gap: 8,
    minHeight: 160,
  },
  financeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  financeCardIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  financeCardBadge: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  financeCardBadgeText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
  financeCardTitle: {
    fontSize: 18,
    color: '#fff',
  },
  financeCardSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 15,
  },
  financeCardTokens: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  financeTokenPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  financeTokenText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.9)',
  },
});
