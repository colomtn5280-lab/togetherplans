/**
 * GroupsScreen — Plans tab
 * HANDOFF_README §3c (populated) + §3d (empty)
 */
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, TYPE, SHADOWS } from '@/constants';
import {
  DNText,
  DNButton,
  DNSticker,
  DNAvatar,
  DNSkeleton,
  DNScreenHeader,
} from '@/components/ui';
import { groupsAPI } from '@/services/api';
import type { Group, Proposal, RootStackParamList } from '@/types';
import { useAuth } from '@/hooks/useAuth';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Empty state illustration ─────────────────────────────────────────────────
function EmptyIllustration() {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', marginBottom: SPACING.lg }}>
      <View style={{ width: 180, height: 140, alignItems: 'center', justifyContent: 'center' }}>
        {/* Back tilted card */}
        <View
          style={{
            position: 'absolute',
            width: 130,
            height: 90,
            backgroundColor: colors.surface,
            borderRadius: 20,
            transform: [{ rotate: '8deg' }],
            ...SHADOWS.card,
          }}
        />
        {/* Front tilted card */}
        <View
          style={{
            position: 'absolute',
            width: 130,
            height: 90,
            backgroundColor: colors.primarySoft,
            borderRadius: 20,
            transform: [{ rotate: '-15deg' }],
            ...SHADOWS.card,
          }}
        />
        {/* Friday? sticker */}
        <DNSticker
          label="Friday?"
          color={colors.lime}
          textColor={colors.ink}
          rotationIndex={0}
          style={{ position: 'absolute', top: 8, right: 20, zIndex: 10 }}
        />
      </View>
      {/* Lime heart */}
      <View
        style={{
          width: 36,
          height: 36,
          backgroundColor: colors.lime,
          borderRadius: 18,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.md,
        }}
      >
        <Text style={{ fontSize: 18 }}>♥</Text>
      </View>
    </View>
  );
}

