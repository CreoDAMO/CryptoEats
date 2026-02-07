import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import Colors from '@/constants/colors';

export default function DriverLayout() {
  const c = Colors.dark;
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const isIOS = Platform.OS === 'ios';
  const topPad = isWeb ? 67 : insets.top;
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 8, backgroundColor: c.surface }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={c.text} />
        </Pressable>
        <View style={styles.headerTitleRow}>
          <Feather name="truck" size={18} color={c.accent} />
          <Text style={[styles.headerTitle, { color: c.text }]}>Driver Mode</Text>
        </View>
        <View style={styles.backBtn} />
      </View>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.accent,
          tabBarInactiveTintColor: c.tabIconDefault,
          tabBarStyle: {
            position: 'absolute' as const,
            backgroundColor: isIOS ? 'transparent' : c.background,
            borderTopWidth: isWeb ? 1 : 0,
            borderTopColor: c.border,
            elevation: 0,
            ...(isWeb ? { height: 84 } : {}),
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFill} />
            ) : isWeb ? (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: c.background }]} />
            ) : null,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => <Feather name="package" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="earnings"
          options={{
            title: 'Earnings',
            tabBarIcon: ({ color, size }) => <Feather name="dollar-sign" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => <Feather name="bar-chart-2" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="support"
          options={{
            title: 'Support',
            tabBarIcon: ({ color, size }) => <Feather name="life-buoy" size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
  },
});
