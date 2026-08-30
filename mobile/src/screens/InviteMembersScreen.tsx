import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Share,
  StyleSheet, ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { invitationsAPI } from '@/services/api';
import { RootStackParamList } from '@/types';
import { COLORS, SPACING, INVITE_METHODS, InviteMethod } from '@/constants';

type Props = { route: RouteProp<RootStackParamList, 'InviteMembers'> };

export default function InviteMembersScreen({ route }: Props) {
  const { groupId } = route.params;
  const [method, setMethod] = useState<InviteMethod>('LINK');
  const [target, setTarget] = useState('');
  const [loading, setLoading] = useState(false);

  const needsTarget = ['EMAIL', 'SMS', 'USERNAME'].includes(method);

  const handleInvite = async () => {
    if (needsTarget && !target.trim()) {
      return Alert.alert('Error', `Please enter a ${method.toLowerCase()} to invite`);
    }
    setLoading(true);
    try {
      const res = await invitationsAPI.create(groupId, method, target.trim() || undefined);
      const { inviteUrl, token } = res.data;
      const shareUrl = `https://togetherplans.app/invite/${token}`;

      if (method === 'LINK' || method === 'QR') {
        await Share.share({ message: `Join my DateNight plan! ${shareUrl}`, url: shareUrl });
      } else {
        Alert.alert('Invitation Sent!', `${method === 'EMAIL' ? 'Email' : method === 'SMS' ? 'SMS' : 'Invite'} sent to ${target}`);
        setTarget('');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Could not send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.sectionTitle}>Invite Method</Text>
      <View style={styles.methodGrid}>
        {INVITE_METHODS.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.methodBtn, method === m && styles.methodBtnActive]}
            onPress={() => { setMethod(m); setTarget(''); }}
          >
            <Text style={[styles.methodBtnText, method === m && styles.methodBtnTextActive]}>
              {m === 'LINK' ? '🔗 Link' : m === 'EMAIL' ? '📧 Email' : m === 'SMS' ? '💬 SMS' : m === 'QR' ? '📱 QR' : '👤 Username'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {needsTarget && (
        <>
          <Text style={styles.label}>
            {method === 'EMAIL' ? 'Email address' : method === 'SMS' ? 'Phone number' : 'Username'}
          </Text>
          <TextInput
            style={styles.input}
            placeholder={method === 'EMAIL' ? 'friend@example.com' : method === 'SMS' ? '+1 555 000 0000' : '@username'}
            value={target}
            onChangeText={setTarget}
            keyboardType={method === 'EMAIL' ? 'email-address' : method === 'SMS' ? 'phone-pad' : 'default'}
            autoCapitalize="none"
            placeholderTextColor={COLORS.textSecondary}
          />
        </>
      )}

      {(method === 'LINK' || method === 'QR') && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            {method === 'LINK'
              ? 'A shareable link will be generated. Anyone with this link can join your group.'
              : 'A shareable link will be generated for QR display. Share it with your guests.'}
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={handleInvite} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Invitation</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  inner: { padding: SPACING.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.lg },
  methodBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.surface },
  methodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  methodBtnText: { color: COLORS.text, fontWeight: '500' },
  methodBtnTextActive: { color: '#fff' },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.xs },
  input: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: SPACING.md, fontSize: 16, color: COLORS.text, backgroundColor: COLORS.surface, marginBottom: SPACING.md },
  infoBox: { backgroundColor: '#FFF3E0', borderRadius: 10, padding: SPACING.md, marginBottom: SPACING.md },
  infoText: { color: '#E65100', fontSize: 14 },
  button: { backgroundColor: COLORS.primary, borderRadius: 12, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.md },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
