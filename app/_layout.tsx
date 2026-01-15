import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { requestNotificationPermission, createWaterReminderChannel } from '@/utils/notifications';

// Configure notification handler at module level (BEFORE component mounts)
// This ensures notifications work even when app is in background/killed
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Create notification channel first (required for Android 8+)
        await createWaterReminderChannel();

        // Add minimum delay to show splash screen (2 seconds)
        const [notificationResult] = await Promise.all([
          requestNotificationPermission().catch(() => false),
          new Promise(resolve => setTimeout(resolve, 2000)), // 2 seconds splash
        ]);

        if (notificationResult) {
          console.log('Notification permissions granted');
        }
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // Hide splash screen after layout is complete
      await SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // Show custom splash screen while app is preparing
  if (!appIsReady) {
    return (
      <View style={styles.splashContainer}>
        <Text style={styles.splashEmoji}>💧</Text>
        <Text style={styles.splashTitle}>Water Tracker</Text>
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="history" options={{ title: 'History' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  splashTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
  },
});
