import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { api } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

export function useAppleAuth() {
  const { loginWithToken } = useAuth();

  // Apple Sign In is iOS-only
  const isAvailable = Platform.OS === 'ios';

  const signIn = async () => {
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
  };

  return { signIn, isAvailable };
}
