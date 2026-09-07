import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { COLORS, SPACING } from '@/constants';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { promptAsync, request } = useGoogleAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!displayName || !email || !password) return Alert.alert('Error', 'Please fill in all fields');
    if (password !== confirm) return Alert.alert('Error', 'Passwords do not match');
    if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, displayName.trim());
    } catch (err: any) {
      Alert.alert('Registration Failed', err?.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join DateNight and start planning</Text>

        <TextInput style={styles.input} placeholder="Your name" value={displayName}
          onChangeText={setDisplayName} placeholderTextColor={COLORS.textSecondary} />
        <TextInput style={styles.input} placeholder="Email" value={email}
          onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"
          autoCorrect={false} placeholderTextColor={COLORS.textSecondary} />
        <TextInput style={styles.input} placeholder="Password (8+ characters)" value={password}
          onChangeText={setPassword} secureTextEntry placeholderTextColor={COLORS.textSecondary} />
        <TextInput style={styles.input} placeholder="Confirm password" value={confirm}
          onChangeText={setConfirm} secureTextEntry placeholderTextColor={COLORS.textSecondary} />

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.googleButton}
          onPress={() => promptAsync()}
          disabled={!request}
        >
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By signing up, you agree to our{' '}
          <Text style={styles.legalLink}>Terms of Service</Text> and{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { flexGrow: 1, justifyContent: 'center', padding: SPACING.xl },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  subtitle: { fontSize: 16, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 12,
    padding: SPACING.md, marginBottom: SPACING.md,
    fontSize: 16, color: COLORS.text, backgroundColor: COLORS.surface,
  },
  button: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    padding: SPACING.md, alignItems: 'center', marginBottom: SPACING.md,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  legal: { textAlign: 'center', fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.sm },
  legalLink: { color: COLORS.primary },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: SPACING.md,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  googleButtonText: { color: '#333', fontSize: 16, fontWeight: '600' as const },
});
