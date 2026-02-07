import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/colors';

const OCCASIONS = ['Dinner Party', 'Casual Night', 'Celebration', 'Date Night', 'Business Dinner'];
const TASTE_PREFS = ['Sweet', 'Dry', 'Bold', 'Light', 'Fruity', 'Smoky'];

interface Recommendation {
  name: string;
  type: string;
  description: string;
  pairing: string;
  confidence: number;
  price: string;
}

const SAMPLE_RECOMMENDATIONS: Recommendation[] = [
  {
    name: 'Chateau Margaux 2018',
    type: 'Red Wine',
    description: 'A full-bodied Bordeaux with notes of blackcurrant, cedar, and violet. Exceptional balance with silky tannins.',
    pairing: 'Perfect with grilled steak or aged cheese',
    confidence: 95,
    price: '$89.99',
  },
  {
    name: 'Cloudy Bay Sauvignon Blanc',
    type: 'White Wine',
    description: 'Crisp and refreshing with citrus, passionfruit, and herbaceous notes from Marlborough, New Zealand.',
    pairing: 'Excellent with seafood or light salads',
    confidence: 88,
    price: '$24.99',
  },
  {
    name: 'Veuve Clicquot Yellow Label',
    type: 'Champagne',
    description: 'Classic champagne with golden hue, fine bubbles, and flavors of apple, brioche, and toasted almond.',
    pairing: 'Ideal for celebrations and appetizers',
    confidence: 92,
    price: '$54.99',
  },
  {
    name: 'Hendricks Gin',
    type: 'Spirit',
    description: 'Distinctively infused with cucumber and rose petals, creating a wonderfully refreshing gin experience.',
    pairing: 'Best in a classic G&T with cucumber garnish',
    confidence: 85,
    price: '$34.99',
  },
];