// ─── 3-step checklist ─────────────────────────────────────────────────────────
function StepChecklist() {
  const { colors } = useTheme();
  const steps = [
    { label: 'Create your first group', active: true },
    { label: 'Invite someone special', active: false },
    { label: 'Plan your first date night', active: false },
  ];
  return (
    <View style={{ marginBottom: SPACING.lg, width: '100%' }}>
      {steps.map((step, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10,
            opacity: step.active ? 1 : 0.6,
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: step.active ? colors.primary : colors.line,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ color: colors.onPrimary, fontSize: 12 }}>✓</Text>
          </View>
          <Text style={[TYPE.body, { color: step.active ? colors.ink : colors.ink2 }]}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ─── Group row ────────────────────────────────────────────────────────────────
function GroupRow({
  group,
  onPress,
  actionNeeded,
  openCount,
  decidedCount,
}: {
  group: Group;
  onPress: () => void;
  actionNeeded?: boolean;
  openCount: number;
  decidedCount: number;
}) {
  const { colors } = useTheme();
  const members = group.members ?? [];
  const visibleMembers = members.slice(0, 3);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 12,
        marginBottom: 10,
        ...SHADOWS.card,
      }}
    >
      {/* Stacked avatars */}
      <View style={{ flexDirection: 'row', marginRight: 12 }}>
        {visibleMembers.length > 0 ? (
          visibleMembers.map((m, i) => (
            <DNAvatar
              key={m.id}
              name={m.user?.displayName ?? m.userId}
              size={42}
              colorIndex={i}
              style={{
                marginLeft: i > 0 ? -12 : 0,
                borderWidth: 2,
                borderColor: colors.surface,
              }}
            />
          ))
        ) : (
          <DNAvatar name={group.name} size={42} colorIndex={0} />
        )}
      </View>

      {/* Name + counts */}
      <View style={{ flex: 1 }}>
        <Text style={[TYPE.rowLabel, { color: colors.ink }]} numberOfLines={1}>
          {group.name}
        </Text>
        <Text style={[TYPE.secondary, { color: colors.ink2 }]}>
          {openCount} open · {decidedCount} decided
        </Text>
      </View>

      {/* Action dot */}
      {actionNeeded && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.primary,
            marginLeft: 8,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

// ─── GroupsScreen ─────────────────────────────────────────────────────────────
export default function GroupsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();

  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // Map from groupId -> { openCount, decidedCount, actionNeeded }
  const [proposalStats, setProposalStats] = useState<
    Record<string, { openCount: number; decidedCount: number; actionNeeded: boolean }>
  >({});

  const loadGroups = useCallback(async () => {
    try {
      const res = await groupsAPI.list();
      const loaded: Group[] = res.data?.groups ?? res.data ?? [];
      setGroups(loaded);

      // Batch-fetch proposals for all groups
      const results = await Promise.all(
        loaded.map((g) =>
          groupsAPI.proposals(g.id).then((r) => ({ groupId: g.id, proposals: (r.data?.proposals ?? r.data ?? []) as Proposal[] })).catch(() => ({ groupId: g.id, proposals: [] as Proposal[] }))
        )
      );

      const stats: Record<string, { openCount: number; decidedCount: number; actionNeeded: boolean }> = {};
      for (const { groupId, proposals } of results) {
        const openProposals = proposals.filter((p) => p.status === 'OPEN' || p.status === 'ACTIVE');
        const decidedProposals = proposals.filter((p) => p.status === 'DECIDED' || p.status === 'ACCEPTED');
        // actionNeeded: an OPEN proposal where current user hasn't voted
        let actionNeeded = false;
        if (user) {
          for (const p of openProposals) {
            const allVoterIds = new Set<string>();
            if (p.options) p.options.forEach((o) => { if (o.votes) o.votes.forEach((v) => allVoterIds.add(v.userId)); });
            if (p.votes) p.votes.forEach((v) => allVoterIds.add(v.userId));
            if (!allVoterIds.has(user.id)) { actionNeeded = true; break; }
          }
        }
        stats[groupId] = { openCount: openProposals.length, decidedCount: decidedProposals.length, actionNeeded };
      }
      setProposalStats(stats);
    } catch {
      // silently fail — show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGroups();
  }, [loadGroups]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const name = user?.displayName?.split(' ')[0] ?? 'there';
  const isEmpty = !loading && groups.length === 0;

  // ── EMPTY STATE ──────────────────────────────────────────────────────────────
  if (isEmpty && !loading) {
    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{
          paddingBottom: 120,
          paddingHorizontal: SPACING.gutter,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <DNScreenHeader
          title="Your plans"
          subtitle={`${greeting}, ${name}`}
          rightElement={
            <DNButton
              label="+ New"
              onPress={() => navigation.navigate('CreateGroup')}
              variant="primary"
              size="compact"
            />
          }
        />

        <View style={{ height: SPACING.xl }} />
        <EmptyIllustration />

        <DNText variant="title" style={{ textAlign: 'center', marginBottom: SPACING.sm }}>
          Nothing planned. Yet.
        </DNText>
        <DNText
          variant="body"
          color={colors.ink2}
          style={{ textAlign: 'center', marginBottom: SPACING.xl }}
        >
          Create a group, invite someone, and start planning date nights together.
        </DNText>

        <StepChecklist />

        <DNButton
          label="Create your first group"
          onPress={() => navigation.navigate('CreateGroup')}
          variant="primary"
          style={{ width: '100%' }}
        />
      </ScrollView>
    );
  }

  // ── POPULATED STATE ──────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header row */}
      <DNScreenHeader
        title="Your plans"
        subtitle={`${greeting}, ${name}`}
        rightElement={
          <DNButton
            label="+ New"
            onPress={() => navigation.navigate('CreateGroup')}
            variant="primary"
            size="compact"
          />
        }
      />

      <View style={{ paddingHorizontal: SPACING.gutter }}>
        {/* ── GROUPS ──────────────────────────────────────────────────────────── */}
        <Text style={[TYPE.section, { color: colors.ink2, marginBottom: 8 }]}>Groups</Text>

        {groups.map((g) => (
          <GroupRow
            key={g.id}
            group={g}
            actionNeeded={proposalStats[g.id]?.actionNeeded ?? false}
            openCount={proposalStats[g.id]?.openCount ?? 0}
            decidedCount={proposalStats[g.id]?.decidedCount ?? 0}
            onPress={() =>
              navigation.navigate('GroupDetail', { groupId: g.id, groupName: g.name })
            }
          />
        ))}

        {/* Loading skeleton */}
        {loading && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 12,
              ...SHADOWS.card,
            }}
          >
            <DNSkeleton width={36} height={36} style={{ borderRadius: 18, marginRight: 12 }} />
            <View style={{ flex: 1, gap: 8 }}>
              <DNSkeleton width="60%" height={14} />
              <DNSkeleton width="40%" height={12} />
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
