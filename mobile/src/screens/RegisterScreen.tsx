/**
 * RegisterScreen — DateNight v2 redesign (3b)
 * Blob bg, back button, inline validation, Google+Apple social.
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAppleAuth } from '@/hooks/useAppleAuth';
import { useFacebookAuth } from '@/hooks/useFacebookAuth';
import { useTheme } from '@/contexts/ThemeContext';
import { TYPE, SPACING, SHADOWS } from '@/constants';
import { DNInput, DNButton, DNSticker } from '@/components/ui';
import { RootStackParamList } from '@/types';
import { useTranslation } from 'react-i18next';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { register } = useAuth();
  const { promptAsync, request, error: googleError } = useGoogleAuth();
  const { signIn: appleSignIn, isAvailable: appleAvailable } = useAppleAuth();
  const { promptAsync: facebookPromptAsync, request: facebookRequest, error: facebookError } = useFacebookAuth();
  const insets = useSafeAreaInsets();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string; email?: string; password?: string; general?: string }>({});

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!displayName.trim()) errs.displayName = t('register.nameRequired');
    if (!email.trim()) errs.email = t('register.emailRequired');
    else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) errs.email = t('register.validEmail');
    }
    if (!password) errs.password = t('register.passwordRequired');
    else if (password.length < 8) errs.password = t('register.passwordLength');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
      // After register, AppNavigator will redirect to Onboarding (if !hasOnboarded)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setErrors({ general: e?.response?.data?.error || t('register.failed') });
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
        setErrors({ general: e?.message || t('register.appleSignInFailed') });
      }
    }
  };

  const clearError = (field: keyof typeof errors) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Background blobs */}
      <View style={[styles.blobTL, { backgroundColor: colors.primarySoft }]} />
      <View style={[styles.blobMR, { backgroundColor: colors.limeSoft }]} />

      <ScrollView
        contentContainerStyle={[
          styles.inner,
          { paddingTop: insets.top + SPACING.md, paddingBottom: insets.bottom + SPACING.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surface, ...SHADOWS.card }]}
          activeOpacity={0.8}
        >
          <Text style={[styles.backArrow, { color: colors.ink }]}>‹</Text>
        </TouchableOpacity>

        {/* Title with inline sticker */}
        <View style={styles.titleRow}>
          <Text style={[TYPE.title, { color: colors.ink, flexShrink: 1 }]}>
            {t('register.title')}
          </Text>
          <DNSticker
            label="free"
            color={colors.lime}
            textColor="#101820"
            rotationIndex={1}
            style={{ marginLeft: SPACING.sm, marginTop: 4 }}
          />
        </View>

        <View style={{ height: SPACING.lg }} />

        {/* Inputs */}
        <DNInput
          label={t('register.displayNameLabel')}
          placeholder={t('register.displayNamePlaceholder')}
          value={displayName}
          onChangeText={(tx) => { setDisplayName(tx); clearError('displayName'); }}
          error={errors.displayName}
          autoCapitalize="words"
        />
        <DNInput
          label={t('auth.email')}
          placeholder={t('register.emailPlaceholder')}
          value={email}
          onChangeText={(tx) => { setEmail(tx); clearError('email'); }}
          error={errors.email}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <DNInput
          label={t('register.passwordLabel')}
          placeholder={t('register.passwordPlaceholder')}
          value={password}
          onChangeText={(tx) => { setPassword(tx); clearError('password'); }}
          error={errors.password}
          secureTextEntry
        />

        {/* General error */}
        {(errors.general || googleError || facebookError) ? (
          <Text style={[TYPE.secondary, { color: colors.error, marginBottom: SPACING.sm }]}>
            {errors.general || googleError || facebookError}
          </Text>
        ) : null}

        {/* Primary CTA */}
        <DNButton
          label={t('register.createAccount')}
          onPress={handleRegister}
          loading={loading}
          style={{ marginBottom: SPACING.lg }}
        />

        {/* Social row — side by side */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[
              styles.socialHalf,
              { backgroundColor: colors.surface, borderColor: colors.line, ...SHADOWS.card },
            ]}
            onPress={() => promptAsync()}
            disabled={!request}
            activeOpacity={0.82}
          >
            <Text style={[styles.googleG, { color: '#4285F4' }]}>G</Text>
            <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 13, color: colors.ink, marginLeft: 6 }}>
              Google
            </Text>
          </TouchableOpacity>

          {Platform.OS === 'ios' && appleAvailable && (
            <TouchableOpacity
              style={[styles.socialHalf, styles.appleHalf]}
              onPress={handleAppleSignIn}
              activeOpacity={0.82}
            >
              <Text style={{ fontSize: 16, color: '#FFFFFF' }}></Text>
              <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 13, color: '#FFFFFF', marginLeft: 6 }}>
                Apple
              </Text>
            </TouchableOpacity>
          )}

          {/* Facebook — all platforms */}
          <TouchableOpacity
            style={[styles.socialHalf, styles.facebookHalf]}
            onPress={() => facebookPromptAsync()}
            disabled={!facebookRequest}
            activeOpacity={0.82}
          >
            <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 16, fontWeight: '700', color: '#FFFFFF' }}>f</Text>
            <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 13, color: '#FFFFFF', marginLeft: 6 }}>
              Facebook
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Login')}
          style={{ marginTop: SPACING.lg, alignItems: 'center' }}
        >
          <Text style={[TYPE.secondary, { color: colors.ink2 }]}>
            {t('auth.hasAccount')}{' '}
            <Text style={{ color: colors.primaryDeep, fontFamily: 'DMSans_600SemiBold' }}>
              {t('auth.logIn')}
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

  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  backArrow: { fontSize: 24, lineHeight: 28, marginTop: -2 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },

  socialRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  socialHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: SPACING.sm,
  },
  appleHalf: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  facebookHalf: {
    backgroundColor: '#1877F2',
    borderColor: '#1877F2',
  },
  googleG: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    fontWeight: '700',
  },
});
