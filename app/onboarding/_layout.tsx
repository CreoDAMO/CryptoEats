import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="merchant" />
      <Stack.Screen name="driver" />
    </Stack>
  );
}
