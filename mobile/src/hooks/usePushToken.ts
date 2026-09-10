import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { api } from '@/services/api';

const PUSH_TOKEN_REGISTERED_KEY = 'push_token_registered';

async function registerPushToken() {
  // Check if we've already registered to avoid re-registration on every launch
  const alreadyRegistered = await SecureStore.getItemAsync(PUSH_TOKEN_REGISTERED_KEY);
  if (alreadyRegistered) return;

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    // User declined — don't mark as registered so we can ask again later
    return;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF4081',
    });
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: '01082da3-36a9-4e80-94f3-a028aeab083f',
  });

  // Register with our backend
  await api.post('/api/auth/me/push-token', { token: tokenData.data });

  // Mark as registered so we skip on subsequent launches
  await SecureStore.setItemAsync(PUSH_TOKEN_REGISTERED_KEY, tokenData.data);
}

export function usePushToken() {
  useEffect(() => {
    registerPushToken().catch(() => {
      // Silent failure — push notifications are non-critical
    });
  }, []);
}
