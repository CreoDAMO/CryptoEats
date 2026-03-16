import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import Colors from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';

const LEGAL_LINKS = [
  {
    title: 'Privacy Policy',
    subtitle: 'How we collect and use your data',
    path: '/legal/privacy',
    icon: 'shield-outline' as const,
    color: '#00D4AA',
    bgColor: '#00D4AA22',
  },
  {
    title: 'Terms of Service',
    subtitle: 'Rules and conditions of use',
    path: '/legal/tos',
    icon: 'document-text-outline' as const,
    color: '#0052FF',
    bgColor: '#0052FF22',
  },
  {
    title: 'Contractor Agreement',
    subtitle: 'Driver and merchant terms',
    path: '/legal/contractor',
    icon: 'briefcase-outline' as const,
    color: '#FF6B35',
    bgColor: '#FF6B3522',
  },
];

export default function LegalPrivacyScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const openLegalPage = async (path: string) => {
    const baseUrl = getApiUrl();
    const url = new URL(path, baseUrl).toString();
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Legal & Privacy</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 40 : Math.max(insets.bottom, 20) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#0052FF18', '#00D4AA10', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={[styles.heroIcon, { backgroundColor: '#0052FF22' }]}>
            <Ionicons name="shield-half-outline" size={26} color="#0052FF" />
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Your privacy matters</Text>
            <Text style={[styles.heroSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              Last updated March 2025 · v1.0
            </Text>
          </View>
        </LinearGradient>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          {LEGAL_LINKS.map((item, index) => (
            <View key={index}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
              <Pressable
                onPress={() => openLegalPage(item.path)}
                style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.8 : 1 }]}
              >
                <View style={[styles.iconWrap, { backgroundColor: item.bgColor }]}>
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>
                <View style={styles.linkInfo}>
                  <Text style={[styles.linkTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{item.title}</Text>
                  <Text style={[styles.linkSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{item.subtitle}</Text>
                </View>
                <Feather name="external-link" size={18} color={c.textTertiary} />
              </Pressable>
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconWrap, { backgroundColor: c.yellowLight }]}>
              <Ionicons name="warning-outline" size={22} color={c.yellow} />
            </View>
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Crypto Disclaimer</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            Cryptocurrency payments are subject to market volatility. The value of digital assets, including USDC and other cryptocurrencies, can fluctuate significantly. CryptoEats is not responsible for any losses resulting from cryptocurrency price changes between the time of order placement and payment confirmation.
          </Text>
          <View style={[styles.divider, { backgroundColor: c.border, marginVertical: 14 }]} />
          <Text style={[styles.disclaimerText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            NFT rewards are digital collectibles minted on the Base network. While they may have perceived value, CryptoEats makes no guarantees regarding the future value or transferability of NFT rewards. All blockchain transactions are final and irreversible.
          </Text>
        </View>

        <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Feather name="mail" size={15} color={c.textTertiary} />
          <Text style={[styles.infoText, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
            Questions about our policies? Email{' '}
            <Text style={{ color: c.accent }}>legal@cryptoeats.net</Text>
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
    borderColor: '#0052FF20',
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
  section: { borderRadius: 16, padding: 16, gap: 2 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16 },
  divider: { height: 1 },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInfo: { flex: 1, gap: 2 },
  linkTitle: { fontSize: 15 },
  linkSub: { fontSize: 13 },
  disclaimerText: { fontSize: 13, lineHeight: 20 },
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
