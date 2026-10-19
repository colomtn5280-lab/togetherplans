/**
 * WelcomeScreen — DateMeUp v2 (spec: 3a)
 * First screen in the unauthenticated flow — social login entry point.
 * Design: teal + lime palette, asymmetric sticker shape language, Sora / DM Sans.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { useAppleAuth } from '@/hooks/useAppleAuth';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants';
import { RootStackParamList } from '@/types';
import { useTranslation } from 'react-i18next';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { promptAsync, request } = useGoogleAuth();
  const { signIn: appleSignIn, isAvailable: appleAvailable } = useAppleAuth();

  const [error, setError] = useState('');

  const handleAppleSignIn = async () => {
    try {
      await appleSignIn();
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        setError(e?.message || t('register.appleSignInFailed'));
      }
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Decorative blobs — absolute positioned */}
      <View
        style={[
          styles.blobTL,
          { backgroundColor: colors.primarySoft },
        ]}
      />
      <View
        style={[
          styles.blobMR,
          { backgroundColor: colors.limeSoft },
        ]}
      />

      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.inner}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo blob */}
          <View style={styles.logoArea}>
            <View
              style={[
                styles.logoBlobOuter,
                { backgroundColor: colors.primary },
              ]}
            >
              <Image
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                source={require('../../assets/icon.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
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

          {/* App name + subtitle */}
          <Text
            style={[
              styles.appName,
              { color: colors.ink },
            ]}
          >
            datemeup
          </Text>
          <Text
            style={[
              styles.subtitle,
              { color: colors.ink2 },
            ]}
          >
            {t('welcome.subtitle')}
          </Text>

          {/* Spacer */}
          <View style={styles.spacer} />

          {/* Buttons */}
          <View style={styles.buttonGroup}>
            {/* Apple Sign-In — iOS only */}
            {Platform.OS === 'ios' && appleAvailable && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={{ width: '100%', height: 50 }}
                onPress={handleAppleSignIn}
              />
            )}

            {/* Google Sign-In */}
            <TouchableOpacity
              style={[
                styles.googleBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.line,
                },
              ]}
              onPress={handleGoogleSignIn}
              disabled={!request}
              activeOpacity={0.85}
            >
              <Text style={[styles.googleG, { color: '#4285F4' }]}>G</Text>
              <Text
                style={[styles.googleBtnText, { color: colors.ink }]}
              >
                {t('auth.continueWithGoogle')}
              </Text>
            </TouchableOpacity>

            {/* Sign up with email */}
            <TouchableOpacity
              style={[
                styles.emailBtn,
                { backgroundColor: colors.primarySoft },
              ]}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text
                style={[styles.emailBtnText, { color: colors.primary }]}
              >
                {t('auth.continueWithEmail')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Error */}
          {error ? (
            <Text
              style={[styles.errorText, { color: colors.error }]}
            >
              {error}
            </Text>
          ) : null}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.ink2 }]}>
              {t('auth.hasAccount')}{' '}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[styles.loginLink, { color: colors.primary }]}
              >
                {t('auth.logIn')}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  inner: {
    flexGrow: 1,
    paddingHorizontal: SPACING.gutter,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xl,
    alignItems: 'center',
  },

  // Decorative background blobs
  blobTL: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 999,
    opacity: 0.7,
  },
  blobMR: {
    position: 'absolute',
    top: '35%',
    right: -40,
    width: 220,
    height: 220,
    borderRadius: 999,
    opacity: 0.7,
  },

  // Logo
  logoArea: { alignItems: 'center', marginBottom: SPACING.md },
  logoBlobOuter: {
    width: 80,
    height: 80,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  logoImage: { width: 52, height: 52 },
  heartBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartEmoji: { fontSize: 12, color: '#FFFFFF' },

  // Headline
  appName: {
    fontFamily: 'Sora_800ExtraBold',
    fontSize: 40,
    letterSpacing: -1.6,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  subtitle: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },

  spacer: { height: SPACING.xl },

  // Button group
  buttonGroup: {
    width: '100%',
    paddingHorizontal: 0,
    gap: 12,
  },

  // Apple button — REMOVED (using AppleAuthenticationButton)

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 28,
    borderWidth: 1.5,
    gap: SPACING.sm,
  },
  googleG: {
    fontFamily: 'Sora_700Bold',
    fontSize: 18,
    fontWeight: '700',
  },
  googleBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 15,
  },

  // Email button
  emailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 20,
  },
  emailBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
  },

  // Error
  errorText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    flexWrap: 'wrap',
  },
  footerText: {
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
  },
  loginLink: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
  },
});
