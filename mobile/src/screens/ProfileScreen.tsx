import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator, Linking,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { authAPI } from '@/services/api';
import { COLORS, SPACING } from '@/constants';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); } },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data within 30 days. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await authAPI.deleteAccount();
              await logout();
            } catch {
              Alert.alert('Error', 'Could not delete account. Please contact hello@togetherplans.app');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.displayName?.[0]?.toUpperCase() ?? '?'}</Text>
      </View>
      <Text style={styles.name}>{user?.displayName}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://api.togetherplans.app/privacy')}>
          <Text style={styles.rowText}>Privacy Policy</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('https://api.togetherplans.app/terms')}>
          <Text style={styles.rowText}>Terms of Service</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <TouchableOpacity style={styles.row} onPress={() => Linking.openURL('mailto:hello@togetherplans.app')}>
          <Text style={styles.rowText}>Contact Us</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.error} /> : <Text style={styles.deleteText}>Delete Account</Text>}
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>DateNight v1.0.0 · togetherplans.app</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING.lg, alignItems: 'center' },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, marginTop: SPACING.xl },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  email: { fontSize: 15, color: COLORS.textSecondary, marginBottom: SPACING.xl },
  section: { width: '100%', marginBottom: SPACING.lg },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SPACING.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.surface, padding: SPACING.md, borderRadius: 12, marginBottom: 2, borderWidth: 1, borderColor: COLORS.border },
  rowText: { fontSize: 16, color: COLORS.text },
  arrow: { fontSize: 20, color: COLORS.textSecondary },
  logoutBtn: { backgroundColor: COLORS.surface, borderRadius: 12, padding: SPACING.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.sm },
  logoutText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  deleteBtn: { padding: SPACING.md, alignItems: 'center' },
  deleteText: { fontSize: 15, color: COLORS.error },
  version: { fontSize: 12, color: COLORS.textSecondary, marginTop: SPACING.xl },
});
