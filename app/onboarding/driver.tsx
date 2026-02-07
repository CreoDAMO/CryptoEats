import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView, Pressable, Platform,
  TextInput, Alert, ActivityIndicator, Animated, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { getApiUrl } from '@/lib/query-client';

const VEHICLE_TYPES = ['Car', 'SUV', 'Truck', 'Van', 'Motorcycle', 'Bicycle', 'Scooter'];

interface DriverForm {
  licenseNumber: string;
  vehicleType: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  licensePlate: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  insuranceExpiry: string;
  backgroundCheckConsent: boolean;
  agreementSigned: boolean;
}

const INITIAL_FORM: DriverForm = {
  licenseNumber: '',
  vehicleType: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  vehicleColor: '',
  licensePlate: '',
  insuranceProvider: '',
  insurancePolicyNumber: '',
  insuranceExpiry: '',
  backgroundCheckConsent: false,
  agreementSigned: false,
};

const STEPS = [
  { title: 'License & Vehicle', icon: 'truck' as const },
  { title: 'Insurance', icon: 'shield' as const },
  { title: 'Agreement', icon: 'check-circle' as const },
];

export default function DriverOnboarding() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const topPad = isWeb ? 67 : insets.top;
  const bottomPad = isWeb ? 34 : insets.bottom;
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<DriverForm>(INITIAL_FORM);
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
      if (!token) { setCheckingStatus(false); return; }
      const baseUrl = getApiUrl();
      const res = await fetch(new URL('/api/onboarding/status', baseUrl).toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExistingStatus(data.status);
        if (data.status === 'in_progress' || data.status === 'not_started') {
          if (data.licenseNumber) setForm(prev => ({ ...prev, licenseNumber: data.licenseNumber }));
          if (data.vehicleType) setForm(prev => ({ ...prev, vehicleType: data.vehicleType }));
          if (data.vehicleMake) setForm(prev => ({ ...prev, vehicleMake: data.vehicleMake }));
          if (data.vehicleModel) setForm(prev => ({ ...prev, vehicleModel: data.vehicleModel }));
          if (data.vehicleYear) setForm(prev => ({ ...prev, vehicleYear: data.vehicleYear }));
          if (data.vehicleColor) setForm(prev => ({ ...prev, vehicleColor: data.vehicleColor }));
          if (data.licensePlate) setForm(prev => ({ ...prev, licensePlate: data.licensePlate }));
          if (data.insuranceProvider) setForm(prev => ({ ...prev, insuranceProvider: data.insuranceProvider }));
          if (data.insurancePolicyNumber) setForm(prev => ({ ...prev, insurancePolicyNumber: data.insurancePolicyNumber }));
        }
      }
    } catch (e) {
    } finally {
      setCheckingStatus(false);
    }
  };

  const updateField = <K extends keyof DriverForm>(key: K, value: DriverForm[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const validateStep = (): boolean => {
    if (step === 0) {
      if (!form.licenseNumber.trim()) { Alert.alert('Required', 'Please enter your driver\'s license number.'); return false; }
      if (!form.vehicleType) { Alert.alert('Required', 'Please select a vehicle type.'); return false; }
      if (!form.vehicleMake.trim()) { Alert.alert('Required', 'Please enter vehicle make.'); return false; }
      if (!form.vehicleModel.trim()) { Alert.alert('Required', 'Please enter vehicle model.'); return false; }
      if (!form.vehicleYear.trim()) { Alert.alert('Required', 'Please enter vehicle year.'); return false; }
      if (!form.licensePlate.trim()) { Alert.alert('Required', 'Please enter license plate number.'); return false; }
      return true;
    }
    if (step === 1) {
      if (!form.insuranceProvider.trim()) { Alert.alert('Required', 'Please enter your insurance provider.'); return false; }
      if (!form.insurancePolicyNumber.trim()) { Alert.alert('Required', 'Please enter your policy number.'); return false; }
      if (!form.insuranceExpiry.trim()) { Alert.alert('Required', 'Please enter insurance expiry date.'); return false; }
      return true;
    }
    if (step === 2) {
      if (!form.backgroundCheckConsent) { Alert.alert('Required', 'You must consent to a background check to proceed.'); return false; }
      if (!form.agreementSigned) { Alert.alert('Required', 'Please accept the Independent Contractor Agreement.'); return false; }
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
      const res = await fetch(new URL('/api/onboarding/driver', baseUrl).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          licenseNumber: form.licenseNumber,
          vehicleType: form.vehicleType.toLowerCase(),
          vehicleMake: form.vehicleMake,
          vehicleModel: form.vehicleModel,
          vehicleYear: form.vehicleYear,
          vehicleColor: form.vehicleColor || undefined,
          licensePlate: form.licensePlate,
          insuranceProvider: form.insuranceProvider,
          insurancePolicyNumber: form.insurancePolicyNumber,
          insuranceExpiry: form.insuranceExpiry,
          backgroundCheckConsent: true,
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
              Your driver application is being reviewed. We'll run a background check and get back to you within 1-3 business days.
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
            <Text style={[styles.statusTitle, { color: c.text }]}>You're In!</Text>
            <Text style={[styles.statusDesc, { color: c.textSecondary }]}>
              Welcome to the CryptoEats driver team! You can now switch to Driver Mode from your profile to start accepting deliveries.
            </Text>
            <Pressable
              onPress={() => router.push('/driver')}
              style={[styles.goDriverBtn, { backgroundColor: c.accent }]}
            >
              <Feather name="truck" size={16} color="#000" />
              <Text style={styles.goDriverBtnText}>Go to Driver Mode</Text>
            </Pressable>
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
              Your driver application was not approved at this time. Please contact support@cryptoeats.io for details or to appeal.
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
        <Text style={[styles.headerTitle, { color: c.text }]}>Become a Driver</Text>
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
              <Text style={[styles.stepHeading, { color: c.text }]}>License & Vehicle Details</Text>
              <Text style={[styles.stepSubheading, { color: c.textSecondary }]}>Tell us about yourself and the vehicle you'll be using for deliveries.</Text>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="credit-card" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Driver's License Number</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.licenseNumber}
                  onChangeText={(v) => updateField('licenseNumber', v)}
                  placeholder="e.g. D123-456-789"
                  placeholderTextColor={c.textTertiary}
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <MaterialCommunityIcons name="car" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Vehicle Type</Text>
                </View>
                <View style={styles.chipGrid}>
                  {VEHICLE_TYPES.map(vt => (
                    <Pressable
                      key={vt}
                      onPress={() => { updateField('vehicleType', vt); Haptics.selectionAsync(); }}
                      style={[styles.chip, { backgroundColor: form.vehicleType === vt ? c.accent : c.card, borderColor: form.vehicleType === vt ? c.accent : c.border }]}
                    >
                      <Text style={[styles.chipText, { color: form.vehicleType === vt ? '#000' : c.textSecondary }]}>{vt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="info" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Vehicle Details</Text>
                </View>
                <View style={styles.rowInputs}>
                  <TextInput
                    style={[styles.input, styles.halfInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                    value={form.vehicleMake}
                    onChangeText={(v) => updateField('vehicleMake', v)}
                    placeholder="Make (e.g. Toyota)"
                    placeholderTextColor={c.textTertiary}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                    value={form.vehicleModel}
                    onChangeText={(v) => updateField('vehicleModel', v)}
                    placeholder="Model (e.g. Camry)"
                    placeholderTextColor={c.textTertiary}
                  />
                </View>
                <View style={[styles.rowInputs, { marginTop: 10 }]}>
                  <TextInput
                    style={[styles.input, styles.halfInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                    value={form.vehicleYear}
                    onChangeText={(v) => updateField('vehicleYear', v)}
                    placeholder="Year (e.g. 2023)"
                    placeholderTextColor={c.textTertiary}
                    keyboardType="numeric"
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                    value={form.vehicleColor}
                    onChangeText={(v) => updateField('vehicleColor', v)}
                    placeholder="Color (Optional)"
                    placeholderTextColor={c.textTertiary}
                  />
                </View>
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <MaterialCommunityIcons name="card-text" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>License Plate</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.licensePlate}
                  onChangeText={(v) => updateField('licensePlate', v)}
                  placeholder="e.g. MIA-1234"
                  placeholderTextColor={c.textTertiary}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          )}

          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: c.text }]}>Insurance Information</Text>
              <Text style={[styles.stepSubheading, { color: c.textSecondary }]}>Active vehicle insurance is required for all delivery partners.</Text>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="shield" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Insurance Provider</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.insuranceProvider}
                  onChangeText={(v) => updateField('insuranceProvider', v)}
                  placeholder="e.g. State Farm, GEICO, Progressive"
                  placeholderTextColor={c.textTertiary}
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="file-text" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Policy Number</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.insurancePolicyNumber}
                  onChangeText={(v) => updateField('insurancePolicyNumber', v)}
                  placeholder="e.g. SF-2026-001234"
                  placeholderTextColor={c.textTertiary}
                />
              </View>

              <View style={[styles.inputGroup, { backgroundColor: c.surface }]}>
                <View style={styles.inputLabelRow}>
                  <Feather name="calendar" size={14} color={c.accent} />
                  <Text style={[styles.inputLabel, { color: c.textSecondary }]}>Expiration Date</Text>
                </View>
                <TextInput
                  style={[styles.input, { color: c.text, backgroundColor: c.card, borderColor: c.border }]}
                  value={form.insuranceExpiry}
                  onChangeText={(v) => updateField('insuranceExpiry', v)}
                  placeholder="YYYY-MM-DD (e.g. 2027-03-15)"
                  placeholderTextColor={c.textTertiary}
                />
              </View>

              <View style={[styles.infoCard, { backgroundColor: c.accentSoft }]}>
                <Feather name="info" size={16} color={c.accent} />
                <Text style={[styles.infoText, { color: c.textSecondary }]}>
                  You may be asked to upload proof of insurance after your application is reviewed. Keep your documents handy.
                </Text>
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={[styles.stepHeading, { color: c.text }]}>Independent Contractor Agreement</Text>
              <Text style={[styles.stepSubheading, { color: c.textSecondary }]}>Review the agreement and confirm your consent to proceed.</Text>

              <View style={[styles.agreementBox, { backgroundColor: c.surface, borderColor: c.border }]}>
                <ScrollView style={styles.agreementScroll} nestedScrollEnabled>
                  <Text style={[styles.agreementText, { color: c.textSecondary }]}>
                    {`CRYPTOEATS INDEPENDENT CONTRACTOR AGREEMENT

1. INDEPENDENT CONTRACTOR STATUS
You ("Driver") are an independent contractor, not an employee. You set your own schedule and choose which deliveries to accept.

2. HUMAN-FIRST POLICY
CryptoEats operates under a Human-First driver policy:
  - No punitive deactivation for declining orders
  - Positive engagement tiers (Rising Star, Road Warrior, Elite Courier, Legend)
  - Mandatory wellness check-ins and support access
  - Fair appeals process for any disputes

3. EARNINGS & PAYMENT
Drivers earn per-delivery fees plus 100% of customer tips. Payments are processed weekly or via instant cashout. 1099 tax documentation is provided annually.

4. BACKGROUND CHECK
You consent to a background check as required by Florida law. Results are kept confidential and used solely for eligibility determination.

5. DELIVERY STANDARDS
Drivers agree to:
  - Handle food safely and maintain appropriate temperatures
  - Verify age (21+) for alcohol deliveries using the in-app verification tool
  - Maintain active vehicle insurance
  - Follow all traffic laws and delivery protocols

6. INSURANCE
You must maintain active auto insurance that covers delivery activities. CryptoEats provides supplemental liability coverage during active deliveries.

7. TERMINATION
Either party may end this relationship at any time. CryptoEats will not deactivate drivers without following the Human-First appeals process.

8. DATA & PRIVACY
Location and delivery data is collected during active deliveries only. Personal data is handled per applicable privacy laws.`}
                  </Text>
                </ScrollView>
              </View>

              <Pressable
                onPress={() => { updateField('backgroundCheckConsent', !form.backgroundCheckConsent); Haptics.selectionAsync(); }}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, { borderColor: form.backgroundCheckConsent ? c.accent : c.border, backgroundColor: form.backgroundCheckConsent ? c.accent : 'transparent' }]}>
                  {form.backgroundCheckConsent && <Feather name="check" size={14} color="#000" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: c.text }]}>
                  I consent to a background check as required by Florida law
                </Text>
              </Pressable>

              <Pressable
                onPress={() => { updateField('agreementSigned', !form.agreementSigned); Haptics.selectionAsync(); }}
                style={styles.checkboxRow}
              >
                <View style={[styles.checkbox, { borderColor: form.agreementSigned ? c.accent : c.border, backgroundColor: form.agreementSigned ? c.accent : 'transparent' }]}>
                  {form.agreementSigned && <Feather name="check" size={14} color="#000" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: c.text }]}>
                  I have read and agree to the Independent Contractor Agreement
                </Text>
              </Pressable>

              <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
                <Text style={[styles.summaryTitle, { color: c.text }]}>Application Summary</Text>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>License</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.licenseNumber || '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>Vehicle</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.vehicleYear} {form.vehicleMake} {form.vehicleModel}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>Plate</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.licensePlate || '—'}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, { color: c.textTertiary }]}>Insurance</Text>
                  <Text style={[styles.summaryValue, { color: c.text }]}>{form.insuranceProvider || '—'}</Text>
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
  halfInput: { flex: 1 },
  rowInputs: { flexDirection: 'row', gap: 10 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: 'DMSans_500Medium' },
  infoCard: { flexDirection: 'row', borderRadius: 12, padding: 14, gap: 10, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, fontFamily: 'DMSans_400Regular', lineHeight: 18 },
  agreementBox: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  agreementScroll: { maxHeight: 220, padding: 16 },
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
  goDriverBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 26, marginTop: 8 },
  goDriverBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#000' },
  statusContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  statusCard: { borderRadius: 24, padding: 32, alignItems: 'center', width: '100%', maxWidth: 380 },
  statusIcon: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  statusTitle: { fontSize: 22, fontFamily: 'DMSans_700Bold', marginBottom: 12 },
  statusDesc: { fontSize: 14, fontFamily: 'DMSans_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusBadgeText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold' },
});
