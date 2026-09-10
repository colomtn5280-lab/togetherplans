import { useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { invitationsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

/** Extracts an invite token from URLs like:
 *  togetherplans://join/TOKEN
 *  https://togetherplans.app/join/TOKEN
 *  https://api.togetherplans.app/join/TOKEN
 */
function parseInviteToken(url: string): string | null {
  const match = url.match(/\/join\/([^/?#]+)/);
  return match ? match[1] : null;
}

export function useDeepLink() {
  const { user } = useAuth();

  const handleUrl = useCallback(
    async (url: string) => {
      const token = parseInviteToken(url);
      if (!token) return;

      if (!user) {
        // User opened an invite link but isn't logged in — store nothing for now;
        // they'll need to log in first. Could be extended to store the pending token.
        Alert.alert(
          'Invite Link',
          'Please log in or create an account to accept this invitation.',
        );
        return;
      }

      try {
        await invitationsAPI.accept(token);
        Alert.alert('Success', 'You joined the group!');
      } catch (err: unknown) {
        const msg =
          err &&
          typeof err === 'object' &&
          'response' in err &&
          (err as { response?: { data?: { error?: string } } }).response?.data?.error
            ? (err as { response: { data: { error: string } } }).response.data.error
            : 'Could not accept the invitation. It may have expired or already been used.';
        Alert.alert('Invite Error', msg);
      }
    },
    [user],
  );

  // Handle deep links while app is open
  useEffect(() => {
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });
    return () => subscription.remove();
  }, [handleUrl]);

  // Handle deep link that launched the app (cold start)
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    // Only run once on mount — intentional empty deps would re-run on every
    // handleUrl change, so we disable the rule here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
