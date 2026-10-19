/**
 * LoginScreen — DateNight v2 redesign (3a)
 * Teal + lime palette, Sora/DM Sans, asymmetric sticker shape language.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAppleAuth } from '@/hooks/useAppleAuth';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { TYPE, SPACING, SHADOWS } from '@/constants';
import { useTranslation } from 'react-i18next';
import { DNInput, DNButton } from '@/components/ui';
import { RootStackParamList } from '@/types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { login } = useAuth();
  const { promptAsync, request, error: googleError } = useGoogleAuth();
  const { signIn: appleSignIn, isAvailable: appleAvailable } = useAppleAuth();
  const { promptAsync: facebookPromptAsync, request: facebookRequest, error: facebookError } = useFacebookAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Show Google, Facebook, or local auth errors inline
  const displayError = error || googleError || facebookError || '';

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e?.response?.data?.error || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      await appleSignIn();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        setError(e?.message || 'Apple Sign In failed.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background blobs */}
      <View
        style={[
          styles.blobTL,
          {
            backgroundColor: colors.primarySoft,
          },
        ]}
      />
      <View
        style={[
          styles.blobMR,
          {
            backgroundColor: colors.limeSoft,
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + SPACING.xl, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View
            style={[
              styles.logoBlobOuter,
              { backgroundColor: colors.primary },
            ]}
          >
            <Text style={styles.logoEmoji}>📅</Text>
            {/* Lime heart badge */}
            <View
              style={[
                styles.heartBadge,
                { backgroundColor: colors.lime },
              ]}
            >
              <Text style={styles.heartEmoji}>♥</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={[TYPE.display, { color: colors.ink, textAlign: 'center', marginTop: SPACING.md }]}>
          DateMeUp!
        </Text>
        <Text style={[TYPE.body, { color: colors.ink2, textAlign: 'center', marginTop: SPACING.xs, marginBottom: SPACING.xl }]}>
          Plan together, decide together
        </Text>

        {/* Form */}
        <DNInput
          label={t('auth.email')}
          placeholder="you@example.com"
          value={email}
          onChangeText={(t) => { setEmail(t); setError(''); }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          autoComplete="email"
        />
        <DNInput
          label={t('auth.password')}
          placeholder="••••••••"
          value={password}
          onChangeText={(t) => { setPassword(t); setError(''); }}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />

        {/* Inline error */}
        {displayError ? (
          <Text style={[TYPE.secondary, { color: colors.error, marginBottom: SPACING.sm, marginTop: -SPACING.xs }]}>
            {displayError}
          </Text>
        ) : null}

        <DNButton
          label={t('auth.logIn')}
          onPress={handleLogin}
          loading={loading}
          style={{ marginTop: SPACING.sm, marginBottom: SPACING.lg }}
        />

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
          <Text style={[TYPE.secondary, { color: colors.ink2, marginHorizontal: SPACING.sm }]}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
        </View>

        {/* Google button */}
        <TouchableOpacity
          style={[
            styles.socialBtn,
            {
              backgroundColor: colors.surface,
              borderColor: colors.line,
              ...SHADOWS.card,
            },
          ]}
          onPress={() => promptAsync()}
          disabled={!request}
          activeOpacity={0.82}
        >
          <Text style={[styles.googleG, { color: '#4285F4' }]}>G</Text>
          <Text
            style={[
              { fontFamily: 'Sora_700Bold', fontSize: 15, color: colors.ink, marginLeft: SPACING.sm },
            ]}
          >
            {t('auth.continueWithGoogle')}
          </Text>
        </TouchableOpacity>

        {/* Apple button — iOS only */}
        {Platform.OS === 'ios' && appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={{ width: '100%', height: 50, marginBottom: SPACING.sm }}
            onPress={handleAppleSignIn}
          />
        )}

        {/* Facebook button — all platforms */}
        <TouchableOpacity
          style={[styles.socialBtn, styles.facebookBtn]}
          onPress={() => facebookPromptAsync()}
          disabled={!facebookRequest}
          activeOpacity={0.82}
        >
          <Text style={styles.facebookF}>f</Text>
          <Text
            style={{ fontFamily: 'Sora_700Bold', fontSize: 15, color: '#FFFFFF', marginLeft: SPACING.sm }}
          >
            {t('auth.continueWithFacebook')}
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Register')}
          style={{ marginTop: SPACING.lg, alignItems: 'center' }}
        >
          <Text style={[TYPE.secondary, { color: colors.ink2 }]}>
            {t('auth.noAccount')}{' '}
            <Text style={{ color: colors.primaryDeep, fontFamily: 'DMSans_600SemiBold' }}>
              {t('auth.signUp')}
            </Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { paddingHorizontal: SPACING.gutter, flexGrow: 1 },

  // Blobs
  blobTL: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 200,
    height: 200,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 60,
    borderBottomRightRadius: 120,
    borderBottomLeftRadius: 40,
    opacity: 0.9,
  },
  blobMR: {
    position: 'absolute',
    top: '35%',
    right: -50,
    width: 160,
    height: 160,
    borderTopLeftRadius: 80,
    borderTopRightRadius: 40,
    borderBottomRightRadius: 80,
    borderBottomLeftRadius: 60,
    opacity: 0.7,
  },

  // Logo
  logoArea: { alignItems: 'center', marginTop: SPACING.md },
  logoBlobOuter: {
    width: 72,
    height: 72,
    borderTopLeftRadius: 42,
    borderTopRightRadius: 26,
    borderBottomRightRadius: 42,
    borderBottomLeftRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  logoEmoji: { fontSize: 32 },
  heartBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartEmoji: { fontSize: 10, color: '#FFFFFF' },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  dividerLine: { flex: 1, height: 1 },

  // Social buttons
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  facebookBtn: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  googleG: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  facebookF: {
    fontFamily: 'Sora_700Bold',
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
