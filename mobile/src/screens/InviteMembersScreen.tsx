/**
 * InviteMembersScreen — invite via Link, Email, SMS (native), or Username search
 * QR removed (low utility). SMS uses native Linking so no Twilio needed.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Clipboard,
  Linking,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';

import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPE, SHADOWS, RADII } from '@/constants';
import {
  DNText,
  DNButton,
  DNCard,
  DNSticker,
  DNAvatar,
  DNChip,
  DNInput,
  DNScreenHeader,
} from '@/components/ui';
import { invitationsAPI, groupsAPI, usersApi } from '@/services/api';
import type { Invitation, RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = NativeStackScreenProps<RootStackParamList, 'InviteMembers'>['route'];

type InviteMethod = 'LINK' | 'EMAIL' | 'SHARE' | 'USERNAME';
const METHODS: InviteMethod[] = ['LINK', 'EMAIL', 'SHARE', 'USERNAME'];

const METHOD_LABELS: Record<InviteMethod, string> = {
  LINK: 'Link',
  EMAIL: 'Email',
  SHARE: 'Share',
  USERNAME: 'Username',
};

// ─── Method card content ──────────────────────────────────────────────────────
function MethodCard({
  method,
  inviteUrl,
  groupId,
}: {
  method: InviteMethod;
  inviteUrl: string;
  groupId: string;
}) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);

  // Debounced username search
  useEffect(() => {
    if (username.trim().length < 2) { setSearchResults([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await usersApi.search(username.trim());
        setSearchResults(res.data);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [username]);

  const copyLink = useCallback(() => {
    Clipboard.setString(inviteUrl);
    Alert.alert('Copied!', 'Invite link copied to clipboard.');
  }, [inviteUrl]);

  const shareLink = useCallback(async () => {
    try {
      await Share.share({
        message: `Join my group on DateMeUp: ${inviteUrl}`,
        url: inviteUrl,
      });
    } catch {}
  }, [inviteUrl]);

  // SMS: open native Messages app with link pre-filled
  const sendSms = useCallback(async () => {
    const num = phone.trim().replace(/\s+/g, '');
    if (!num) return;
    const body = encodeURIComponent(`Join my group on DateMeUp: ${inviteUrl}`);
    const separator = Platform.OS === 'ios' ? '&' : '?';
    const url = `sms:${num}${separator}body=${body}`;
    const canOpen = await Linking.canOpenURL(url).catch(() => false);
    if (canOpen) {
      await Linking.openURL(url).catch(() =>
        Alert.alert('Could not open Messages', 'Please send the link manually.')
      );
    } else {
      // Fallback: just copy and alert
      Clipboard.setString(inviteUrl);
      Alert.alert(
        'Link copied',
        `We couldn't open Messages directly. The invite link has been copied — paste it into a text to ${num}.`
      );
    }
  }, [phone, inviteUrl]);

  return (
    <DNCard index={1} style={{ marginBottom: SPACING.md, overflow: 'visible' }}>
      {method === 'LINK' && (
        <>
          <DNSticker
            label="One Use"
            color={colors.primarySoft}
            textColor={colors.primary}
            rotationIndex={0}
            style={{ marginBottom: SPACING.sm }}
          />
          <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
            Share this link — it expires in 72 hours and can only be used once.
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: SPACING.sm }}>
            <View
              style={{
                flex: 1,
                backgroundColor: colors.bg,
                borderRadius: RADII.input,
                paddingHorizontal: SPACING.md,
                paddingVertical: 12,
              }}
            >
              <Text style={[TYPE.secondary, { color: colors.ink }]} numberOfLines={1}>
                {inviteUrl || 'Generating link…'}
              </Text>
            </View>
            <DNButton
              label="Copy"
              onPress={copyLink}
              variant="tonal"
              size="compact"
              disabled={!inviteUrl}
            />
          </View>
          <DNButton
            label="Share link"
            onPress={shareLink}
            variant="primary"
            disabled={!inviteUrl}
            style={{ width: '100%' }}
          />
        </>
      )}

      {method === 'EMAIL' && (
        <>
          <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
            Send an invite email to their address.
          </Text>
          <DNInput
            label="Email address"
            placeholder="friend@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <DNButton
            label="Send invite"
            onPress={async () => {
              if (!email.trim()) return;
              setSendLoading(true);
              try {
                await invitationsAPI.create(groupId, 'EMAIL', email.trim());
                setEmail('');
                Alert.alert('Invite sent!', `An invite was sent to ${email.trim()}.`);
              } catch {
                Alert.alert('Failed to send', 'Could not send the invite. Please try again.');
              } finally {
                setSendLoading(false);
              }
            }}
            variant="primary"
            loading={sendLoading}
            disabled={!email.trim()}
            style={{ width: '100%' }}
          />
        </>
      )}

      {method === 'SHARE' && (
        <>
          <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
            Share the invite link any way you like — Messages, WhatsApp, email, and more.
          </Text>
          <DNButton
            label="Share invite link"
            onPress={async () => {
              try {
                await Share.share({
                  message: `Join me on DateMeUp: ${inviteUrl}`,
                  url: inviteUrl,
                });
              } catch {
                Alert.alert('Could not open share sheet', 'Please use the Link tab to copy the invite.');
              }
            }}
            variant="primary"
            disabled={!inviteUrl}
            style={{ width: '100%' }}
          />
        </>
      )}

      {method === 'USERNAME' && (
        <>
          <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
            Search by username to invite.
          </Text>
          <DNInput
            label="Username"
            placeholder="@datenight_user"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          {searching && <Text style={[TYPE.secondary, { color: colors.ink2, marginBottom: 8 }]}>Searching…</Text>}
          {searchResults.map((u) => (
            <TouchableOpacity
              key={u.id}
              onPress={async () => {
                setSendLoading(true);
                try {
                  await invitationsAPI.create(groupId, 'USERNAME', u.id);
                  Alert.alert('Invite sent!', `${u.displayName} has been invited.`);
                  setUsername('');
                  setSearchResults([]);
                } catch {
                  Alert.alert('Failed', 'Could not send the invite. Please try again.');
                } finally { setSendLoading(false); }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}
            >
              <DNAvatar name={u.displayName} size={42} colorIndex={0} style={{ marginRight: 12 }} />
              <Text style={[TYPE.rowLabel, { color: colors.ink, flex: 1 }]}>{u.displayName}</Text>
              <Text style={[TYPE.secondary, { color: colors.primary }]}>Invite</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </DNCard>
  );
}

// ─── InviteMembersScreen ──────────────────────────────────────────────────────
export default function InviteMembersScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

  const { groupId } = route.params;

  const [method, setMethod] = useState<InviteMethod>('LINK');
  const [inviteUrl, setInviteUrl] = useState('');
  const [groupName, setGroupName] = useState('your group');
  const linkGeneratedRef = useRef(false);

  // Fetch real group name
  useEffect(() => {
    (async () => {
      try {
        const res = await groupsAPI.get(groupId);
        const g = res.data?.group ?? res.data;
        if (g?.name) setGroupName(g.name);
      } catch {}
    })();
  }, [groupId]);

  // Generate a link invitation once when the screen loads (needed for SMS + Link tabs)
  useEffect(() => {
    if (linkGeneratedRef.current) return;
    linkGeneratedRef.current = true;
    (async () => {
      try {
        const res = await invitationsAPI.create(groupId, 'LINK');
        const inv: Invitation = res.data?.invitation ?? res.data;
        if (inv?.inviteUrl) setInviteUrl(inv.inviteUrl);
      } catch {}
    })();
  }, [groupId]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <DNScreenHeader
        title={`Invite to ${groupName}`}
        subtitle="Link expires in 72 h"
        onBack={() => navigation.goBack()}
      />

      <View style={{ paddingHorizontal: SPACING.gutter }}>
        {/* Method chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.lg }}>
          {METHODS.map((m, i) => (
            <DNChip
              key={m}
              label={METHOD_LABELS[m]}
              selected={method === m}
              onPress={() => setMethod(m)}
              index={i}
            />
          ))}
        </View>

        {/* Method card */}
        <MethodCard
          method={method}
          inviteUrl={inviteUrl}
          groupId={groupId}
        />
      </View>
    </ScrollView>
  );
}
