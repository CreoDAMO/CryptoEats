import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Pressable, Platform,
  TextInput, Alert, ActivityIndicator, Animated, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { apiRequest, getApiUrl } from '@/lib/query-client';

const CUISINE_TYPES = [
  'American', 'Mexican', 'Cuban', 'Italian', 'Japanese', 'Chinese',
  'Thai', 'Indian', 'Mediterranean', 'Caribbean', 'Seafood', 'BBQ',
  'Pizza', 'Sushi', 'Vietnamese', 'Korean', 'Other',
];

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

interface MerchantForm {
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  einNumber: string;
  cuisineType: string;
  hasAlcoholLicense: boolean;
  alcoholLicenseNumber: string;
  openTime: string;
  closeTime: string;
  operatingDays: string[];
  agreementSigned: boolean;
}

const INITIAL_FORM: MerchantForm = {
  businessName: '',
  businessAddress: '',
  businessPhone: '',
  einNumber: '',
  cuisineType: '',
  hasAlcoholLicense: false,
  alcoholLicenseNumber: '',
  openTime: '10:00',
  closeTime: '22:00',
  operatingDays: [...DAYS_OF_WEEK],
  agreementSigned: false,
};

const STEPS = [
  { title: 'Business Info', icon: 'briefcase' as const },
  { title: 'Menu & Licensing', icon: 'file-text' as const },
  { title: 'Agreement', icon: 'check-circle' as const },
];

