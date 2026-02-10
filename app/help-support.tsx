import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
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
];

export default function HelpSupportScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Help & Support',
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
        <Pressable
          onPress={() => Linking.openURL('mailto:support@cryptoeats.net')}
          style={({ pressed }) => [styles.contactCard, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: c.accentLight }]}>
            <Ionicons name="mail-outline" size={22} color={c.accent} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Contact Support</Text>
            <Text style={[styles.contactSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>support@cryptoeats.net</Text>
          </View>
          <Feather name="chevron-right" size={18} color={c.textTertiary} />
        </Pressable>

        <Pressable
          onPress={() => Linking.openURL('tel:3055553287')}
          style={({ pressed }) => [styles.contactCard, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: c.greenLight }]}>
            <Ionicons name="call-outline" size={22} color={c.green} />
          </View>
          <View style={styles.contactInfo}>
            <Text style={[styles.contactTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Call Us</Text>
            <Text style={[styles.contactSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>(305) 555-EATS</Text>
          </View>
          <Feather name="chevron-right" size={18} color={c.textTertiary} />
        </Pressable>

        <View style={[styles.hoursCard, { backgroundColor: c.surface }]}>
          <View style={styles.hoursHeader}>
            <View style={[styles.iconWrap, { backgroundColor: c.yellowLight }]}>
              <Ionicons name="time-outline" size={22} color={c.yellow} />
            </View>
            <Text style={[styles.hoursTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Operating Hours</Text>
          </View>
          <Text style={[styles.hoursText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            Mon-Sun 8AM - 10PM EST
          </Text>
        </View>

        <View style={[styles.faqSection, { backgroundColor: c.surface }]}>
          <View style={styles.faqHeader}>
            <View style={[styles.iconWrap, { backgroundColor: '#7B61FF22' }]}>
              <Ionicons name="help-circle-outline" size={22} color="#7B61FF" />
            </View>
            <Text style={[styles.faqTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>FAQs</Text>
          </View>
          {FAQ_ITEMS.map((item, index) => (
            <View key={index}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: c.border }]} />}
              <Pressable
                onPress={() => toggleFaq(index)}
                style={styles.faqItem}
              >
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  contactCard: {
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
  contactInfo: { flex: 1 },
  contactTitle: { fontSize: 15 },
  contactSub: { fontSize: 13, marginTop: 2 },
  hoursCard: {
    borderRadius: 16,
    padding: 16,
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 10,
  },
  hoursTitle: { fontSize: 15 },
  hoursText: { fontSize: 14, marginLeft: 58 },
  faqSection: {
    borderRadius: 16,
    padding: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  faqTitle: { fontSize: 15 },
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    gap: 12,
  },
  faqQuestion: { fontSize: 14, flex: 1 },
  faqAnswer: { fontSize: 13, lineHeight: 20, paddingBottom: 12, paddingRight: 30 },
  divider: { height: 1 },
});
