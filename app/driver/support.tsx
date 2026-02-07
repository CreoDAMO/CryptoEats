import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Platform, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const APPEAL_REASONS = [
  'Unfair rating',
  'Navigation issue',
  'Customer was unavailable',
  'Restaurant delay',
  'App technical issue',
  'Other',
];

const APPEAL_HISTORY = [
  {
    id: '1',
    reason: 'Unfair rating',
    description: 'Customer gave 1 star but order was delivered on time and correctly.',
    status: 'resolved',
    date: 'Jan 15, 2026',
    outcome: 'Rating removed from score',
  },
];

const RESOURCES = [
  { icon: 'local-bar', label: 'Alcohol Delivery Training', desc: 'ID verification and compliance', color: '#FF6B35' },
  { icon: 'restaurant', label: 'Food Safety Guidelines', desc: 'Temperature and handling best practices', color: '#FFD93D' },
  { icon: 'directions-car', label: 'Safe Driving Tips', desc: 'Stay safe on the road', color: '#00D4AA' },
  { icon: 'people', label: 'Customer Interaction Guide', desc: 'Communication best practices', color: '#8F8FA3' },
];

export default function SupportScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const [appealReason, setAppealReason] = useState('');
  const [appealDesc, setAppealDesc] = useState('');
  const [showReasonPicker, setShowReasonPicker] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitAppeal = () => {
    if (!appealReason || !appealDesc.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setAppealReason('');
      setAppealDesc('');
    }, 3000);
  };

  const handleContactSupport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isWeb ? 84 : insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.wellnessCard, { backgroundColor: c.surface, borderColor: c.accent, borderWidth: 1 }]}>
          <View style={[styles.wellnessIcon, { backgroundColor: c.accentLight }]}>
            <Feather name="heart" size={24} color={c.accent} />
          </View>
          <Text style={[styles.wellnessTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>How are you feeling today?</Text>
          <Text style={[styles.wellnessDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
            Your wellbeing matters to us. If you're feeling overwhelmed or need a break, that's completely okay. Take care of yourself first.
          </Text>
          <View style={styles.wellnessActions}>
            <Pressable style={[styles.wellnessBtn, { backgroundColor: c.greenLight }]}>
              <Ionicons name="happy-outline" size={22} color={c.green} />
            </Pressable>
            <Pressable style={[styles.wellnessBtn, { backgroundColor: c.yellowLight }]}>
              <Ionicons name="sad-outline" size={22} color={c.yellow} />
            </Pressable>
            <Pressable style={[styles.wellnessBtn, { backgroundColor: c.redLight }]}>
              <Ionicons name="alert-circle-outline" size={22} color={c.red} />
            </Pressable>
          </View>
        </View>

        <Pressable
          onPress={handleContactSupport}
          style={({ pressed }) => [styles.contactBtn, { backgroundColor: c.accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather name="headphones" size={20} color="#000" />
          <Text style={[styles.contactBtnText, { fontFamily: 'DMSans_700Bold' }]}>Contact Support</Text>
        </Pressable>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="book-open" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Education Resources</Text>
          </View>
          {RESOURCES.map((res, i) => (
            <Pressable
              key={i}
              style={[styles.resourceRow, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}
            >
              <View style={[styles.resourceIcon, { backgroundColor: res.color + '22' }]}>
                <MaterialIcons name={res.icon as any} size={20} color={res.color} />
              </View>
              <View style={styles.resourceInfo}>
                <Text style={[styles.resourceLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{res.label}</Text>
                <Text style={[styles.resourceDesc, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{res.desc}</Text>
              </View>
              <Feather name="arrow-right" size={16} color={c.textTertiary} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="flag" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Submit an Appeal</Text>
          </View>

          {submitted ? (
            <View style={styles.submittedBanner}>
              <Ionicons name="checkmark-circle" size={24} color={c.green} />
              <Text style={[styles.submittedText, { color: c.green, fontFamily: 'DMSans_600SemiBold' }]}>
                Appeal submitted successfully!
              </Text>
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setShowReasonPicker(!showReasonPicker)}
                style={[styles.reasonSelector, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }]}
              >
                <Text style={[styles.reasonText, { color: appealReason ? c.text : c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>
                  {appealReason || 'Select a reason'}
                </Text>
                <Feather name={showReasonPicker ? 'chevron-up' : 'chevron-down'} size={18} color={c.textTertiary} />
              </Pressable>

              {showReasonPicker && (
                <View style={[styles.reasonDropdown, { backgroundColor: c.surfaceElevated, borderColor: c.border, borderWidth: 1 }]}>
                  {APPEAL_REASONS.map((reason, i) => (
                    <Pressable
                      key={i}
                      onPress={() => { setAppealReason(reason); setShowReasonPicker(false); }}
                      style={[styles.reasonOption, i > 0 && { borderTopWidth: 1, borderTopColor: c.border }]}
                    >
                      <Text style={[styles.reasonOptionText, {
                        color: appealReason === reason ? c.accent : c.text,
                        fontFamily: appealReason === reason ? 'DMSans_600SemiBold' : 'DMSans_400Regular',
                      }]}>
                        {reason}
                      </Text>
                      {appealReason === reason && <Ionicons name="checkmark" size={18} color={c.accent} />}
                    </Pressable>
                  ))}
                </View>
              )}

              <TextInput
                style={[styles.appealInput, {
                  backgroundColor: c.background,
                  color: c.text,
                  borderColor: c.border,
                  fontFamily: 'DMSans_400Regular',
                }]}
                placeholder="Describe the situation..."
                placeholderTextColor={c.textTertiary}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={appealDesc}
                onChangeText={setAppealDesc}
              />

              <Pressable
                onPress={handleSubmitAppeal}
                disabled={!appealReason || !appealDesc.trim()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  {
                    backgroundColor: appealReason && appealDesc.trim() ? c.accent : c.surfaceElevated,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Feather name="send" size={18} color={appealReason && appealDesc.trim() ? '#000' : c.textTertiary} />
                <Text style={[styles.submitBtnText, {
                  color: appealReason && appealDesc.trim() ? '#000' : c.textTertiary,
                  fontFamily: 'DMSans_600SemiBold',
                }]}>
                  Submit Appeal
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {APPEAL_HISTORY.length > 0 && (
          <View style={[styles.section, { backgroundColor: c.surface }]}>
            <View style={styles.sectionHeader}>
              <Feather name="clock" size={18} color={c.accent} />
              <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Appeal History</Text>
            </View>
            {APPEAL_HISTORY.map(appeal => (
              <View key={appeal.id} style={styles.appealItem}>
                <View style={styles.appealItemHeader}>
                  <Text style={[styles.appealItemReason, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>{appeal.reason}</Text>
                  <View style={[styles.appealStatusBadge, { backgroundColor: appeal.status === 'resolved' ? c.greenLight : c.yellowLight }]}>
                    <Text style={[styles.appealStatusText, {
                      color: appeal.status === 'resolved' ? c.green : c.yellow,
                      fontFamily: 'DMSans_500Medium',
                    }]}>
                      {appeal.status === 'resolved' ? 'Resolved' : 'Pending'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.appealItemDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>{appeal.description}</Text>
                <Text style={[styles.appealItemDate, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>{appeal.date}</Text>
                {appeal.outcome && (
                  <View style={[styles.outcomeBox, { backgroundColor: c.greenLight }]}>
                    <Ionicons name="checkmark-circle" size={14} color={c.green} />
                    <Text style={[styles.outcomeText, { color: c.green, fontFamily: 'DMSans_400Regular' }]}>{appeal.outcome}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="upload" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Insurance Upload</Text>
          </View>
          <View style={styles.insuranceStatus}>
            <View style={[styles.insuranceBadge, { backgroundColor: c.greenLight }]}>
              <Ionicons name="shield-checkmark" size={18} color={c.green} />
            </View>
            <View style={styles.insuranceInfo}>
              <Text style={[styles.insuranceLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Insurance on file</Text>
              <Text style={[styles.insuranceExp, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Expires Dec 31, 2026</Text>
            </View>
          </View>
          <Pressable style={[styles.uploadBtn, { backgroundColor: c.background, borderColor: c.border, borderWidth: 1 }]}>
            <Feather name="upload-cloud" size={18} color={c.accent} />
            <Text style={[styles.uploadBtnText, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>Upload New Document</Text>
          </Pressable>
        </View>

        <View style={[styles.section, { backgroundColor: c.surface }]}>
          <View style={styles.sectionHeader}>
            <Feather name="file-text" size={18} color={c.accent} />
            <Text style={[styles.sectionTitle, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Digital Agreement</Text>
          </View>
          <View style={styles.agreementRow}>
            <View style={styles.agreementInfo}>
              <Text style={[styles.agreementLabel, { color: c.text, fontFamily: 'DMSans_500Medium' }]}>Independent Contractor Agreement</Text>
              <Text style={[styles.agreementDate, { color: c.textTertiary, fontFamily: 'DMSans_400Regular' }]}>Signed Jan 1, 2026</Text>
            </View>
            <View style={[styles.agreementBadge, { backgroundColor: c.greenLight }]}>
              <Ionicons name="checkmark-circle" size={16} color={c.green} />
              <Text style={[styles.agreementStatus, { color: c.green, fontFamily: 'DMSans_500Medium' }]}>Active</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  wellnessCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  wellnessIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wellnessTitle: { fontSize: 18, textAlign: 'center' },
  wellnessDesc: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  wellnessActions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 6,
  },
  wellnessBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
  },
  contactBtnText: { fontSize: 16, color: '#000' },
  section: {
    borderRadius: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16 },
  resourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  resourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resourceInfo: { flex: 1, gap: 2 },
  resourceLabel: { fontSize: 14 },
  resourceDesc: { fontSize: 12 },
  reasonSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  reasonText: { fontSize: 14 },
  reasonDropdown: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  reasonOptionText: { fontSize: 14 },
  appealInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 12,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitBtnText: { fontSize: 14 },
  submittedBanner: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  submittedText: { fontSize: 16 },
  appealItem: {
    gap: 6,
    paddingVertical: 8,
  },
  appealItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appealItemReason: { fontSize: 14 },
  appealStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  appealStatusText: { fontSize: 11 },
  appealItemDesc: { fontSize: 13, lineHeight: 18 },
  appealItemDate: { fontSize: 11 },
  outcomeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  outcomeText: { fontSize: 12 },
  insuranceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  insuranceBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insuranceInfo: { flex: 1, gap: 2 },
  insuranceLabel: { fontSize: 14 },
  insuranceExp: { fontSize: 12 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderStyle: 'dashed' as const,
  },
  uploadBtnText: { fontSize: 14 },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agreementInfo: { flex: 1, gap: 2 },
  agreementLabel: { fontSize: 14 },
  agreementDate: { fontSize: 12 },
  agreementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  agreementStatus: { fontSize: 12 },
});
