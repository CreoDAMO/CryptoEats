import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Pressable, Platform,
  ActivityIndicator, TextInput, Alert, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import Colors from '@/constants/colors';
import { apiRequest, getApiUrl } from '@/lib/query-client';

type NftCategory = 'merchant_dish' | 'driver_avatar' | 'customer_loyalty' | 'marketplace_art';

interface CategoryOption {
  id: NftCategory;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  gradient: string;
}

const CATEGORIES: CategoryOption[] = [
  {
    id: 'merchant_dish',
    title: 'Signature Dish',
    subtitle: 'Turn your best dish into collectible art',
    icon: 'restaurant-outline',
    color: '#FF6B35',
    gradient: '#FF8C5A',
  },
  {
    id: 'driver_avatar',
    title: 'Driver Avatar',
    subtitle: 'Create a unique delivery persona NFT',
    icon: 'bicycle-outline',
    color: '#00D4AA',
    gradient: '#00F0C0',
  },
  {
    id: 'customer_loyalty',
    title: 'Loyalty Reward',
    subtitle: 'Earn exclusive achievement collectibles',
    icon: 'trophy-outline',
    color: '#7B61FF',
    gradient: '#9B85FF',
  },
  {
    id: 'marketplace_art',
    title: 'Marketplace Art',
    subtitle: 'Generate unique art for the NFT market',
    icon: 'color-palette-outline',
    color: '#00BFFF',
    gradient: '#40D4FF',
  },
];

const STYLE_PRESETS = [
  { id: 'default', name: 'Default', color: '#00D4AA' },
  { id: 'cyberpunk', name: 'Cyberpunk', color: '#FF00FF' },
  { id: 'watercolor', name: 'Watercolor', color: '#87CEEB' },
  { id: 'pixel-art', name: 'Pixel Art', color: '#00FF00' },
  { id: 'pop-art', name: 'Pop Art', color: '#FF4444' },
  { id: '3d-render', name: '3D Render', color: '#FFD700' },
  { id: 'anime', name: 'Anime', color: '#FF69B4' },
  { id: 'minimalist', name: 'Minimal', color: '#FFFFFF' },
];

type Step = 'category' | 'details' | 'generating' | 'result';

