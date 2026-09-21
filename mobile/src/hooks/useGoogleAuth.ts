import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { loginWithToken } = useAuth();

  // expo-auth-session/providers/google automatically selects the correct
  // redirect URI per platform using the reverse client ID scheme for native:
  //   Android: com.googleusercontent.apps.<id>:/oauth2redirect/google
  //   iOS:     com.googleusercontent.apps.<id>:/oauth2redirect/google
  // This must match what is registered in Google Cloud Console.
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: '265703486967-4afi3ltmi5p8srd85gs06rhqsllp31h7.apps.googleusercontent.com',
    androidClientId: '265703486967-dr8qfsafbi0829ilats4ei7lgok17rot.apps.googleusercontent.com',
    webClientId: '265703486967-4krmr9fqc6su377v33od946jh6endhet.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const id_token = response.params?.id_token;
      if (__DEV__) {
        console.log('[GoogleAuth] success, id_token present:', !!id_token);
      }
      if (!id_token) {
        if (__DEV__) console.error('[GoogleAuth] No id_token in response params:', response.params);
        return;
      }
      api
        .post('/api/auth/google', { idToken: id_token })
        .then((res) => loginWithToken(res.data))
        .catch((err: unknown) => {
          const e = err as { response?: { data?: { error?: string } }; message?: string };
          const msg = e?.response?.data?.error || e?.message || 'Google sign-in failed. Please try again.';
          if (__DEV__) console.error('[GoogleAuth] Backend error:', e);
          // Surface to caller via a thrown error so screens can catch and display
          throw new Error(msg);
        });
    } else if (response.type === 'error') {
      if (__DEV__) console.error('[GoogleAuth] OAuth error:', response.error);
    } else if (response.type === 'cancel') {
      if (__DEV__) console.log('[GoogleAuth] User cancelled.');
    }
  }, [response]);

  return { promptAsync, request };
}
