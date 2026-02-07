import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, TextInput, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useCart } from '@/lib/cart-context';

function StarRating({ rating, onRate, label }: { rating: number; onRate: (n: number) => void; label: string }) {
  const c = Colors.dark;
  return (
    <View style={styles.ratingSection}>
      <Text style={[styles.ratingLabel, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>{label}</Text>
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map(star => (
          <Pressable key={star} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRate(star); }} hitSlop={4}>
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={36}
              color={star <= rating ? c.yellow : c.textTertiary}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function ReviewScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const { orders, markOrderRated } = useCart();

  const order = orders.find(o => o.id === orderId);
  const [restaurantRating, setRestaurantRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const restaurantResponse = null;

  const handleSubmit = () => {
    if (restaurantRating === 0 || driverRating === 0) {
      Alert.alert('Rating Required', 'Please rate both the restaurant and driver.');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (orderId) markOrderRated(orderId);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 4 }]}>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Review</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.successContainer}>
          <Ionicons name="checkmark-circle" size={64} color={c.accent} />
          <Text style={[styles.successTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Thank you!</Text>
          <Text style={[styles.successSub, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            Your review has been submitted.
          </Text>
          <Pressable onPress={() => router.back()} style={[styles.doneBtn, { backgroundColor: c.accent }]}>
            <Feather name="check" size={20} color="#000" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>Leave a Review</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 34 : Math.max(insets.bottom, 20) }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {order && (
          <View style={[styles.orderInfo, { backgroundColor: c.surface }]}>
            <Text style={[styles.orderRestaurant, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
              {order.restaurantName}
            </Text>
            <Text style={[styles.orderDate, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
              Order #{orderId?.slice(0, 8)}
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <StarRating rating={restaurantRating} onRate={setRestaurantRating} label="Restaurant" />
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <StarRating rating={driverRating} onRate={setDriverRating} label={order?.driverName ?? 'Driver'} />
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <Text style={[styles.sectionLabel, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Comments</Text>
          <TextInput
            style={[styles.commentInput, { color: c.text, backgroundColor: c.background, fontFamily: 'DMSans_400Regular' }]}
            placeholder="Share your experience..."
            placeholderTextColor={c.textTertiary}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {restaurantResponse && (
          <View style={[styles.section, { backgroundColor: c.surface }]}>
            <View style={styles.responseHeader}>
              <Feather name="message-square" size={14} color={c.accent} />
              <Text style={[styles.sectionLabel, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Restaurant Response</Text>
            </View>
            <Text style={[styles.responseText, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
              {restaurantResponse}
            </Text>
          </View>
        )}

        <Pressable
          onPress={handleSubmit}
          style={({ pressed }) => [styles.submitBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather name="check" size={20} color="#000" />
          <Text style={[styles.submitText, { fontFamily: 'DMSans_700Bold' }]}>Submit Review</Text>
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
  headerTitle: { fontSize: 18 },
  scroll: { paddingHorizontal: 20, gap: 14 },
  orderInfo: {
    borderRadius: 14,
    padding: 16,
    gap: 4,
  },
  orderRestaurant: { fontSize: 16 },
  orderDate: { fontSize: 12 },
  section: {
    borderRadius: 14,
    padding: 16,
  },
  ratingSection: { gap: 12 },
  ratingLabel: { fontSize: 15 },
  starsRow: { flexDirection: 'row', gap: 8 },
  sectionLabel: { fontSize: 15, marginBottom: 10 },
  commentInput: {
    minHeight: 100,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  responseText: { fontSize: 14, lineHeight: 20 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
  },
  submitText: { fontSize: 16, color: '#000' },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  successTitle: { fontSize: 24 },
  successSub: { fontSize: 15 },
  doneBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
});
