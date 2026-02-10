import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
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

  const openLegalPage = async (path: string) => {
    const baseUrl = getApiUrl();
    const url = new URL(path, baseUrl).toString();
    await WebBrowser.openBrowserAsync(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Legal & Privacy',
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
        {LEGAL_LINKS.map((item, index) => (
          <Pressable
            key={index}
            onPress={() => openLegalPage(item.path)}
            style={({ pressed }) => [styles.linkCard, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
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
        ))}

        <View style={[styles.disclaimerSection, { backgroundColor: c.surface }]}>
          <View style={styles.disclaimerHeader}>
            <View style={[styles.iconWrap, { backgroundColor: c.yellowLight }]}>
              <Ionicons name="warning-outline" size={22} color={c.yellow} />
            </View>
            <Text style={[styles.disclaimerTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Crypto Disclaimer</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            Cryptocurrency payments are subject to market volatility. The value of digital assets, including USDC and other cryptocurrencies, can fluctuate significantly. CryptoEats is not responsible for any losses resulting from cryptocurrency price changes between the time of order placement and payment confirmation.
          </Text>
          <Text style={[styles.disclaimerText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular', marginTop: 12 }]}>
            NFT rewards are digital collectibles minted on the Base network. While they may have perceived value, CryptoEats makes no guarantees regarding the future value or transferability of NFT rewards. All blockchain transactions are final and irreversible.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  linkCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkInfo: { flex: 1 },
  linkTitle: { fontSize: 15 },
  linkSub: { fontSize: 13, marginTop: 2 },
  disclaimerSection: {
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  disclaimerTitle: { fontSize: 15 },
  disclaimerText: { fontSize: 13, lineHeight: 20 },
});
