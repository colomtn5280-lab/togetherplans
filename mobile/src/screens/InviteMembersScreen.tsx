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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
    Alert.alert(t('inviteMembers.copied'), t('inviteMembers.linkCopiedToClipboard'));
  }, [inviteUrl, t]);

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
        Alert.alert(t('inviteMembers.couldNotMessages'), t('inviteMembers.sendManually'))
      );
    } else {
      // Fallback: just copy and alert
      Clipboard.setString(inviteUrl);
      Alert.alert(
        t('inviteMembers.copied'),
        `We couldn't open Messages directly. The invite link has been copied — paste it into a text to ${num}.`
      );
    }
  }, [phone, inviteUrl, t]);

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
            {t('inviteMembers.linkExpiry')}
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
                {inviteUrl || t('inviteMembers.generatingLink')}
              </Text>
            </View>
            <DNButton
              label={t('inviteMembers.copy')}
              onPress={copyLink}
              variant="tonal"
              size="compact"
              disabled={!inviteUrl}
            />
          </View>
          <DNButton
            label={t('inviteMembers.shareLink')}
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
            {t('inviteMembers.emailInviteBody')}
          </Text>
          <DNInput
            label={t('auth.email')}
            placeholder="friend@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <DNButton
            label={t('inviteMembers.sendInvite')}
            onPress={async () => {
              if (!email.trim()) return;
              setSendLoading(true);
              try {
                await invitationsAPI.create(groupId, 'EMAIL', email.trim());
                setEmail('');
                Alert.alert(t('inviteMembers.inviteSent'), t('inviteMembers.inviteSentTo', { email: email.trim() }));
              } catch {
                Alert.alert(t('inviteMembers.failedSend'), t('inviteMembers.couldNotSend'));
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
            {t('inviteMembers.shareAnyWay')}
          </Text>
          <DNButton
            label={t('inviteMembers.shareInviteLink')}
            onPress={async () => {
              try {
                await Share.share({
                  message: `Join me on DateMeUp: ${inviteUrl}`,
                  url: inviteUrl,
                });
              } catch {
                Alert.alert(t('inviteMembers.couldNotShare'), t('inviteMembers.copyToUse'));
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
            {t('inviteMembers.searchByUsername')}
          </Text>
          <DNInput
            label="Username"
            placeholder="@datenight_user"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          {searching && <Text style={[TYPE.secondary, { color: colors.ink2, marginBottom: 8 }]}>{t('inviteMembers.searching')}</Text>}
          {searchResults.map((u) => (
            <TouchableOpacity
              key={u.id}
              onPress={async () => {
                setSendLoading(true);
                try {
                  await invitationsAPI.create(groupId, 'USERNAME', u.id);
                  Alert.alert(t('inviteMembers.inviteSent'), t('inviteMembers.hasBeenInvited', { name: u.displayName }));
                  setUsername('');
                  setSearchResults([]);
                } catch {
                  Alert.alert(t('inviteMembers.failed'), t('inviteMembers.couldNotSend'));
                } finally { setSendLoading(false); }
              }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line }}
            >
              <DNAvatar name={u.displayName} size={42} colorIndex={0} style={{ marginRight: 12 }} />
              <Text style={[TYPE.rowLabel, { color: colors.ink, flex: 1 }]}>{u.displayName}</Text>
              <Text style={[TYPE.secondary, { color: colors.primary }]}>{t('inviteMembers.invite')}</Text>
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
  const { t } = useTranslation();
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
        title={`${t('groups.invite')} ${groupName}`}
        subtitle={t('inviteMembers.subtitle')}
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
