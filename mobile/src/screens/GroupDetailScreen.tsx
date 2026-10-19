/**
 * GroupDetailScreen — §3e (populated) + §4d (empty / no other members)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPE, SHADOWS, COLORS } from '@/constants';
import {
  DNText,
  DNButton,
  DNCard,
  DNSticker,
  DNAvatar,
  DNScreenHeader,
} from '@/components/ui';
import { groupsAPI, invitationsAPI, safetyAPI } from '@/services/api';
import type { Group, Proposal, RootStackParamList } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = NativeStackScreenProps<RootStackParamList, 'GroupDetail'>['route'];

// ─── Active proposal card ─────────────────────────────────────────────────────
function ActiveProposalCard({
  proposal,
  index,
  totalMembers,
  onPress,
}: {
  proposal: Proposal;
  index: number;
  totalMembers: number;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const voted = proposal.votes?.length ?? 0;
  const progress = totalMembers > 0 ? voted / totalMembers : 0;
  const isCountered = proposal.status === 'COUNTERED';

  return (
    <DNCard index={index} onPress={onPress} style={{ marginBottom: SPACING.md, overflow: 'visible' }}>
      <DNSticker
        label={isCountered ? 'Countered' : t('proposal.open')}
        color={isCountered ? colors.warningSoft : colors.primarySoft}
        textColor={isCountered ? colors.onWarningSoft : colors.primary}
        rotationIndex={index}
        style={{ marginBottom: SPACING.sm }}
      />
      <Text style={[TYPE.heading, { color: colors.ink, marginBottom: 4 }]}>
        {proposal.title}
      </Text>
      {proposal.scheduledFor && (
        <Text style={[TYPE.secondary, { color: colors.ink2, marginBottom: 12 }]}>
          {proposal.scheduledFor}
        </Text>
      )}
      {/* Lime progress bar */}
      <View
        style={{
          height: 6,
          backgroundColor: colors.line,
          borderRadius: 3,
          marginBottom: 6,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            height: 6,
            backgroundColor: colors.lime,
            borderRadius: 3,
            width: `${Math.round(progress * 100)}%`,
          }}
        />
      </View>
      <Text style={[TYPE.secondary, { color: colors.ink2 }]}>
        {voted} / {totalMembers} {t('groupDetail.voted')}
      </Text>
    </DNCard>
  );
}

// ─── Past proposal row ────────────────────────────────────────────────────────
function PastProposalRow({
  item,
}: {
  item: Proposal;
}) {
  const { colors } = useTheme();
  const isCancelled = item.status === 'CANCELLED';
  const isCountered = item.status === 'COUNTERED';
  const isDecided = item.status === 'DECIDED';

  return (
    <View
      style={{
        opacity: isCancelled ? 0.5 : isCountered ? 0.7 : 1,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!isCancelled && (
          <DNSticker
            label={isDecided ? 'Decided' : 'Countered'}
            color={isDecided ? colors.limeSoft : colors.warningSoft}
            textColor={isDecided ? colors.lime : colors.onWarningSoft}
            size="sm"
            rotationIndex={isDecided ? 1 : 2}
            style={{ marginRight: 8 }}
          />
        )}
        <Text
          style={[
            TYPE.rowLabel,
            {
              color: colors.ink,
              textDecorationLine: isCountered ? 'line-through' : 'none',
              flex: 1,
            },
          ]}
        >
          {item.title}
        </Text>
      </View>
    </View>
  );
}

// ─── Empty state (no other members) — §4d ─────────────────────────────────────
function EmptyGroupState({
  group,
  onShare,
}: {
  group: Group;
  onShare: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={{ paddingHorizontal: SPACING.gutter, paddingTop: SPACING.lg }}>
      {/* Pending partner avatar */}
      <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
        <DNAvatar pending size={54} />
      </View>

      {/* Step 1 card — lime border */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 2,
          borderColor: colors.lime,
          padding: SPACING.md,
          marginBottom: SPACING.md,
          ...SHADOWS.card,
        }}
      >
        <Text style={[TYPE.heading, { color: colors.ink, marginBottom: SPACING.sm }]}>
          {t('groupDetail.inviteSomeone')}
        </Text>
        <Text style={[TYPE.body, { color: colors.ink2, marginBottom: SPACING.md }]}>
          {t('groupDetail.shareGroupLink')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.md }}>
          {['Share', 'Text', 'Email', 'QR'].map((method, i) => (
            <TouchableOpacity
              key={method}
              onPress={onShare}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                backgroundColor: colors.primarySoft,
                borderRadius: 16,
              }}
            >
              <Text style={[TYPE.buttonSm, { color: colors.primary }]}>{method}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Step 2 card — dashed, 75% opacity */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderRadius: 20,
          borderWidth: 1.5,
          borderColor: colors.line,
          borderStyle: 'dashed',
          padding: SPACING.md,
          opacity: 0.75,
          ...SHADOWS.card,
        }}
      >
        <Text style={[TYPE.heading, { color: colors.ink, marginBottom: SPACING.sm }]}>
          {t('groupDetail.firstProposal')}
        </Text>
        <DNButton
          label={t('groupDetail.addFirstProposal')}
          onPress={() => {}}
          variant="tonal"
          style={{ width: '100%' }}
        />
      </View>
    </View>
  );
}

