/**
 * ProposalDetailScreen — 1c interactive
 * HANDOFF_README spec: full redesign
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { OPTION_RADII, SPACING, TYPE, SHADOWS } from '@/constants';
import {
  DNButton,
  DNCard,
  DNScreenHeader,
  DNSticker,
  DNText,
} from '@/components/ui';
import { proposalsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import type { ActivityOption, Proposal, RootStackParamList } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'ProposalDetail'>;

// ── Striped placeholder ────────────────────────────────────────────────────────
function StripedPlaceholder({ primarySoft }: { primarySoft: string }) {
  return (
    <View
      style={{
        height: 150,
        backgroundColor: primarySoft,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Diagonal stripes via rotated thin views */}
      <View style={StyleSheet.absoluteFill}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 300,
              backgroundColor: 'rgba(14,140,140,0.12)',
              left: i * 28 - 20,
              top: -60,
              transform: [{ rotate: '35deg' }],
            }}
          />
        ))}
      </View>
      <Text style={[TYPE.secondary, { color: 'rgba(14,140,140,0.5)' }]}>
        Yelp photo
      </Text>
    </View>
  );
}

// ── Vote Stamp ────────────────────────────────────────────────────────────────
interface VoteStampProps {
  votedByMe: boolean;
  votedByPartner: boolean;
  partnerName?: string;
  onPress: () => void;
  colors: ReturnType<typeof import('@/constants').palette>;
}

function VoteStamp({ votedByMe, votedByPartner, partnerName, onPress, colors }: VoteStampProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.6, duration: 60, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.06, duration: 200, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 140, useNativeDriver: true }),
    ]).start();
  };

  const handlePress = () => {
    animate();
    onPress();
  };

  const stampBg = votedByMe ? colors.primary : votedByPartner ? colors.limeSoft : colors.surface ?? '#fff';
  const borderColor = votedByMe ? colors.primary : votedByPartner ? colors.lime : colors.line;
  const heartColor = votedByMe ? colors.onPrimary : votedByPartner ? colors.lime : colors.ink2;
  const heartFilled = votedByMe;

  return (
    <View style={{ position: 'absolute', bottom: 12, right: 12 }}>
      {votedByPartner && !votedByMe && (
        <DNSticker
          label={`${partnerName ?? 'Partner'} ♥`}
          color={colors.limeSoft}
          textColor={colors.lime}
          size="sm"
          style={{ position: 'absolute', top: -18, left: -4, zIndex: 10 }}
        />
      )}
      <TouchableOpacity onPress={handlePress} activeOpacity={0.85}>
        <Animated.View
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: stampBg,
            borderWidth: 2,
            borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            transform: [{ scale }],
            ...SHADOWS.card,
          }}
        >
          <Text style={{ fontSize: 22, color: heartColor }}>
            {heartFilled ? '♥' : '♡'}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

