import * as Facebook from 'expo-auth-session/providers/facebook';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = '1748102416338228';

interface FacebookAuthState {
  loading: boolean;
  error: string | null;
}

export function useFacebookAuth() {
  const { loginWithToken } = useAuth();
  const [state, setState] = useState<FacebookAuthState>({ loading: false, error: null });

  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
  });

  useEffect(() => {
    if (!response) return;

    if (response.type === 'success') {
      const access_token = response.params?.access_token ?? response.authentication?.accessToken;
      if (__DEV__) {
        console.log('[FacebookAuth] success, access_token present:', !!access_token);
      }
      if (!access_token) {
        if (__DEV__) console.error('[FacebookAuth] No access_token in response:', response);
        setState({ loading: false, error: 'Facebook sign-in failed — no access token returned.' });
        return;
      }

      setState({ loading: true, error: null });

      // Exchange access token for user info via Graph API
      fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${access_token}`)
        .then((r) => r.json())
        .then((fbData: { id?: string; name?: string; email?: string; error?: unknown }) => {
          if (__DEV__) console.log('[FacebookAuth] Graph API response:', fbData);
          if (fbData.error || !fbData.id) {
            throw new Error('Invalid Facebook token — could not retrieve profile.');
          }
          return api.post('/api/auth/facebook', {
            accessToken: access_token,
            providerId: fbData.id,
            email: fbData.email,
            name: fbData.name,
          });
        })
        .then((res) => loginWithToken(res.data))
        .then(() => setState({ loading: false, error: null }))
        .catch((err: unknown) => {
          const e = err as { response?: { data?: { error?: string } }; message?: string };
          const msg = e?.response?.data?.error || e?.message || 'Facebook sign-in failed. Please try again.';
          if (__DEV__) console.error('[FacebookAuth] Error:', e);
          setState({ loading: false, error: msg });
        });
    } else if (response.type === 'error') {
      if (__DEV__) console.error('[FacebookAuth] OAuth error:', response.error);
      setState({ loading: false, error: 'Facebook sign-in failed. Please try again.' });
    } else if (response.type === 'cancel') {
      if (__DEV__) console.log('[FacebookAuth] User cancelled.');
      setState({ loading: false, error: null });
    }
  }, [response]);

  return {
    promptAsync,
    request,
    loading: state.loading,
    error: state.error,
    clearError: () => setState((s) => ({ ...s, error: null })),
  };
}
