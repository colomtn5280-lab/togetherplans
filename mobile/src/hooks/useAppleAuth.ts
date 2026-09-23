import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { useState } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export function useAppleAuth() {
  const { loginWithToken } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Apple Sign In is iOS-only
  const isAvailable = Platform.OS === 'ios';

  const signIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const displayName = [
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      ]
        .filter(Boolean)
        .join(' ')
        .trim() || undefined;

      const res = await api.post('/api/auth/apple', {
        identityToken: credential.identityToken,
        email: credential.email,       // only present on first sign-in
        displayName,                   // only present on first sign-in
      });

      await loginWithToken(res.data);
    } catch (err: unknown) {
      const e = err as { code?: string; response?: { data?: { error?: string } }; message?: string };
      // ERR_REQUEST_CANCELED means user dismissed the sheet — not a real error
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        const msg = e?.response?.data?.error || e?.message || 'Apple Sign In failed. Please try again.';
        setError(msg);
        throw err; // re-throw so callers can also handle (e.g. to check code)
      }
    } finally {
      setLoading(false);
    }
  };

  return { signIn, isAvailable, error, loading };
}
