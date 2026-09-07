import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { loginWithToken } = useAuth();
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '265703486967-4afi3ltmi5p8srd85gs06rhqsllp31h7.apps.googleusercontent.com',
    androidClientId: '265703486967-dr8qfsafbi0829ilats4ei7lgok17rot.apps.googleusercontent.com',
    webClientId: '265703486967-4krmr9fqc6su377v33od946jh6endhet.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        api
          .post('/api/auth/google', { idToken: id_token })
          .then((res) => loginWithToken(res.data))
          .catch(() => alert('Google sign-in failed'));
      }
    }
  }, [response]);

  return { promptAsync, request };
}