export default function MerchantOnboarding() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<MerchantForm>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [existingStatus, setExistingStatus] = useState<string | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: (step + 1) / STEPS.length,
      useNativeDriver: false,
      tension: 60,
      friction: 10,
    }).start();
  }, [step]);

  const checkOnboardingStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('cryptoeats_token');
      if (!token) {
        setCheckingStatus(false);
        return;
      }
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/onboarding/status', baseUrl).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExistingStatus(data.status);
        if (data.status === 'in_progress' || data.status === 'not_started') {
          if (data.businessName) setForm(prev => ({ ...prev, businessName: data.businessName }));
          if (data.businessAddress) setForm(prev => ({ ...prev, businessAddress: data.businessAddress }));
          if (data.businessPhone) setForm(prev => ({ ...prev, businessPhone: data.businessPhone }));
          if (data.einNumber) setForm(prev => ({ ...prev, einNumber: data.einNumber }));
          if (data.cuisineType) setForm(prev => ({ ...prev, cuisineType: data.cuisineType }));
          if (data.hasAlcoholLicense) setForm(prev => ({ ...prev, hasAlcoholLicense: true }));
          if (data.alcoholLicenseNumber) setForm(prev => ({ ...prev, alcoholLicenseNumber: data.alcoholLicenseNumber }));
        }
      }
    } catch (e) {
    } finally {
      setCheckingStatus(false);
    }
  };

  const updateField = <K extends keyof MerchantForm>(key: K, value: MerchantForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.businessName.trim()) { Alert.alert('Required', 'Please enter your business name.'); return false; }
      if (!form.businessAddress.trim()) { Alert.alert('Required', 'Please enter your business address.'); return false; }
      if (!form.businessPhone.trim()) { Alert.alert('Required', 'Please enter your business phone number.'); return false; }
      return true;
    }
    if (step === 1) {
      if (!form.cuisineType) { Alert.alert('Required', 'Please select a cuisine type.'); return false; }
      if (form.hasAlcoholLicense && !form.alcoholLicenseNumber.trim()) {
        Alert.alert('Required', 'Please enter your alcohol license number.'); return false;
      }
      return true;
    }
    if (step === 2) {
      if (!form.agreementSigned) { Alert.alert('Required', 'Please accept the Merchant Partner Agreement to continue.'); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      submitApplication();
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 0) setStep(step - 1);
    else router.back();
  };

  const submitApplication = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('cryptoeats_token');
      if (!token) {
        Alert.alert('Error', 'Please log in to submit your application.');
        return;
      }
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/onboarding/merchant', baseUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          businessName: form.businessName,
          businessAddress: form.businessAddress,
          businessPhone: form.businessPhone,
          einNumber: form.einNumber || undefined,
          cuisineType: form.cuisineType,
          hasAlcoholLicense: form.hasAlcoholLicense,
          alcoholLicenseNumber: form.hasAlcoholLicense ? form.alcoholLicenseNumber : undefined,
          operatingHours: {
            open: form.openTime,
            close: form.closeTime,
            days: form.operatingDays,
          },
          agreementSigned: true,
        }),
      });

      if (res.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setExistingStatus('pending_review');
      } else {
        const err = await res.json().catch(() => ({ message: 'Failed to submit' }));
        Alert.alert('Error', err.message || 'Failed to submit application.');
      }
    } catch (e: any) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <View style={[styles.container, { backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={c.accent} />
      </View>
    );
  }

  if (existingStatus === 'pending_review') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 4 }]}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Application Status</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, { backgroundColor: c.surface }]}>
            <View style={[styles.statusIcon, { backgroundColor: c.yellowLight }]}>
              <Feather name="clock" size={36} color={c.yellow} />
            </View>
            <Text style={[styles.statusTitle, { color: c.text }]}>Under Review</Text>
            <Text style={[styles.statusDesc, { color: c.textSecondary }]}>
              Your merchant application is being reviewed by our team. We'll notify you once a decision is made, typically within 1-2 business days.
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: c.yellowLight }]}>
              <Text style={[styles.statusBadgeText, { color: c.yellow }]}>Pending Review</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (existingStatus === 'approved') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 4 }]}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Application Status</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, { backgroundColor: c.surface }]}>
            <View style={[styles.statusIcon, { backgroundColor: c.greenLight }]}>
              <Feather name="check-circle" size={36} color={c.green} />
            </View>
            <Text style={[styles.statusTitle, { color: c.text }]}>Approved</Text>
            <Text style={[styles.statusDesc, { color: c.textSecondary }]}>
              Congratulations! Your restaurant has been approved and is live on CryptoEats. You can manage your restaurant from the merchant dashboard.
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: c.greenLight }]}>
              <Text style={[styles.statusBadgeText, { color: c.green }]}>Active</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  if (existingStatus === 'rejected') {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 4 }]}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Application Status</Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusCard, { backgroundColor: c.surface }]}>
            <View style={[styles.statusIcon, { backgroundColor: c.redLight }]}>
              <Feather name="x-circle" size={36} color={c.red} />
            </View>
            <Text style={[styles.statusTitle, { color: c.text }]}>Not Approved</Text>
            <Text style={[styles.statusDesc, { color: c.textSecondary }]}>
              Unfortunately, your application was not approved at this time. Please contact support@cryptoeats.io for more information or to reapply.
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: c.redLight }]}>
              <Text style={[styles.statusBadgeText, { color: c.red }]}>Rejected</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <Pressable onPress={prevStep}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: c.text }]}>Become a Partner</Text>
        <Text style={[styles.stepLabel, { color: c.textSecondary }]}>{step + 1}/{STEPS.length}</Text>
      </View>

      <View style={styles.progressWrap}>
        <View style={[styles.progressTrack, { backgroundColor: c.border }]}>
          <Animated.View style={[styles.progressFill, { backgroundColor: c.accent, width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <View style={styles.stepsRow}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepDot, { backgroundColor: i <= step ? c.accent : c.border }]}>
                <Feather name={s.icon} size={14} color={i <= step ? '#000' : c.textTertiary} />
              </View>
              <Text style={[styles.stepText, { color: i <= step ? c.text : c.textTertiary }]}>{s.title}</Text>
            </View>
          ))}
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 100 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: c.text }]}>Tell us about your business</Text>
              <Text style={[styles.stepSubheading, { color: c.textSecondary }]}>We need some basic information to get your restaurant set up on CryptoEats.</Text>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="home" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Restaurant Name</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.businessName}
                  onChangeText={(v) => updateField('businessName', v)}
                  placeholder="e.g. Miami Taco House"
                  placeholderTextColor={c.textTertiary}
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="map-pin" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Business Address</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.businessAddress}
                  onChangeText={(v) => updateField('businessAddress', v)}
                  placeholder="123 Calle Ocho, Miami, FL 33130"
                  placeholderTextColor={c.textTertiary}
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="phone" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Phone Number</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.businessPhone}
                  onChangeText={(v) => updateField('businessPhone', v)}
                  placeholder="(305) 555-1234"
                  placeholderTextColor={c.textTertiary}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="hash" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>EIN (Optional)</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.einNumber}
                  onChangeText={(v) => updateField('einNumber', v)}
                  placeholder="XX-XXXXXXX"
                  placeholderTextColor={c.textTertiary}
                />
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: c.text }]}>Cuisine & Licensing</Text>
              <Text style={[styles.stepSubheading, { color: c.textSecondary }]}>Select your cuisine type and add any applicable licenses.</Text>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <MaterialCommunityIcons name="silverware-fork-knife" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Cuisine Type</Text>
                </View>
                <View style={styles.chipGrid}>
                  {CUISINE_TYPES.map(ct => (
                    <Pressable
                      key={ct}
                      onPress={() => { updateField('cuisineType', ct); Haptics.selectionAsync(); }}
                      style={[styles.chip, { backgroundColor: form.cuisineType === ct ? c.accent : c.card, borderColor: form.cuisineType === ct ? c.accent : c.border }]}
                    >
                      <Text style={[styles.chipText, { color: form.cuisineType === ct ? '#000' : c.textSecondary }]}>{ct}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="clock" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Operating Hours</Text>
                </View>
                <View style={styles.timeRow}>
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeLabel, { color: c.textTertiary }]}>Open</Text>
                    <TextInput
                      style={[styles.timeInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                      value={form.openTime}
                      onChangeText={(v) => updateField('openTime', v)}
                      placeholder="10:00"
                      placeholderTextColor={c.textTertiary}
                    />
                  </View>
                  <Feather name="arrow-right" size={16} color={c.textTertiary} style={{ marginTop: 22 }} />
                  <View style={styles.timeCol}>
                    <Text style={[styles.timeLabel, { color: c.textTertiary }]}>Close</Text>
                    <TextInput
                      style={[styles.timeInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                      value={form.closeTime}
                      onChangeText={(v) => updateField('closeTime', v)}
                      placeholder="22:00"
                      placeholderTextColor={c.textTertiary}
                    />
                  </View>
                </View>
                <View style={styles.chipGrid}>
                  {DAYS_OF_WEEK.map(day => (
                    <Pressable
                      key={day}
                      onPress={() => {
                        Haptics.selectionAsync();
                        const days = form.operatingDays.includes(day)
                          ? form.operatingDays.filter(d => d !== day)
                          : [...form.operatingDays, day];
                        updateField('operatingDays', days);
                      }}
                      style={[styles.dayChip, { backgroundColor: form.operatingDays.includes(day) ? c.accent : c.card, borderColor: form.operatingDays.includes(day) ? c.accent : c.border }]}
                    >
                      <Text style={[styles.dayChipText, { color: form.operatingDays.includes(day) ? '#000' : c.textSecondary }]}>{day}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <Pressable
                  style={styles.switchRow}
                  onPress={() => { updateField('hasAlcoholLicense', !form.hasAlcoholLicense); Haptics.selectionAsync(); }}
                >
                  <View style={styles.switchLabel}>
                    <MaterialCommunityIcons name="glass-wine" size={16} color={c.accent} />
                    <Text style={[styles.inputLabel, { color: c.textSecondary, marginLeft: 6 }]}>Alcohol License</Text>
                  </View>
                  <View style={[styles.toggle, { backgroundColor: form.hasAlcoholLicense ? c.accent : c.border }]}>
                    <View style={[styles.toggleKnob, { transform: [{ translateX: form.hasAlcoholLicense ? 18 : 2 }] }]} />
                  </View>
                </Pressable>
                {form.hasAlcoholLicense && (
                  <TextInput
                    style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border, marginTop: 12 }]}
                    value={form.alcoholLicenseNumber}
                    onChangeText={(v) => updateField('alcoholLicenseNumber', v)}
                    placeholder="License Number (e.g. FL-ALC-2026-1234)"
                    placeholderTextColor={c.textTertiary}
                  />
                )}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: c.text }]}>Merchant Partner Agreement</Text>
              <Text style={[styles.stepSubheading, { color: c.textSecondary }]}>Please review and accept the agreement to complete your application.</Text>

              <View style={[styles.agreementBox, { backgroundColor: c.surface, borderColor: c.border }]}>
                <ScrollView style={styles.agreementScroll} nestedScrollEnabled>
                  <Text style={[styles.agreementText, { color: c.textSecondary }]}>
                    {`CRYPTOEATS MERCHANT PARTNER AGREEMENT

1. PARTNERSHIP TERMS
By signing this agreement, you ("Merchant") agree to partner with CryptoEats for food delivery services in the Miami-Dade County area.

2. COMMISSION STRUCTURE
CryptoEats charges a competitive commission rate on each order placed through the platform. Rates vary by partnership tier.

3. FOOD SAFETY & COMPLIANCE
Merchant agrees to maintain all required health department certifications, food handler permits, and applicable licenses (including alcohol licenses where applicable).

4. SB 676 COMPLIANCE
Merchant acknowledges Florida Senate Bill 676 requirements regarding transparent pricing and the right to respond to customer reviews within the platform.

5. ORDER FULFILLMENT
Merchant agrees to fulfill orders within the estimated preparation time and maintain menu item availability.

6. PAYMENT TERMS
Payments are processed weekly via direct deposit or cryptocurrency (USDC on Base chain). Merchant may opt into instant cashout for a small fee.

7. DATA PRIVACY
CryptoEats will handle all customer data in compliance with applicable privacy laws. Merchant will not retain or misuse customer contact information.

8. TERMINATION
Either party may terminate this agreement with 30 days written notice. CryptoEats reserves the right to suspend merchant accounts for food safety violations.`}
                  </Text>
                </ScrollView>
              </View>

              <Pressable
                onPress={() => { updateField('agreementSigned', !form.agreementSigned); Haptics.selectionAsync(); }}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, { borderColor: form.agreementSigned ? c.accent : c.border, backgroundColor: form.agreementSigned ? c.accent : 'transparent' }]}>
                  {form.agreementSigned && <Feather name="check" size={14} color="#000" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: c.text }]}>
                  I have read and agree to the Merchant Partner Agreement
                </Text>
              </Pressable>

              <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.summaryTitle, { color: c.text }]}>Application Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>Business</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.businessName || '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>Cuisine</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.cuisineType || '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>Hours</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.openTime} - {form.closeTime}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>Alcohol</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.hasAlcoholLicense ? 'Yes' : 'No'}</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: bottomPad + 8, backgroundColor: c.background }]}>
        <Pressable
          onPress={nextStep}
          disabled={loading}
          style={[styles.nextBtn, { backgroundColor: c.accent, opacity: loading ? 0.6 : 1 }]}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <>
              <Text style={styles.nextBtnText}>{step === STEPS.length - 1 ? 'Submit Application' : 'Continue'}</Text>
              {step < STEPS.length - 1 && <Feather name="arrow-right" size={18} color="#000" />}
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold' },
  stepLabel: { fontSize: 14, fontFamily: 'DMSans_500Medium' },
  progressWrap: { paddingHorizontal: 20, paddingBottom: 16 },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepText: { fontSize: 11, fontFamily: 'DMSans_500Medium' },
  scroll: { paddingHorizontal: 20 },
  stepContent: { gap: 16 },
  stepHeading: { fontSize: 22, fontFamily: 'DMSans_700Bold', marginTop: 4 },
  stepSubheading: { fontSize: 14, fontFamily: 'DMSans_400Regular', lineHeight: 20 },
  inputGroup: { borderRadius: 16, padding: 16 },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  inputLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  input: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'DMSans_400Regular' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  dayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, minWidth: 42, alignItems: 'center' },
  dayChipText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  timeCol: { flex: 1 },
  timeLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', marginBottom: 6 },
  timeInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, fontFamily: 'DMSans_400Regular', textAlign: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  switchLabel: { flexDirection: 'row', alignItems: 'center' },
  toggle: { width: 42, height: 24, borderRadius: 12, justifyContent: 'center' },
  toggleKnob: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff' },
  agreementBox: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  agreementScroll: { maxHeight: 240, padding: 16 },
  agreementText: { fontSize: 12, fontFamily: 'DMSans_400Regular', lineHeight: 18 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { flex: 1, fontSize: 14, fontFamily: 'DMSans_500Medium', lineHeight: 20 },
  summaryCard: { borderRadius: 16, padding: 16, gap: 10 },
  summaryTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', marginBottom: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel: { fontSize: 13, fontFamily: 'DMSans_400Regular' },
  summaryValue: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  nextBtn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  nextBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#000' },
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  statusCard: { borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 380 },
  statusIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  statusTitle: { fontSize: 22, fontFamily: 'DMSans_700Bold', marginBottom: 12 },
  statusDesc: { fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusBadgeText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
});
