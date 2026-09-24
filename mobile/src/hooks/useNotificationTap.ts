import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/types';

/**
 * Routes push-notification taps to the right screen.
 *
 * All TogetherPlans pushes (vote reminders, nudges, holdout, tomorrow-hype,
 * guest-vote alerts) carry `data: { proposalId }` — tapping any of them lands
 * on the ProposalDetail screen. Handles both warm taps (listener) and the
 * cold-start tap that launched the app (last response).
 *
 * Must be rendered INSIDE NavigationContainer (it uses useNavigation).
 */
export function useNotificationTap() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  useEffect(() => {
    const navigateFromResponse = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification?.request?.content?.data as
        | { proposalId?: string }
        | undefined;
      if (data?.proposalId) {
        navigation.navigate('ProposalDetail', { proposalId: data.proposalId });
      }
    };

    // Tap while app is foregrounded/backgrounded
    const sub = Notifications.addNotificationResponseReceivedListener(navigateFromResponse);

    // Tap that cold-started the app
    Notifications.getLastNotificationResponseAsync()
      .then(navigateFromResponse)
      .catch(() => {
        // Non-critical — ignore
      });

    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
