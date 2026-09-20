/**
 * InviteMembersScreen — §3g invite methods + §3h QR modal
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Clipboard,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';

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
import { invitationsAPI } from '@/services/api';
import type { Invitation, RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = NativeStackScreenProps<RootStackParamList, 'InviteMembers'>['route'];

type InviteMethod = 'LINK' | 'EMAIL' | 'SMS' | 'USERNAME' | 'QR';
const METHODS: InviteMethod[] = ['LINK', 'EMAIL', 'SMS', 'USERNAME', 'QR'];

const METHOD_LABELS: Record<InviteMethod, string> = {
  LINK: 'Link',
  EMAIL: 'Email',
  SMS: 'SMS',
  USERNAME: 'Username',
  QR: 'QR',
};

// ─── QR Modal ─────────────────────────────────────────────────────────────────
function QRModal({
  visible,
  onClose,
  groupName,
  inviteUrl,
}: {
  visible: boolean;
  onClose: () => void;
  groupName: string;
  inviteUrl: string;
}) {
  const { colors } = useTheme();
  const prevBrightness = useRef<number>(0.5);

  useEffect(() => {
    if (!visible) return;

    let restored = false;
    (async () => {
      try {
        const { granted } = await Brightness.requestPermissionsAsync();
        if (granted) {
          prevBrightness.current = await Brightness.getBrightnessAsync();
          await Brightness.setBrightnessAsync(1.0);
        }
      } catch {}
    })();

    return () => {
      if (!restored) {
        restored = true;
        Brightness.setBrightnessAsync(prevBrightness.current).catch(() => {});
      }
    };
  }, [visible]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: inviteUrl, url: inviteUrl });
    } catch {}
  }, [inviteUrl]);

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.primary }}>
        {/* Blob 1 */}
        <View
          style={{
            position: 'absolute',
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: 'rgba(255,255,255,0.15)',
            top: -80,
            right: -60,
          }}
        />
        {/* Blob 2 */}
        <View
          style={{
            position: 'absolute',
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'rgba(255,255,255,0.1)',
            bottom: 80,
            left: -50,
          }}
        />

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            position: 'absolute',
            top: 60,
            right: SPACING.gutter,
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          <Text style={{ color: colors.onPrimary, fontSize: 20 }}>✕</Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.gutter }}>
          <Text
            style={[TYPE.title, { color: colors.onPrimary, textAlign: 'center', marginBottom: SPACING.xl }]}
          >
            Scan to join{'\n'}{groupName}
          </Text>

          {/* QR card — rotated -2deg */}
          <View
            style={{
              transform: [{ rotate: '-2deg' }],
              position: 'relative',
              marginBottom: SPACING.lg,
            }}
          >
            <View
              style={{
                width: 280,
                height: 280,
                backgroundColor: colors.onPrimary,
                borderRadius: RADII.qrCard,
                alignItems: 'center',
                justifyContent: 'center',
                padding: SPACING.md,
                ...SHADOWS.card,
              }}
            >
              <QRCode value={inviteUrl || 'https://togetherplans.app'} size={220} />
            </View>

            {/* 72H sticker */}
            <DNSticker
              label="72 H"
              color={colors.lime}
              textColor={colors.ink}
              rotationIndex={1}
              style={{
                position: 'absolute',
                bottom: -10,
                right: -10,
                zIndex: 10,
              }}
            />
          </View>

          {/* URL */}
          <Text
            style={[
              TYPE.secondary,
              { color: colors.onPrimary, fontFamily: 'DMSans_400Regular', opacity: 0.8, marginBottom: SPACING.lg, textAlign: 'center' },
            ]}
            numberOfLines={2}
          >
            {inviteUrl}
          </Text>

          {/* Share link button */}
          <DNButton
            label="Share link instead"
            onPress={handleShare}
            variant="secondary"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              borderColor: colors.onPrimary,
              borderWidth: 1.5,
              width: '100%',
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

// ─── Method card content ──────────────────────────────────────────────────────
function MethodCard({
  method,
  inviteUrl,
  groupId,
  onShowQR,
}: {
  method: InviteMethod;
  inviteUrl: string;
  groupId: string;
  onShowQR: () => void;
}) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [searchResults] = useState<{ id: string; name: string }[]>([]);
  const [sendLoading, setSendLoading] = useState(false);

  const copyLink = useCallback(() => {
    Clipboard.setString(inviteUrl);
    Alert.alert('Copied!', 'Invite link copied to clipboard.');
  }, [inviteUrl]);

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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
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
        </>
      )}

      {method === 'EMAIL' && (
        <>
          <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
            Send an invite to their email address.
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

      {method === 'SMS' && (
        <>
          <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
            Text them an invite link.
          </Text>
          <DNInput
            label="Phone number"
            placeholder="+1 555 000 0000"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <DNButton
            label="Send text"
            onPress={async () => {
              if (!phone.trim()) return;
              setSendLoading(true);
              try {
                await invitationsAPI.create(groupId, 'SMS', phone.trim());
                setPhone('');
                Alert.alert('Invite sent!', `A text invite was sent to ${phone.trim()}.`);
              } catch {
                Alert.alert('Failed to send', 'Could not send the invite. Please try again.');
              } finally {
                setSendLoading(false);
              }
            }}
            variant="primary"
            loading={sendLoading}
            disabled={!phone.trim()}
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
          {searchResults.map((u) => (
            <TouchableOpacity
              key={u.id}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
            >
              <DNAvatar name={u.name} size={42} colorIndex={0} style={{ marginRight: 12 }} />
              <Text style={[TYPE.rowLabel, { color: colors.ink }]}>{u.name}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {method === 'QR' && (
        <>
          <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
            Show this QR code for someone to scan with their camera.
          </Text>
          <DNButton
            label="Show QR code"
            onPress={onShowQR}
            variant="primary"
            style={{ width: '100%' }}
          />
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
  const [pendingInvites] = useState<Invitation[]>([]);
  const [qrVisible, setQrVisible] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await invitationsAPI.create(groupId, 'LINK');
        const inv: Invitation = res.data?.invitation ?? res.data;
        if (inv?.inviteUrl) setInviteUrl(inv.inviteUrl);
      } catch {}
    })();
  }, [groupId]);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <DNScreenHeader
          title={`Invite to ${groupName}`}
          subtitle="Expires in 72 h"
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
            onShowQR={() => setQrVisible(true)}
          />

          {/* Pending invitations */}
          {pendingInvites.length > 0 && (
            <>
              <Text style={[TYPE.section, { color: colors.ink2, marginBottom: 8, marginTop: SPACING.md }]}>
                Pending invitations
              </Text>
              {pendingInvites.map((inv) => (
                <View
                  key={inv.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    padding: 12,
                    marginBottom: 8,
                    ...SHADOWS.card,
                  }}
                >
                  <Text style={[TYPE.rowLabel, { color: colors.ink }]}>
                    {inv.target ?? 'Link invite'}
                  </Text>
                  <DNSticker
                    label="Pending"
                    color={colors.warningSoft}
                    textColor={colors.onWarningSoft}
                    size="sm"
                    rotationIndex={2}
                  />
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* QR Modal */}
      <QRModal
        visible={qrVisible}
        onClose={() => setQrVisible(false)}
        groupName={groupName}
        inviteUrl={inviteUrl || `https://togetherplans.app/join/${groupId}`}
      />
    </>
  );
}
