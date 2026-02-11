import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/query-client';

type AuthMode = 'signin' | 'signup';
type ResetStep = 'email' | 'code' | 'done';

export default function LoginScreen() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const { login, register, isLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signin');
  const [error, setError] = useState('');

  // Sign In form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [signInPasswordVisible, setSignInPasswordVisible] = useState(false);

  // Sign Up form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [phone, setPhone] = useState('+1');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [signUpPasswordVisible, setSignUpPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Forgot Password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState<ResetStep>('email');
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);

  const handleSignIn = async () => {
    setError('');

    if (!signInEmail.trim() || !signInPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      await login(signInEmail.trim(), signInPassword);
      router.replace('/(tabs)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
    }
  };

  const handleSignUp = async () => {
    setError('');

    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !signUpEmail.trim() ||
      !phone.trim() ||
      !signUpPassword.trim() ||
      !confirmPassword.trim()
    ) {
      setError('Please fill in all fields');
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (signUpPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await register(
        signUpEmail.trim(),
        signUpPassword,
        firstName.trim(),
        lastName.trim(),
        phone.trim(),
        'customer'
      );
      router.replace('/(tabs)');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = () => {
    setResetEmail(signInEmail);
    setResetCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetMessage('');
    setError('');
    setResetStep('email');
    setShowForgotPassword(true);
  };

  const handleSendResetCode = async () => {
    if (!resetEmail.trim()) { setError('Please enter your email'); return; }
    setError('');
    setResetLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await res.json();
      setResetMessage(data.message);
      setResetStep('code');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim()) { setError('Please enter the 6-digit code'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (newPassword !== confirmNewPassword) { setError('Passwords do not match'); return; }
    setError('');
    setResetLoading(true);
    try {
      const baseUrl = getApiUrl();
      const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), code: resetCode.trim(), newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setResetMessage(data.message);
      setResetStep('done');
    } catch {
      setError('Could not connect to server. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setShowForgotPassword(false);
    setError('');
    setResetMessage('');
  };

  const isSignIn = mode === 'signin';
  const buttonDisabled = isLoading || (isSignIn ? !signInEmail || !signInPassword : !firstName || !lastName || !signUpEmail || !phone || !signUpPassword || !confirmPassword);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: c.background }]}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/icon.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.brandName, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
              CryptoEats
            </Text>
          </View>

          {showForgotPassword ? (
            <View style={styles.form}>
              <Pressable onPress={handleBackToSignIn} style={styles.backRow}>
                <Feather name="arrow-left" size={20} color={c.accent} />
                <Text style={[styles.backText, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>
                  Back to Sign In
                </Text>
              </Pressable>

              <Text style={[styles.resetTitle, { color: c.text, fontFamily: 'DMSans_700Bold' }]}>
                {resetStep === 'email' ? 'Reset Password' : resetStep === 'code' ? 'Enter Reset Code' : 'Password Updated'}
              </Text>

              {error ? (
                <View style={[styles.errorContainer, { backgroundColor: c.red + '22' }]}>
                  <Feather name="alert-circle" size={16} color={c.red} />
                  <Text style={[styles.errorText, { color: c.red, fontFamily: 'DMSans_400Regular' }]}>{error}</Text>
                </View>
              ) : null}

              {resetMessage && !error ? (
                <View style={[styles.errorContainer, { backgroundColor: c.accent + '22' }]}>
                  <Feather name="check-circle" size={16} color={c.accent} />
                  <Text style={[styles.errorText, { color: c.accent, fontFamily: 'DMSans_400Regular' }]}>{resetMessage}</Text>
                </View>
              ) : null}

              {resetStep === 'email' && (
                <>
                  <Text style={[styles.resetDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                    Enter your email address and we'll send you a 6-digit code to reset your password.
                  </Text>
                  <View>
                    <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Email</Text>
                    <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                      <Feather name="mail" size={18} color={c.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                        placeholder="Enter your email"
                        placeholderTextColor={c.textTertiary}
                        value={resetEmail}
                        onChangeText={setResetEmail}
                        editable={!resetLoading}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>
                  <LinearGradient colors={[c.accent, c.accent]} style={styles.gradientContainer}>
                    <Pressable onPress={handleSendResetCode} disabled={resetLoading || !resetEmail.trim()} style={[styles.button, (resetLoading || !resetEmail.trim()) && { opacity: 0.5 }]}>
                      {resetLoading ? <ActivityIndicator color="#000" size="small" /> : (
                        <Text style={[styles.buttonText, { fontFamily: 'DMSans_600SemiBold' }]}>Send Reset Code</Text>
                      )}
                    </Pressable>
                  </LinearGradient>
                </>
              )}

              {resetStep === 'code' && (
                <>
                  <Text style={[styles.resetDesc, { color: c.textSecondary, fontFamily: 'DMSans_400Regular' }]}>
                    Enter the 6-digit code sent to {resetEmail} and choose a new password.
                  </Text>
                  <View>
                    <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Reset Code</Text>
                    <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                      <Feather name="hash" size={18} color={c.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular', letterSpacing: 4, fontSize: 18 }]}
                        placeholder="000000"
                        placeholderTextColor={c.textTertiary}
                        value={resetCode}
                        onChangeText={(t) => setResetCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                        editable={!resetLoading}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>New Password</Text>
                    <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                      <Feather name="lock" size={18} color={c.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                        placeholder="At least 8 characters"
                        placeholderTextColor={c.textTertiary}
                        value={newPassword}
                        onChangeText={setNewPassword}
                        secureTextEntry={!newPasswordVisible}
                        editable={!resetLoading}
                      />
                      <Pressable onPress={() => setNewPasswordVisible(!newPasswordVisible)}>
                        <Feather name={newPasswordVisible ? 'eye' : 'eye-off'} size={18} color={c.textSecondary} />
                      </Pressable>
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>Confirm New Password</Text>
                    <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                      <Feather name="lock" size={18} color={c.textSecondary} />
                      <TextInput
                        style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                        placeholder="Re-enter new password"
                        placeholderTextColor={c.textTertiary}
                        value={confirmNewPassword}
                        onChangeText={setConfirmNewPassword}
                        secureTextEntry
                        editable={!resetLoading}
                      />
                    </View>
                  </View>
                  <LinearGradient colors={[c.accent, c.accent]} style={styles.gradientContainer}>
                    <Pressable onPress={handleResetPassword} disabled={resetLoading || !resetCode || !newPassword || !confirmNewPassword} style={[styles.button, (resetLoading || !resetCode || !newPassword || !confirmNewPassword) && { opacity: 0.5 }]}>
                      {resetLoading ? <ActivityIndicator color="#000" size="small" /> : (
                        <Text style={[styles.buttonText, { fontFamily: 'DMSans_600SemiBold' }]}>Reset Password</Text>
                      )}
                    </Pressable>
                  </LinearGradient>
                  <Pressable onPress={() => { setResetStep('email'); setError(''); setResetMessage(''); }}>
                    <Text style={[styles.forgotPassword, { color: c.accent, fontFamily: 'DMSans_500Medium', textAlign: 'center' }]}>
                      Didn't get a code? Send again
                    </Text>
                  </Pressable>
                </>
              )}

              {resetStep === 'done' && (
                <>
                  <View style={styles.doneIcon}>
                    <Feather name="check-circle" size={64} color={c.accent} />
                  </View>
                  <LinearGradient colors={[c.accent, c.accent]} style={styles.gradientContainer}>
                    <Pressable onPress={handleBackToSignIn} style={styles.button}>
                      <Text style={[styles.buttonText, { fontFamily: 'DMSans_600SemiBold' }]}>Sign In Now</Text>
                    </Pressable>
                  </LinearGradient>
                </>
              )}
            </View>
          ) : (
            <>

          {/* Tab Buttons */}
          <View style={[styles.tabContainer, { backgroundColor: c.surface }]}>
            <Pressable
              onPress={() => {
                setMode('signin');
                setError('');
              }}
              style={[
                styles.tab,
                isSignIn && [styles.tabActive, { backgroundColor: c.accent }],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: isSignIn ? '#000' : c.textSecondary,
                    fontFamily: isSignIn ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
                  },
                ]}
              >
                Sign In
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('signup');
                setError('');
              }}
              style={[
                styles.tab,
                !isSignIn && [styles.tabActive, { backgroundColor: c.accent }],
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color: !isSignIn ? '#000' : c.textSecondary,
                    fontFamily: !isSignIn ? 'DMSans_600SemiBold' : 'DMSans_500Medium',
                  },
                ]}
              >
                Sign Up
              </Text>
            </Pressable>
          </View>

          {/* Error Message */}
          {error && (
            <View style={[styles.errorContainer, { backgroundColor: c.red + '22' }]}>
              <Feather name="alert-circle" size={16} color={c.red} />
              <Text style={[styles.errorText, { color: c.red, fontFamily: 'DMSans_400Regular' }]}>
                {error}
              </Text>
            </View>
          )}

          {/* Sign In Form */}
          {isSignIn && (
            <View style={styles.form}>
              <View>
                <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                  Email
                </Text>
                <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Feather name="mail" size={18} color={c.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                    placeholder="Enter your email"
                    placeholderTextColor={c.textTertiary}
                    value={signInEmail}
                    onChangeText={setSignInEmail}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                  Password
                </Text>
                <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Feather name="lock" size={18} color={c.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                    placeholder="Enter your password"
                    placeholderTextColor={c.textTertiary}
                    value={signInPassword}
                    onChangeText={setSignInPassword}
                    secureTextEntry={!signInPasswordVisible}
                    editable={!isLoading}
                  />
                  <Pressable onPress={() => setSignInPasswordVisible(!signInPasswordVisible)}>
                    <Feather
                      name={signInPasswordVisible ? 'eye' : 'eye-off'}
                      size={18}
                      color={c.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable onPress={handleForgotPassword}>
                <Text style={[styles.forgotPassword, { color: c.accent, fontFamily: 'DMSans_500Medium' }]}>
                  Forgot Password?
                </Text>
              </Pressable>

              <LinearGradient
                colors={[c.accent, c.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientContainer}
              >
                <Pressable
                  onPress={handleSignIn}
                  disabled={buttonDisabled}
                  style={[
                    styles.button,
                    buttonDisabled && { opacity: 0.5 },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { fontFamily: 'DMSans_600SemiBold' }]}>
                      Sign In
                    </Text>
                  )}
                </Pressable>
              </LinearGradient>
            </View>
          )}

          {/* Sign Up Form */}
          {!isSignIn && (
            <View style={styles.form}>
              <View style={styles.nameRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                    First Name
                  </Text>
                  <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                    <Feather name="user" size={18} color={c.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                      placeholder="First name"
                      placeholderTextColor={c.textTertiary}
                      value={firstName}
                      onChangeText={setFirstName}
                      editable={!isLoading}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                    Last Name
                  </Text>
                  <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                    <Feather name="user" size={18} color={c.textSecondary} />
                    <TextInput
                      style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                      placeholder="Last name"
                      placeholderTextColor={c.textTertiary}
                      value={lastName}
                      onChangeText={setLastName}
                      editable={!isLoading}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                  Email
                </Text>
                <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Feather name="mail" size={18} color={c.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                    placeholder="Enter your email"
                    placeholderTextColor={c.textTertiary}
                    value={signUpEmail}
                    onChangeText={setSignUpEmail}
                    editable={!isLoading}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                  Phone
                </Text>
                <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Feather name="phone" size={18} color={c.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor={c.textTertiary}
                    value={phone}
                    onChangeText={setPhone}
                    editable={!isLoading}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                  Password
                </Text>
                <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Feather name="lock" size={18} color={c.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={c.textTertiary}
                    value={signUpPassword}
                    onChangeText={setSignUpPassword}
                    secureTextEntry={!signUpPasswordVisible}
                    editable={!isLoading}
                  />
                  <Pressable onPress={() => setSignUpPasswordVisible(!signUpPasswordVisible)}>
                    <Feather
                      name={signUpPasswordVisible ? 'eye' : 'eye-off'}
                      size={18}
                      color={c.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              <View>
                <Text style={[styles.label, { color: c.text, fontFamily: 'DMSans_600SemiBold' }]}>
                  Confirm Password
                </Text>
                <View style={[styles.inputContainer, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Feather name="lock" size={18} color={c.textSecondary} />
                  <TextInput
                    style={[styles.input, { color: c.text, fontFamily: 'DMSans_400Regular' }]}
                    placeholder="Confirm your password"
                    placeholderTextColor={c.textTertiary}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!confirmPasswordVisible}
                    editable={!isLoading}
                  />
                  <Pressable onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)}>
                    <Feather
                      name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                      size={18}
                      color={c.textSecondary}
                    />
                  </Pressable>
                </View>
              </View>

              <LinearGradient
                colors={[c.accent, c.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientContainer}
              >
                <Pressable
                  onPress={handleSignUp}
                  disabled={buttonDisabled}
                  style={[
                    styles.button,
                    buttonDisabled && { opacity: 0.5 },
                  ]}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { fontFamily: 'DMSans_600SemiBold' }]}>
                      Create Account
                    </Text>
                  )}
                </Pressable>
              </LinearGradient>
            </View>
          )}

          </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: 12,
  },
  brandName: {
    fontSize: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabActive: {
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
  },
  form: {
    gap: 16,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    height: 48,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    height: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
  forgotPassword: {
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
  },
  gradientContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 8,
  },
  button: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    color: '#000',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  backText: {
    fontSize: 14,
  },
  resetTitle: {
    fontSize: 22,
    marginBottom: 4,
  },
  resetDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  doneIcon: {
    alignItems: 'center',
    marginVertical: 24,
  },
});