// ─── GroupDetailScreen ────────────────────────────────────────────────────────
export default function GroupDetailScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { user } = useAuth();

  const { groupId, groupName } = route.params;

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeProposals, setActiveProposals] = useState<Proposal[]>([]);
  const [pastProposals, setPastProposals] = useState<Proposal[]>([]);

  const loadGroup = useCallback(async () => {
    try {
      const res = await groupsAPI.get(groupId);
      setGroup(res.data?.group ?? res.data ?? null);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  const loadProposals = useCallback(async () => {
    try {
      const res = await groupsAPI.proposals(groupId);
      const proposals: Proposal[] = res.data?.proposals ?? res.data ?? [];
      setActiveProposals(proposals.filter((p) => p.status === 'OPEN' || p.status === 'COUNTERED'));
      setPastProposals(proposals.filter((p) => p.status === 'DECIDED' || p.status === 'CANCELLED'));
    } catch {
      // silently fail — leave empty
    }
  }, [groupId]);

  useEffect(() => {
    loadGroup();
    loadProposals();
  }, [loadGroup, loadProposals]);

  const members = group?.members ?? [];
  const isOwner = members.find((m) => m.userId === user?.id)?.role === 'OWNER';
  const otherMembers = members.filter((m) => m.userId !== user?.id);
  const isEmpty = !loading && otherMembers.length === 0;

  const handleShare = useCallback(async () => {
    try {
      await invitationsAPI.create(groupId, 'LINK');
    } catch {}
    navigation.navigate('InviteMembers', { groupId });
  }, [groupId, navigation]);

  const handleMemberOptions = useCallback((memberId: string, memberName: string) => {
    Alert.alert(
      memberName,
      t('groupDetail.chooseAction'),
      [
        {
          text: t('groupDetail.blockUser'),
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              t('groupDetail.blockUser'),
              t('groupDetail.blockConfirm', { name: memberName }),
              [
                { text: t('common.cancel'), style: 'cancel' },
                {
                  text: t('groupDetail.blockUser'),
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await safetyAPI.blockUser(memberId);
                      Alert.alert(t('groupDetail.userBlocked'), t('groupDetail.hasBeenBlocked', { name: memberName }));
                    } catch {
                      Alert.alert(t('common.error'), t('groupDetail.couldNotBlock'));
                    }
                  },
                },
              ]
            );
          },
        },
        {
          text: t('groupDetail.reportUser'),
          onPress: () => {
            Alert.alert(
              t('groupDetail.reportUser'),
              t('groupDetail.selectReason'),
              [
                {
                  text: t('groupDetail.spam'),
                  onPress: async () => {
                    try {
                      await safetyAPI.reportUser({ reportedUserId: memberId, reason: 'spam' });
                      Alert.alert(t('groupDetail.reportSubmitted'), t('groupDetail.thankYou'));
                    } catch {
                      Alert.alert(t('common.error'), t('groupDetail.couldNotReport'));
                    }
                  },
                },
                {
                  text: t('groupDetail.harassment'),
                  onPress: async () => {
                    try {
                      await safetyAPI.reportUser({ reportedUserId: memberId, reason: 'harassment' });
                      Alert.alert(t('groupDetail.reportSubmitted'), t('groupDetail.thankYou'));
                    } catch {
                      Alert.alert(t('common.error'), t('groupDetail.couldNotReport'));
                    }
                  },
                },
                {
                  text: t('groupDetail.inappropriate'),
                  onPress: async () => {
                    try {
                      await safetyAPI.reportUser({ reportedUserId: memberId, reason: 'inappropriate' });
                      Alert.alert(t('groupDetail.reportSubmitted'), t('groupDetail.thankYou'));
                    } catch {
                      Alert.alert(t('common.error'), t('groupDetail.couldNotReport'));
                    }
                  },
                },
                {
                  text: t('groupDetail.other'),
                  onPress: async () => {
                    try {
                      await safetyAPI.reportUser({ reportedUserId: memberId, reason: 'other' });
                      Alert.alert(t('groupDetail.reportSubmitted'), t('groupDetail.thankYou'));
                    } catch {
                      Alert.alert(t('common.error'), t('groupDetail.couldNotReport'));
                    }
                  },
                },
                { text: t('common.cancel'), style: 'cancel' },
              ]
            );
          },
        },
        { text: t('common.cancel'), style: 'cancel' },
      ]
    );
  }, [t]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <DNScreenHeader
        title={groupName}
        onBack={() => navigation.goBack()}
        rightElement={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <DNButton
              label="🌙"
              onPress={() => navigation.navigate('AfterDark', { groupId })}
              variant="tonal"
              size="compact"
            />
            <DNButton
              label={t('groups.invite')}
              onPress={handleShare}
              variant="tonal"
              size="compact"
            />
          </View>
        }
      />

      {/* Hero section */}
      <View style={{ alignItems: 'center', paddingHorizontal: SPACING.gutter, marginBottom: SPACING.lg }}>
        {/* Stacked avatars */}
        <View style={{ flexDirection: 'row', marginBottom: SPACING.md }}>
          <DNAvatar
            name={group?.name ?? groupName}
            size={54}
            colorIndex={0}
            style={{ transform: [{ rotate: '-6deg' }], marginRight: -16 }}
          />
          <DNAvatar
            name={otherMembers[0]?.userId ?? '?'}
            size={54}
            colorIndex={1}
            pending={!otherMembers[0]}
            style={{ transform: [{ rotate: '6deg' }] }}
          />
        </View>

        <Text style={[TYPE.title, { color: colors.ink, marginBottom: 4, textAlign: 'center' }]}>
          {group?.name ?? groupName}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[TYPE.secondary, { color: colors.ink2 }]}>
            {members.length} {members.length === 1 ? t('groupDetail.member') : t('groupDetail.membersCount')}
          </Text>
          {isOwner && (
            <DNSticker
              label={t('groupDetail.owner')}
              color={colors.primarySoft}
              textColor={colors.primary}
              size="sm"
              rotationIndex={1}
            />
          )}
        </View>
      </View>

      {/* New Proposal button */}
      <View style={{ paddingHorizontal: SPACING.gutter, marginBottom: SPACING.lg }}>
        <DNButton
          label={t('groupDetail.newProposal')}
          onPress={() => navigation.navigate('CreateProposal', { groupId })}
          variant="primary"
          style={{ width: '100%' }}
        />
      </View>

      {isEmpty ? (
        <EmptyGroupState group={group!} onShare={handleShare} />
      ) : (
        <View style={{ paddingHorizontal: SPACING.gutter }}>
          {/* Active proposals */}
          <Text style={[TYPE.section, { color: colors.ink2, marginBottom: 8 }]}>{t('groups.active')}</Text>
          {activeProposals.length === 0 && (
            <Text style={[TYPE.secondary, { color: colors.ink2, marginBottom: SPACING.md }]}>
              {t('groupDetail.noActiveProposals')}
            </Text>
          )}
          {activeProposals.map((p, i) => (
            <ActiveProposalCard
              key={p.id}
              proposal={p}
              index={i}
              totalMembers={Math.max(members.length, 2)}
              onPress={() => navigation.navigate('ProposalDetail', { proposalId: p.id })}
            />
          ))}

          {/* Past proposals */}
          {pastProposals.length > 0 && (
            <>
              <Text
                style={[TYPE.section, { color: colors.ink2, marginBottom: 12, marginTop: SPACING.md }]}
              >
                {t('groupDetail.past')}
              </Text>
              {pastProposals.map((p) => (
                <PastProposalRow key={p.id} item={p} />
              ))}
            </>
          )}

          {/* Members list */}
          {otherMembers.length > 0 && (
            <>
              <Text style={[TYPE.section, { color: colors.ink2, marginBottom: 8, marginTop: SPACING.md }]}>
                {t('groupDetail.membersLabel')}
              </Text>
              {otherMembers.map((m) => {
                const memberName = (m as any).user?.displayName ?? m.userId ?? 'Member';
                return (
                  <View
                    key={m.userId}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.line,
                    }}
                  >
                    <DNAvatar name={memberName} size={42} colorIndex={1} />
                    <Text style={[TYPE.rowLabel, { color: colors.ink, flex: 1, marginLeft: 10 }]}>
                      {memberName}
                    </Text>
                    <TouchableOpacity
                      onPress={() => handleMemberOptions(m.userId, memberName)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ paddingHorizontal: 8 }}
                    >
                      <Text style={{ fontSize: 20, color: colors.ink2 }}>⋯</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </>
          )}
        </View>
      )}
    </ScrollView>
  );
}