export default function GenerateNftScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;

  const [step, setStep] = useState<Step>('category');
  const [category, setCategory] = useState<NftCategory | null>(null);
  const [dishName, setDishName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [driverName, setDriverName] = useState('');
  const [nftName, setNftName] = useState('');
  const [nftDescription, setNftDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('default');
  const [generating, setGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedNft, setGeneratedNft] = useState<any>(null);

  const selectCategory = useCallback((cat: NftCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCategory(cat);
    setStep('details');
  }, []);

  const handleGenerate = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStep('generating');
    setGenerating(true);

    try {
      const baseUrl = getApiUrl();
      let endpoint = '/api/nft/generate-art';
      let body: any = {
        style: selectedStyle === 'default' ? undefined : selectedStyle,
      };

      switch (category) {
        case 'merchant_dish':
          endpoint = '/api/nft/merchant-dish';
          body = { ...body, dishName, cuisine: cuisine || undefined, restaurantName: restaurantName || undefined };
          break;
        case 'driver_avatar':
          endpoint = '/api/nft/driver-avatar';
          body = { ...body, driverName: driverName || undefined };
          break;
        case 'customer_loyalty':
          endpoint = '/api/nft/customer-loyalty';
          body = { ...body, name: nftName, description: nftDescription || undefined };
          break;
        case 'marketplace_art':
          body = { ...body, category: 'marketplace_art', name: nftName, description: nftDescription || undefined };
          break;
      }

      const res = await apiRequest('POST', endpoint, body);
      const data = await res.json();

      setGeneratedImage(data.imageUrl);
      setGeneratedNft(data.nft);
      setStep('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('[NFT Gen] Error:', err);
      Alert.alert('Generation Failed', err.message || 'Please try again');
      setStep('details');
    } finally {
      setGenerating(false);
    }
  }, [category, dishName, cuisine, restaurantName, driverName, nftName, nftDescription, selectedStyle]);

  const handleRegenerate = useCallback(async () => {
    if (!generatedNft?.id) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setStep('generating');
    setGenerating(true);

    try {
      const res = await apiRequest('POST', '/api/nft/regenerate-art', {
        nftId: generatedNft.id,
        style: selectedStyle === 'default' ? undefined : selectedStyle,
      });
      const data = await res.json();
      setGeneratedImage(data.imageUrl);
      setStep('result');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Alert.alert('Regeneration Failed', err.message || 'Please try again');
      setStep('result');
    } finally {
      setGenerating(false);
    }
  }, [generatedNft, selectedStyle]);

  const canGenerate = () => {
    switch (category) {
      case 'merchant_dish': return dishName.trim().length > 0;
      case 'driver_avatar': return true;
      case 'customer_loyalty': return nftName.trim().length > 0;
      case 'marketplace_art': return nftName.trim().length > 0;
      default: return false;
    }
  };

  const getFullImageUrl = (url: string) => {
    if (url.startsWith('http')) return url;
    if (url.startsWith('data:')) return url;
    const base = getApiUrl();
    return `${base}${url}`;
  };

  const selectedCat = CATEGORIES.find(c => c.id === category);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => {
          if (step === 'details') { setStep('category'); return; }
          if (step === 'result') { router.push('/nft-collection'); return; }
          router.back();
        }}>
          <Feather name={step === 'result' ? 'x' : 'arrow-left'} size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
          {step === 'category' ? 'Create AI NFT' : step === 'details' ? selectedCat?.title || 'Details' : step === 'generating' ? 'Generating...' : 'Your NFT'}
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 20) + 80 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'category' && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={[styles.heroBanner, { backgroundColor: c.surface }]}>
              <View style={[styles.heroIconWrap, { backgroundColor: '#7B61FF22' }]}>
                <MaterialCommunityIcons name="creation" size={36} color="#7B61FF" />
              </View>
              <Text style={[styles.heroTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                AI-Powered NFT Studio
              </Text>
              <Text style={[styles.heroDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                Create unique, AI-generated NFT artwork on the Base chain. Choose a category to get started.
              </Text>
            </View>

            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat, i) => (
                <Animated.View key={cat.id} entering={FadeInDown.delay(i * 80).duration(400)}>
                  <Pressable
                    onPress={() => selectCategory(cat.id)}
                    style={({ pressed }) => [
                      styles.categoryCard,
                      { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <View style={[styles.catIconWrap, { backgroundColor: cat.color + '18' }]}>
                      <Ionicons name={cat.icon as any} size={32} color={cat.color} />
                    </View>
                    <Text style={[styles.catTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>{cat.title}</Text>
                    <Text style={[styles.catSubtitle, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{cat.subtitle}</Text>
                    <View style={[styles.catArrow, { backgroundColor: cat.color + '18' }]}>
                      <Feather name="arrow-right" size={16} color={cat.color} />
                    </View>
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}

        {step === 'details' && selectedCat && (
          <Animated.View entering={FadeIn.duration(300)}>
            <View style={[styles.detailHeader, { backgroundColor: selectedCat.color + '12' }]}>
              <Ionicons name={selectedCat.icon as any} size={28} color={selectedCat.color} />
              <Text style={[styles.detailHeaderText, { color: selectedCat.color, fontFamily: 'DMSans_700Bold' }]}>
                {selectedCat.title}
              </Text>
            </View>

            {category === 'merchant_dish' && (
              <View style={styles.formSection}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>Dish Name *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: c.surface, color: c.text, fontFamily: 'DMSans_400Regular' }]}
                  value={dishName}
                  onChangeText={setDishName}
                  placeholder="e.g., Truffle Mushroom Risotto"
                  placeholderTextColor={c.textTertiary}
                />
                <Text style={[styles.fieldLabel, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>Cuisine Type</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: c.surface, color: c.text, fontFamily: 'DMSans_400Regular' }]}
                  value={cuisine}
                  onChangeText={setCuisine}
                  placeholder="e.g., Italian, Japanese, Cuban"
                  placeholderTextColor={c.textTertiary}
                />
                <Text style={[styles.fieldLabel, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>Restaurant Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: c.surface, color: c.text, fontFamily: 'DMSans_400Regular' }]}
                  value={restaurantName}
                  onChangeText={setRestaurantName}
                  placeholder="e.g., La Cucina"
                  placeholderTextColor={c.textTertiary}
                />
              </View>
            )}

            {category === 'driver_avatar' && (
              <View style={styles.formSection}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>Your Name (optional)</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: c.surface, color: c.text, fontFamily: 'DMSans_400Regular' }]}
                  value={driverName}
                  onChangeText={setDriverName}
                  placeholder="Your delivery persona name"
                  placeholderTextColor={c.textTertiary}
                />
                <View style={[styles.tipCard, { backgroundColor: c.surface }]}>
                  <Feather name="zap" size={16} color="#00D4AA" />
                  <Text style={[styles.tipText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                    Each avatar is completely unique - generated just for you with AI
                  </Text>
                </View>
              </View>
            )}

            {(category === 'customer_loyalty' || category === 'marketplace_art') && (
              <View style={styles.formSection}>
                <Text style={[styles.fieldLabel, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>NFT Name *</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: c.surface, color: c.text, fontFamily: 'DMSans_400Regular' }]}
                  value={nftName}
                  onChangeText={setNftName}
                  placeholder={category === 'customer_loyalty' ? "e.g., Foodie Champion" : "e.g., Miami Sunset Feast"}
                  placeholderTextColor={c.textTertiary}
                />
                <Text style={[styles.fieldLabel, { color: c.textSecondary, fontFamily: 'DMSans_600SemiBold' }]}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea, { backgroundColor: c.surface, color: c.text, fontFamily: 'DMSans_400Regular' }]}
                  value={nftDescription}
                  onChangeText={setNftDescription}
                  placeholder="Describe what makes this NFT special..."
                  placeholderTextColor={c.textTertiary}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Art Style</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.styleRow}>
              {STYLE_PRESETS.map(s => (
                <Pressable
                  key={s.id}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedStyle(s.id); }}
                  style={[
                    styles.styleChip,
                    {
                      backgroundColor: selectedStyle === s.id ? s.color + '30' : c.surface,
                      borderColor: selectedStyle === s.id ? s.color : 'transparent',
                      borderWidth: 1.5,
                    },
                  ]}
                >
                  <View style={[styles.styleDot, { backgroundColor: s.color }]} />
                  <Text style={[styles.styleChipText, { color: selectedStyle === s.id ? s.color : c.textSecondary, fontFamily: selectedStyle === s.id ? 'DMSans_700Bold' : 'DMSans_500Medium' }]}>
                    {s.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {step === 'generating' && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.generatingWrap}>
            <View style={[styles.generatingCard, { backgroundColor: c.surface }]}>
              <ActivityIndicator size="large" color={selectedCat?.color || c.accent} />
              <Text style={[styles.generatingTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                Creating Your NFT
              </Text>
              <Text style={[styles.generatingDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                AI is generating unique artwork just for you. This may take a moment...
              </Text>
              <View style={styles.generatingSteps}>
                {['Crafting prompt', 'Generating art', 'Saving to collection'].map((s, i) => (
                  <View key={i} style={styles.genStep}>
                    <View style={[styles.genStepDot, { backgroundColor: selectedCat?.color || c.accent }]} />
                    <Text style={[styles.genStepText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{s}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {step === 'result' && generatedImage && (
          <Animated.View entering={FadeInUp.duration(500)}>
            <View style={[styles.resultCard, { backgroundColor: c.surface }]}>
              <Image
                source={{ uri: getFullImageUrl(generatedImage) }}
                style={styles.resultImage}
                resizeMode="cover"
              />
              <View style={[styles.aiBadge, { backgroundColor: '#7B61FF' }]}>
                <MaterialCommunityIcons name="creation" size={14} color="#FFF" />
                <Text style={[styles.aiBadgeText, { fontFamily: 'DMSans_700Bold' }]}>AI Generated</Text>
              </View>
            </View>

            <View style={styles.resultInfo}>
              <Text style={[styles.resultName, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                {generatedNft?.name || 'NFT Created'}
              </Text>
              <Text style={[styles.resultDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                {generatedNft?.description || ''}
              </Text>

              <View style={styles.resultMeta}>
                <View style={[styles.metaChip, { backgroundColor: c.surface }]}>
                  <Ionicons name="layers-outline" size={14} color={c.accent} />
                  <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>Base Chain</Text>
                </View>
                <View style={[styles.metaChip, { backgroundColor: c.surface }]}>
                  <Ionicons name="sparkles-outline" size={14} color="#7B61FF" />
                  <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>
                    {selectedStyle === 'default' ? 'Default' : STYLE_PRESETS.find(s => s.id === selectedStyle)?.name} Style
                  </Text>
                </View>
                <View style={[styles.metaChip, { backgroundColor: c.surface }]}>
                  <Ionicons name="pricetag-outline" size={14} color={selectedCat?.color || c.accent} />
                  <Text style={[styles.metaText, { color: c.textSecondary, fontFamily: 'DMSans_500Medium' }]}>
                    {selectedCat?.title}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.resultActions}>
              <Pressable
                onPress={handleRegenerate}
                style={({ pressed }) => [styles.secondaryBtn, { backgroundColor: c.surface, opacity: pressed ? 0.85 : 1 }]}
              >
                <Feather name="refresh-cw" size={18} color={c.accent} />
                <Text style={[styles.secondaryBtnText, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>Regenerate</Text>
              </Pressable>
              <Pressable
                onPress={() => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); router.push('/nft-collection'); }}
                style={({ pressed }) => [styles.primaryBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
              >
                <Ionicons name="diamond-outline" size={18} color="#000" />
                <Text style={[styles.primaryBtnText, { fontFamily: 'DMSans_700Bold' }]}>View Collection</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => { setStep('category'); setGeneratedImage(null); setGeneratedNft(null); }}
              style={({ pressed }) => [styles.createAnotherBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Feather name="plus" size={16} color={c.accent} />
              <Text style={[styles.createAnotherText, { color: c.accent, fontFamily: 'DMSans_600SemiBold' }]}>Create Another NFT</Text>
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>

      {step === 'details' && (
        <View style={[styles.bottomBar, { backgroundColor: c.background, paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 16) }]}>
          <Pressable
            onPress={handleGenerate}
            disabled={!canGenerate() || generating}
            style={({ pressed }) => [
              styles.generateBtn,
              {
                backgroundColor: canGenerate() ? (selectedCat?.color || c.accent) : c.surfaceElevated,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <>
                <MaterialCommunityIcons name="creation" size={20} color={canGenerate() ? '#000' : c.textTertiary} />
                <Text style={[styles.generateBtnText, { color: canGenerate() ? '#000' : c.textTertiary, fontFamily: 'DMSans_700Bold' }]}>
                  Generate with AI
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
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
    paddingBottom: 12,
  },
  headerTitle: { fontSize: 18 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  heroBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  heroIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroTitle: { fontSize: 22, textAlign: 'center' },
  heroDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 },
  categoryGrid: { gap: 12 },
  categoryCard: {
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  catIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catTitle: { fontSize: 16 },
  catSubtitle: { fontSize: 12, flex: 1 },
  catArrow: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
  },
  detailHeaderText: { fontSize: 16 },
  formSection: { gap: 12 },
  fieldLabel: { fontSize: 13, marginTop: 4 },
  textInput: {
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    minHeight: 48,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tipCard: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 12,
    gap: 10,
    alignItems: 'center',
  },
  tipText: { fontSize: 13, flex: 1, lineHeight: 18 },
  sectionTitle: { fontSize: 16, marginTop: 4 },
  styleRow: { gap: 8, paddingRight: 20 },
  styleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  styleDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  styleChipText: { fontSize: 13 },
  generatingWrap: { paddingTop: 40 },
  generatingCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    gap: 16,
  },
  generatingTitle: { fontSize: 20, marginTop: 8 },
  generatingDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  generatingSteps: { gap: 10, marginTop: 8, alignSelf: 'stretch' },
  genStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  genStepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  genStepText: { fontSize: 13 },
  resultCard: {
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  resultImage: {
    width: '100%',
    aspectRatio: 1,
  },
  aiBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  aiBadgeText: { fontSize: 11, color: '#FFF' },
  resultInfo: { gap: 8, marginTop: 4 },
  resultName: { fontSize: 22 },
  resultDesc: { fontSize: 14, lineHeight: 20 },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  metaText: { fontSize: 12 },
  resultActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  secondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  secondaryBtnText: { fontSize: 15 },
  primaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  primaryBtnText: { fontSize: 15, color: '#000' },
  createAnotherBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  createAnotherText: { fontSize: 14 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  generateBtnText: { fontSize: 16 },
});
