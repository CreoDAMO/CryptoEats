import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

const FAQ_ITEMS = [
  {
    question: 'How do crypto payments work?',
    answer: 'We accept USDC on Base network. Connect your wallet or use Coinbase to buy crypto directly in the app.',
  },
  {
    question: 'Is alcohol delivery legal?',
    answer: 'Yes, in Florida with proper licensing. We comply with FL FS 561.57. All deliveries require ID verification.',
  },
  {
    question: 'How do NFT rewards work?',
    answer: 'Complete orders to earn milestone NFTs. These are minted on Base network and can be traded on our marketplace.',
  },
  {
    question: 'What areas do you deliver to?',
    answer: 'We currently serve Miami-Dade County during our pilot program.',
  },
  {
    question: 'How does escrow work?',
    answer: 'When you place an order, USDC is locked in a smart contract. It is only released to the restaurant once your delivery is confirmed.',
  },
];

export default function HelpSupportScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 40 : Math.max(insets.bottom, 20) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient
          colors={['#00D4AA18', '#7B61FF10', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroBanner}
        >
          <View style={[styles.heroIcon, { backgroundColor: c.accentLight }]}>
            <Ionicons name="headset-outline" size={28} color={c.accent} />
          </View>
          <Text style={[styles.heroTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>We're here to help</Text>
          <Text style={[styles.heroSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            Mon–Sun · 8AM–10PM EST
          </Text>
        </LinearGradient>

        <View style={styles.contactRow}>
          <Pressable
            onPress={() => Linking.openURL('mailto:support@cryptoeats.net')}
            style={({ pressed }) => [styles.contactCard, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: c.accentLight }]}>
              <Ionicons name="mail-outline" size={22} color={c.accent} />
            </View>
            <Text style={[styles.contactLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Email</Text>
            <Text style={[styles.contactValue, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>support@cryptoeats.net</Text>
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL('tel:3055553287')}
            style={({ pressed }) => [styles.contactCard, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: c.greenLight }]}>
              <Ionicons name="call-outline" size={22} color={c.green} />
            </View>
            <Text style={[styles.contactLabel, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Phone</Text>
            <Text style={[styles.contactValue, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>(305) 555-EATS</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.iconWrap, { backgroundColor: '#7B61FF22' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#7B61FF" />
            </View>
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Frequently Asked</Text>
          </View>
          {FAQ_ITEMS.map((item, index) => (
            <View key={index}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
              <Pressable onPress={() => toggleFaq(index)} style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>
                  {item.question}
                </Text>
                <Ionicons
                  name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={c.textTertiary}
                />
              </Pressable>
              {expandedIndex === index && (
                <Text style={[styles.faqAnswer, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                  {item.answer}
                </Text>
              )}
            </View>
          ))}
        </View>

        <Pressable
          onPress={() => Linking.openURL('mailto:support@cryptoeats.net')}
          style={({ pressed }) => [styles.ctaCard, { backgroundColor: c.surface, borderColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={22} color={c.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.ctaTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Still need help?</Text>
            <Text style={[styles.ctaSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>Send us a message and we'll respond within 24 hours.</Text>
          </View>
          <Feather name="chevron-right" size={18} color={c.textTertiary} />
        </Pressable>
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
    padding: 28,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#00D4AA20',
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, textAlign: 'center' },
  heroSub: { fontSize: 14, textAlign: 'center' },
  contactRow: { flexDirection: 'row', gap: 12 },
  contactCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: { fontSize: 12 },
  contactValue: { fontSize: 12, textAlign: 'center' },
  section: { borderRadius: 16, padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 16 },
  divider: { height: 1 },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  faqQuestion: { fontSize: 14, flex: 1 },
  faqAnswer: { fontSize: 13, lineHeight: 20, paddingBottom: 14, paddingRight: 30 },
  ctaCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
  },
  ctaTitle: { fontSize: 15 },
  ctaSub: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