function RecommendationCard({ rec, index }: { rec: Recommendation; index: number }) {
  const c = Colors.dark;
  const confidenceColor = rec.confidence >= 90 ? c.green : rec.confidence >= 80 ? c.yellow : c.orange;

  return (
    <Animated.View entering={FadeIn.delay(index * 150).duration(400)}>
      <View style={[styles.recCard, { backgroundColor: c.surface }]}>
        <View style={styles.recTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.recName, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{rec.name}</Text>
            <Text style={[styles.recType, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>{rec.type}</Text>
          </View>
          <View style={styles.recPriceContainer}>
            <Text style={[styles.recPrice, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{rec.price}</Text>
            <View style={[styles.confidenceBadge, { backgroundColor: confidenceColor + '22' }]}>
              <Text style={[styles.confidenceText, { color: confidenceColor, fontFamily: 'DMSans_600SemiBold' }]}>
                {rec.confidence}% match
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.recDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{rec.description}</Text>
        <View style={[styles.pairingRow, { backgroundColor: c.surfaceElevated }]}>
          <Ionicons name="restaurant-outline" size={14} color={c.accent} />
          <Text style={[styles.pairingText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{rec.pairing}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function SommelierScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const [selectedOccasion, setSelectedOccasion] = useState<string | null>(null);
  const [selectedTastes, setSelectedTastes] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleTaste = (taste: string) => {
    setSelectedTastes(prev =>
      prev.includes(taste) ? prev.filter(t => t !== taste) : [...prev, taste]
    );
  };

  const handleGetRecommendations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="x" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>AI Sommelier</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {!showResults ? (
          <>
            <View style={styles.intro}>
              <View style={[styles.iconCircle, { backgroundColor: c.accentLight }]}>
                <Ionicons name="wine" size={32} color={c.accent} />
              </View>
              <Text style={[styles.introTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                Personalized Recommendations
              </Text>
              <Text style={[styles.introDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                Tell us about the occasion and your taste preferences to get AI-powered wine and spirit suggestions.
              </Text>
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                What's the occasion?
              </Text>
              <View style={styles.chipGrid}>
                {OCCASIONS.map(occ => {
                  const active = selectedOccasion === occ;
                  return (
                    <Pressable
                      key={occ}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedOccasion(occ);
                      }}
                      style={[styles.chip, { backgroundColor: active ? c.accent : c.surfaceElevated }]}
                    >
                      <Text style={[styles.chipText, { color: active ? '#000' : c.textSecondary, fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular' }]}>
                        {occ}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={[styles.section, { backgroundColor: c.surface }]}>
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                Your taste preferences
              </Text>
              <View style={styles.chipGrid}>
                {TASTE_PREFS.map(taste => {
                  const active = selectedTastes.includes(taste);
                  return (
                    <Pressable
                      key={taste}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        toggleTaste(taste);
                      }}
                      style={[styles.chip, { backgroundColor: active ? c.orange : c.surfaceElevated }]}
                    >
                      <Text style={[styles.chipText, { color: active ? '#000' : c.textSecondary, fontFamily: active ? 'DMSans_600SemiBold' : 'DMSans_400Regular' }]}>
                        {taste}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <Pressable
              onPress={handleGetRecommendations}
              disabled={!selectedOccasion || selectedTastes.length === 0 || isLoading}
              style={({ pressed }) => [
                styles.getBtn,
                {
                  backgroundColor: (!selectedOccasion || selectedTastes.length === 0) ? c.surfaceElevated : c.accent,
                  opacity: pressed ? 0.85 : isLoading ? 0.7 : 1,
                },
              ]}
            >
              {isLoading ? (
                <Text style={[styles.getBtnText, { color: '#000', fontFamily: 'DMSans_700Bold' }]}>Analyzing preferences...</Text>
              ) : (
                <>
                  <Ionicons name="sparkles" size={18} color={(!selectedOccasion || selectedTastes.length === 0) ? c.textTertiary : '#000'} />
                  <Text style={[styles.getBtnText, { color: (!selectedOccasion || selectedTastes.length === 0) ? c.textTertiary : '#000', fontFamily: 'DMSans_700Bold' }]}>
                    Get Recommendations
                  </Text>
                </>
              )}
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.resultsHeader}>
              <Text style={[styles.resultsTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                Your Picks
              </Text>
              <Pressable
                onPress={() => {
                  setShowResults(false);
                  setSelectedOccasion(null);
                  setSelectedTastes([]);
                }}
              >
                <Text style={[styles.resetText, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>Start over</Text>
              </Pressable>
            </View>
            <View style={[styles.contextRow, { backgroundColor: c.surface }]}>
              <Feather name="info" size={14} color={c.accent} />
              <Text style={[styles.contextText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                Based on: {selectedOccasion} | {selectedTastes.join(', ')}
              </Text>
            </View>
            {SAMPLE_RECOMMENDATIONS.map((rec, i) => (
              <RecommendationCard key={rec.name} rec={rec} index={i} />
            ))}
          </>
        )}
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
  headerTitle: { fontSize: 18 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  intro: { alignItems: 'center', gap: 10, paddingVertical: 10 },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTitle: { fontSize: 22, textAlign: 'center' },
  introDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  section: { borderRadius: 16, padding: 16, gap: 12 },
  sectionTitle: { fontSize: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20 },
  chipText: { fontSize: 14 },
  getBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
  },
  getBtnText: { fontSize: 16 },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsTitle: { fontSize: 24 },
  resetText: { fontSize: 14 },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  contextText: { flex: 1, fontSize: 13 },
  recCard: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  recTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  recName: { fontSize: 17 },
  recType: { fontSize: 13, marginTop: 2 },
  recPriceContainer: { alignItems: 'flex-end', gap: 4 },
  recPrice: { fontSize: 17 },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  confidenceText: { fontSize: 11 },
  recDesc: { fontSize: 13, lineHeight: 19 },
  pairingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  pairingText: { flex: 1, fontSize: 13 },
});