// ── Confetti ──────────────────────────────────────────────────────────────────
function Confetti() {
  const colors2 = ['#0E8C8C', '#7CB518', '#E39B12', '#2D6CDB', '#D63A3A', '#F4F6F8'];
  const anims = useRef(
    Array.from({ length: 40 }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(1),
    }))
  ).current;

  useEffect(() => {
    const animations = anims.map((a) => {
      const dx = (Math.random() - 0.5) * 340;
      const dy = (Math.random() - 0.5) * 500 - 100;
      return Animated.parallel([
        Animated.timing(a.x, { toValue: dx, duration: 900, useNativeDriver: true }),
        Animated.timing(a.y, { toValue: dy, duration: 900, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(600),
          Animated.timing(a.opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]);
    });
    Animated.stagger(20, animations).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: i % 2 === 0 ? 10 : 8,
            height: i % 2 === 0 ? 10 : 14,
            borderRadius: i % 3 === 0 ? 5 : 2,
            backgroundColor: colors2[i % colors2.length],
            opacity: a.opacity,
            transform: [{ translateX: a.x }, { translateY: a.y }],
          }}
        />
      ))}
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProposalDetailScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<RouteT>();
  const { user } = useAuth();
  const { proposalId } = route.params;

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [myVotedOptionId, setMyVotedOptionId] = useState<string | null>(null);
  const [seenDecision, setSeenDecision] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load proposal
  const loadProposal = useCallback(async () => {
    try {
      const res = await proposalsAPI.get(proposalId);
      const p: Proposal = res.data;
      setProposal(p);

      // Detect my vote
      if (user && p.votes) {
        const myVote = p.votes.find((v) => v.userId === user.id);
        setMyVotedOptionId(myVote?.optionId ?? null);
      }

      // Check DECIDED state
      if (p.status === 'ACCEPTED' && p.consensus?.reached) {
        const seenKey = `seenDecision_${p.id}`;
        const seen = await AsyncStorage.getItem(seenKey);
        if (!seen) {
          setShowDecision(true);
        } else {
          setSeenDecision(true);
        }
      }
    } catch (e) {
      console.warn('Failed to load proposal', e);
    } finally {
      setLoading(false);
    }
  }, [proposalId, user]);

  useEffect(() => { loadProposal(); }, [loadProposal]);

  const dismissDecision = async () => {
    if (proposal) {
      await AsyncStorage.setItem(`seenDecision_${proposal.id}`, '1');
    }
    setShowDecision(false);
    setSeenDecision(true);
  };

  const handleVote = async (optionId: string) => {
    if (!proposal) return;
    // Optimistic toggle
    const prev = myVotedOptionId;
    const next = myVotedOptionId === optionId ? null : optionId;
    setMyVotedOptionId(next);
    try {
      await proposalsAPI.vote(proposal.id, optionId);
    } catch {
      setMyVotedOptionId(prev); // revert
    }
  };

  if (loading || !proposal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[TYPE.body, { color: colors.ink2 }]}>Loading…</Text>
      </View>
    );
  }

  // Status sticker
  const statusMap: Record<string, { label: string; color: string; textColor?: string }> = {
    ACTIVE:    { label: 'OPEN',      color: colors.primarySoft, textColor: colors.primary },
    ACCEPTED:  { label: 'DECIDED',   color: colors.limeSoft,    textColor: colors.lime },
    COUNTERED: { label: 'COUNTERED', color: colors.warningSoft, textColor: colors.onWarningSoft },
  };
  const statusInfo = statusMap[proposal.status] ?? statusMap.ACTIVE;

  // Vote counts
  const totalMembers = 2; // default to 2 (couples app)
  const votedCount = new Set(proposal.votes?.map((v) => v.userId) ?? []).size;

  // Partner's vote (first non-me voter)
  const partnerVote = proposal.votes?.find((v) => v.userId !== user?.id);
  const partnerName = 'Partner'; // Would come from group members in real app

  // Banner state
  const partnerVoted = !!partnerVote;
  const iVoted = !!myVotedOptionId;
  const mismatch = partnerVoted && iVoted && partnerVote?.optionId !== myVotedOptionId;
  const waitingForMe = partnerVoted && !iVoted;

  const isDecided = proposal.status === 'ACCEPTED' && proposal.consensus?.reached;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <DNScreenHeader
          title={proposal.title}
          subtitle="Group"
          onBack={() => navigation.goBack()}
          rightElement={
            <DNSticker
              label={statusInfo.label}
              color={statusInfo.color}
              textColor={statusInfo.textColor}
              rotationIndex={1}
            />
          }
        />

        <View style={{ paddingHorizontal: SPACING.gutter }}>
          {/* Date pill */}
          {proposal.scheduledFor && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                alignSelf: 'flex-start',
                backgroundColor: colors.surface,
                borderRadius: 999,
                paddingVertical: 6,
                paddingHorizontal: 14,
                marginBottom: SPACING.sm,
                ...SHADOWS.card,
              }}
            >
              <Text style={{ marginRight: 6, fontSize: 14 }}>🕐</Text>
              <DNText variant="secondary" color={colors.ink2}>
                {new Date(proposal.scheduledFor).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </DNText>
            </View>
          )}

          {/* Tally */}
          <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: SPACING.md }}>
            {votedCount} of {totalMembers} voted
          </DNText>

          {/* Status banners */}
          {waitingForMe && (
            <View
              style={{
                backgroundColor: colors.warningSoft,
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: SPACING.md,
                marginBottom: SPACING.md,
              }}
            >
              <DNText variant="secondary" color={colors.onWarningSoft}>
                {partnerName} voted · waiting on you
              </DNText>
            </View>
          )}

          {mismatch && (
            <View
              style={{
                backgroundColor: colors.warningSoft,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: SPACING.md,
                marginBottom: SPACING.md,
                gap: 10,
              }}
            >
              <DNText variant="secondary" color={colors.onWarningSoft}>
                Hmm, two hearts 💛
              </DNText>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <DNButton
                  label="Counter-propose"
                  variant="ink"
                  size="compact"
                  onPress={() => {}}
                  style={{ flex: 1 }}
                />
                <DNButton
                  label="Give it time"
                  variant="secondary"
                  size="compact"
                  onPress={() => {}}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          )}

          {/* Option cards */}
          {proposal.options.map((option, idx) => {
            const radii = OPTION_RADII[idx % 4];
            const votedByMe = myVotedOptionId === option.id;
            const votedByPartner = partnerVote?.optionId === option.id;

            return (
              <View
                key={option.id}
                style={[
                  {
                    backgroundColor: colors.surface,
                    borderTopLeftRadius: radii.topLeft,
                    borderTopRightRadius: radii.topRight,
                    borderBottomRightRadius: radii.bottomRight,
                    borderBottomLeftRadius: radii.bottomLeft,
                    marginBottom: SPACING.md,
                    overflow: 'visible',
                  },
                  SHADOWS.card,
                ]}
              >
                {/* Image slot */}
                <View
                  style={{
                    borderTopLeftRadius: radii.topLeft,
                    borderTopRightRadius: radii.topRight,
                    overflow: 'hidden',
                    height: 150,
                  }}
                >
                  <StripedPlaceholder primarySoft={colors.primarySoft} />
                  {/* Stickers over image */}
                  {option.category && (
                    <DNSticker
                      label={option.category}
                      color={colors.primarySoft}
                      textColor={colors.primary}
                      style={{ position: 'absolute', top: 10, left: 10, transform: [{ rotate: '-4deg' }] }}
                    />
                  )}
                  {option.estimatedCost && (
                    <DNSticker
                      label={option.estimatedCost}
                      color={colors.limeSoft}
                      textColor={colors.lime}
                      style={{ position: 'absolute', top: 10, right: 10, transform: [{ rotate: '4deg' }] }}
                    />
                  )}
                </View>

                {/* Card body */}
                <View style={{ padding: SPACING.md, paddingBottom: 20 }}>
                  <DNText variant="heading" color={colors.ink}>
                    {option.title}
                  </DNText>
                  {(option.location || option.category) && (
                    <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 4 }}>
                      {[option.location, option.category].filter(Boolean).join(' · ')}
                    </DNText>
                  )}
                </View>

                {/* Vote stamp */}
                <VoteStamp
                  votedByMe={votedByMe}
                  votedByPartner={votedByPartner}
                  partnerName={partnerName}
                  onPress={() => handleVote(option.id)}
                  colors={colors}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* DECIDED overlay */}
      {isDecided && showDecision && (
        <Modal transparent animationType="fade" visible={showDecision}>
          {/* Dim backdrop */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)' }]} />
          <Confetti />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.gutter }}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 32,
                padding: SPACING.xl,
                alignItems: 'center',
                width: '100%',
                ...SHADOWS.dock,
              }}
            >
              <DNSticker
                label="LOCKED IN"
                color={colors.limeSoft}
                textColor={colors.lime}
                rotationIndex={1}
                style={{ marginBottom: SPACING.md }}
              />
              <Text style={{ fontSize: 48, marginBottom: SPACING.sm }}>🎉</Text>
              <DNText variant="body" color={colors.ink2} style={{ marginBottom: SPACING.xs, textAlign: 'center' }}>
                You both said yes to
              </DNText>
              <DNText variant="title" color={colors.ink} style={{ marginBottom: SPACING.lg, textAlign: 'center' }}>
                {proposal.consensus?.winningOption?.title ?? 'your pick'}
              </DNText>
              <DNButton
                label="Add to calendar"
                variant="primary"
                onPress={dismissDecision}
                style={{ width: '100%', marginBottom: SPACING.sm }}
              />
              <DNButton
                label="Done"
                variant="secondary"
                onPress={dismissDecision}
                style={{ width: '100%' }}
              />
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
