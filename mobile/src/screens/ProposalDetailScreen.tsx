/**
 * ProposalDetailScreen — 1c interactive
 * HANDOFF_README spec: full redesign
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
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
import { proposalsAPI, groupsAPI } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import * as Calendar from 'expo-calendar';
import type { ActivityOption, Proposal, RootStackParamList } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'ProposalDetail'>;

// ── Category colour fallback ───────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
  'Restaurants & Dining': '#FDEBD0',
  'Live Music & Concerts': '#EBD5FB',
  'Comedy Shows': '#FEF9C3',
  'Movies & Theater': '#D5E8FD',
  'Art & Museums': '#FCE4EC',
  'Outdoor Adventures': '#D4EDDA',
  'Sports & Active': '#FFE0B2',
  'Nightlife & Bars': '#E8D5F5',
  'Wellness & Spa': '#D0F4F1',
  'Cooking & Classes': '#FFF3CD',
  Custom: '#F0F0F0',
};
const CATEGORY_EMOJIS: Record<string, string> = {
  'Restaurants & Dining': '🍽️',
  'Live Music & Concerts': '🎵',
  'Comedy Shows': '😂',
  'Movies & Theater': '🎬',
  'Art & Museums': '🎨',
  'Outdoor Adventures': '🏔️',
  'Sports & Active': '🏃',
  'Nightlife & Bars': '🍸',
  'Wellness & Spa': '💆',
  'Cooking & Classes': '🍳',
};

function OptionImageBlock({
  imageUrl,
  category,
  height = 150,
  topLeftRadius = 0,
  topRightRadius = 0,
}: {
  imageUrl?: string;
  category?: string;
  height?: number;
  topLeftRadius?: number;
  topRightRadius?: number;
}) {
  const [err, setErr] = useState(false);
  const cat = category ?? '';
  const bg = CATEGORY_COLORS[cat] ?? '#F0F0F0';
  const emoji = CATEGORY_EMOJIS[cat] ?? '📍';

  if (imageUrl && !err) {
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', height, borderTopLeftRadius: topLeftRadius, borderTopRightRadius: topRightRadius }}
        resizeMode="cover"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <View
      style={{
        width: '100%',
        height,
        backgroundColor: bg,
        borderTopLeftRadius: topLeftRadius,
        borderTopRightRadius: topRightRadius,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 40 }}>{emoji}</Text>
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
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const { user } = useAuth();
  const { proposalId } = route.params;
  const openInvite = route.params.openInvite ?? false;
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [myVoteMap, setMyVoteMap] = useState<Map<string, string>>(new Map());
  const [showDecision, setShowDecision] = useState(false);
  const [loading, setLoading] = useState(true);
  const [partnerName, setPartnerName] = useState('Partner');
  const [proposerName, setProposerName] = useState<string>('');

  // Guest-vote share link state
  const shareUrlRef = useRef<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showGuestHint, setShowGuestHint] = useState(false);
  const autoInviteFiredRef = useRef(false);

  /** Fetch (and cache) the guest-vote share URL. Returns null on failure. */
  const fetchShareUrl = useCallback(async (): Promise<string | null> => {
    if (shareUrlRef.current) return shareUrlRef.current;
    try {
      const res = await proposalsAPI.getShareLink(proposalId);
      const url = res.data?.shareUrl ?? null;
      shareUrlRef.current = url;
      return url;
    } catch (e: any) {
      const status = e?.response?.status;
      Alert.alert(
        'Couldn\u2019t create the link',
        status === 403
          ? 'Only group members can create an invite link for this plan.'
          : 'Check your connection and try again.',
      );
      return null;
    }
  }, [proposalId]);

  /** Open the native share sheet with the guest-vote link. */
  const handleInviteToVote = useCallback(async (fromAutoFlow = false) => {
    if (sharing) return;
    setSharing(true);
    try {
      const url = await fetchShareUrl();
      if (!url) return;
      const result = await Share.share({
        message: `Help us pick! Vote on our plan — no account needed: ${url}`,
      });
      if (fromAutoFlow && result.action !== Share.dismissedAction) {
        setShowGuestHint(true);
      }
    } catch {
      // User cancelled or share sheet unavailable — nothing to do
    } finally {
      setSharing(false);
    }
  }, [sharing, fetchShareUrl]);

  /** Copy the guest-vote link to the clipboard. */
  const handleCopyLink = useCallback(async () => {
    const url = await fetchShareUrl();
    if (!url) return;
    try {
      await Clipboard.setStringAsync(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [fetchShareUrl]);

  // Load proposal
  const loadProposal = useCallback(async () => {
    try {
      const res = await proposalsAPI.get(proposalId);
      const p: Proposal = res.data;
      setProposal(p);

      // Derive my voted options from nested votes in each option
      if (user && p.options) {
        const voteMap = new Map<string, string>(
          p.options.flatMap((o: any) => {
            const v = (o.votes ?? []).find((v: any) => v.userId === user.id);
            return v ? [[o.id, v.sentiment ?? 'APPROVE']] : [];
          })
        );
        setMyVoteMap(voteMap);
      } else if (user && p.votes) {
        // Fallback: flat votes array
        const voteMap = new Map<string, string>(
          p.votes
            .filter((v: any) => v.userId === user.id && v.optionId)
            .map((v: any) => [v.optionId, v.sentiment ?? 'APPROVE'])
        );
        setMyVoteMap(voteMap);
      }

      // M5: fetch group members to get real partner name + proposer name
      if (p.groupId && user) {
        try {
          const groupRes = await groupsAPI.get(p.groupId);
          const members: Array<{ userId: string; user?: { id: string; displayName: string } }> =
            groupRes.data?.group?.members ?? groupRes.data?.members ?? [];
          const others = members.filter((m) => m.userId !== user.id);
          if (others.length === 1) {
            setPartnerName(others[0].user?.displayName ?? 'Someone');
          } else if (others.length > 1) {
            setPartnerName('A member');
          }
          // Resolve proposer name from members list, fallback to creator field on response
          const proposerMember = members.find((m) => m.userId === p.proposerId);
          const resolvedProposerName =
            proposerMember?.user?.displayName ??
            (p as any).creator?.displayName ??
            (p as any).proposer?.displayName ??
            '';
          setProposerName(resolvedProposerName);
        } catch {}
      }

      // Check DECIDED state
      if (p.status === 'DECIDED' || (p.status === 'ACCEPTED' && p.consensus?.reached)) {
        const seenKey = `seenDecision_${p.id}`;
        const seen = await AsyncStorage.getItem(seenKey);
        if (!seen) {
          setShowDecision(true);
        }
      }
    } catch (e) {
      console.warn('Failed to load proposal', e);
    } finally {
      setLoading(false);
    }
  }, [proposalId, user]);

  useEffect(() => { loadProposal(); }, [loadProposal]);

  // Solo-start auto-flow: open the share sheet once when navigated with openInvite
  useEffect(() => {
    if (openInvite && proposal && !autoInviteFiredRef.current && proposal.status === 'OPEN') {
      autoInviteFiredRef.current = true;
      handleInviteToVote(true);
    }
  }, [openInvite, proposal, handleInviteToVote]);

  const dismissDecision = async () => {
    if (proposal) {
      await AsyncStorage.setItem(`seenDecision_${proposal.id}`, '1');
    }
    setShowDecision(false);
  };

  // M4: Add to calendar handler
  const handleAddToCalendar = async () => {
    if (!proposal) { await dismissDecision(); return; }
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status !== 'granted') {
        await dismissDecision();
        return;
      }
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
      const defaultCalendar = calendars.find((c) => c.allowsModifications) ?? calendars[0];
      if (defaultCalendar) {
        const eventDate = new Date(proposal.scheduledFor ?? proposal.dateTime ?? Date.now());
        const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // +2h
        const winningOpt = proposal.options.find(
          (o) => proposal.tally?.find((t) => t.optionId === o.id && t.consensus)
        ) ?? proposal.consensus?.winningOption;
        const location = (winningOpt as any)?.address ?? (winningOpt as any)?.location ?? '';
        await Calendar.createEventAsync(defaultCalendar.id, {
          title: proposal.title,
          startDate: eventDate,
          endDate,
          location,
          notes: `DateMeUp plan`,
        });
      }
    } catch {}
    await dismissDecision();
  };

  const handleVote = async (optionId: string, sentiment: 'APPROVE' | 'MAYBE' | 'REJECT') => {
    if (!proposal) return;
    const prevMap = new Map(myVoteMap);

    // Optimistic update
    const next = new Map(myVoteMap);
    next.set(optionId, sentiment);
    setMyVoteMap(next);
    try {
      await proposalsAPI.vote(proposal.id, optionId, sentiment);
    } catch {
      setMyVoteMap(prevMap); // revert
    }
  };

  if (loading || !proposal) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[TYPE.body, { color: colors.ink2 }]}>Loading…</Text>
      </View>
    );
  }

  // Status sticker — support both old and new status strings
  const statusMap: Record<string, { label: string; color: string; textColor?: string }> = {
    OPEN:      { label: 'OPEN',      color: colors.primarySoft, textColor: colors.primary },
    ACTIVE:    { label: 'OPEN',      color: colors.primarySoft, textColor: colors.primary },
    DECIDED:   { label: 'DECIDED',   color: colors.limeSoft,    textColor: colors.lime },
    ACCEPTED:  { label: 'DECIDED',   color: colors.limeSoft,    textColor: colors.lime },
    COUNTERED: { label: 'COUNTERED', color: colors.warningSoft, textColor: colors.onWarningSoft },
  };
  const statusInfo = statusMap[proposal.status] ?? statusMap.OPEN;

  // Distinct voter count from nested votes in options (backend shape)
  const allVoterIds = new Set<string>();
  proposal.options.forEach((o) => {
    if (o.votes) o.votes.forEach((v) => allVoterIds.add(v.userId));
  });
  // Fallback to flat votes array
  if (allVoterIds.size === 0 && proposal.votes) {
    proposal.votes.forEach((v) => allVoterIds.add(v.userId));
  }
  const votedCount = allVoterIds.size;
  const totalMembers = proposal.memberCount ?? 2;

  // Partner's vote info (first non-me voter)
  let partnerVotedOptionId: string | null = null;
  if (user) {
    for (const o of proposal.options) {
      if (o.votes && o.votes.some((v) => v.userId !== user.id && allVoterIds.has(v.userId))) {
        // Another user voted for this option
        const partnerVote = o.votes.find((v) => v.userId !== user.id);
        if (partnerVote) { partnerVotedOptionId = o.id; break; }
      }
    }
    // Fallback flat votes
    if (!partnerVotedOptionId && proposal.votes) {
      const partnerVote = proposal.votes.find((v) => v.userId !== user.id);
      partnerVotedOptionId = partnerVote?.optionId ?? null;
    }
  }

  const partnerVoted = !!partnerVotedOptionId;
  const iVoted = myVoteMap.size > 0;
  const mismatch = partnerVoted && iVoted && !myVoteMap.has(partnerVotedOptionId!);
  const waitingForMe = partnerVoted && !iVoted;

  const isDecided = proposal.status === 'DECIDED' || (proposal.status === 'ACCEPTED' && proposal.consensus?.reached);
  const isOpen = proposal.status === 'OPEN' || proposal.status === 'ACTIVE';

  // Winning option name for the overlay
  const winningOption = proposal.options.find(
    (o) => proposal.tally?.find((t) => t.optionId === o.id && t.consensus)
  );
  const winningName =
    winningOption?.name ??
    winningOption?.title ??
    proposal.consensus?.winningOption?.name ??
    proposal.consensus?.winningOption?.title ??
    'your pick';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Header */}
        <DNScreenHeader
          title={proposal.title}
          subtitle="Group"
          onBack={() => navigation.goBack()}
          rightElement={
            isDecided ? (
              <DNButton
                label="Share 📤"
                variant="tonal"
                size="compact"
                onPress={() => navigation.navigate('ShareCard', { proposalId: proposal.id })}
              />
            ) : (
            <DNSticker
              label={statusInfo.label}
              color={statusInfo.color}
              textColor={statusInfo.textColor}
              rotationIndex={1}
            />
            )
          }
        />

        <View style={{ paddingHorizontal: SPACING.gutter }}>
          {/* Date pill */}
          {(proposal.scheduledFor || proposal.dateTime) && (
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
                {new Date(proposal.scheduledFor ?? proposal.dateTime!).toLocaleDateString(undefined, {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </DNText>
            </View>
          )}

          {/* Tally */}
          <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: SPACING.md }}>
            {votedCount} of {totalMembers} voted
          </DNText>

          {/* Invite someone to vote (guest voting share link) */}
          {isOpen && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <DNButton
                label={sharing ? 'Opening…' : '🗳 Invite someone to vote'}
                variant="primary"
                onPress={() => handleInviteToVote(false)}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                onPress={handleCopyLink}
                accessibilityLabel="Copy invite link"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: colors.surface,
                  borderWidth: 1.5,
                  borderColor: colors.line,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...SHADOWS.card,
                }}
              >
                <Text style={{ fontSize: 18 }}>{copied ? '✓' : '📋'}</Text>
              </TouchableOpacity>
            </View>
          )}
          {isOpen && copied && (
            <DNText variant="secondary" color={colors.primary} style={{ marginTop: -SPACING.sm, marginBottom: SPACING.md }}>
              Link copied!
            </DNText>
          )}
          {isOpen && showGuestHint && (
            <View
              style={{
                backgroundColor: colors.primarySoft,
                borderRadius: 14,
                paddingVertical: 10,
                paddingHorizontal: SPACING.md,
                marginBottom: SPACING.md,
              }}
            >
              <DNText variant="secondary" color={colors.primary}>
                Anyone with the link can vote — you'll see their votes come in here.
              </DNText>
            </View>
          )}

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
                  onPress={() => navigation.navigate('CreateProposal', { groupId: proposal.groupId })}
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
            const mySentiment = myVoteMap.get(option.id) ?? null;
            const votedByPartner = partnerVotedOptionId === option.id;
            const displayName = option.name ?? option.title ?? '';
            const displayLocation = option.address ?? option.location ?? '';
            const tallyEntry = proposal.tally?.find((t) => t.optionId === option.id);
            const memberVotes = tallyEntry?.votes ?? option.votes?.length ?? 0;
            const guestVotes = tallyEntry?.guestVotes ?? option.guestVoteCount ?? 0;

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
                  <OptionImageBlock
                    imageUrl={option.imageUrl}
                    category={option.category}
                    height={150}
                    topLeftRadius={radii.topLeft}
                    topRightRadius={radii.topRight}
                  />
                  {/* Stickers over image */}
                  {option.category && (
                    <DNSticker
                      label={option.category}
                      color={colors.primarySoft}
                      textColor={colors.primary}
                      style={{ position: 'absolute', top: 10, left: 10, transform: [{ rotate: '-4deg' }] }}
                    />
                  )}
                  {option.rating != null && (
                    <DNSticker
                      label={`★ ${option.rating.toFixed(1)}`}
                      color={colors.limeSoft}
                      textColor={colors.lime}
                      style={{ position: 'absolute', top: 10, right: 10, transform: [{ rotate: '4deg' }] }}
                    />
                  )}
                </View>

                {/* Card body */}
                <View style={{ padding: SPACING.md, paddingBottom: 20 }}>
                  <DNText variant="heading" color={colors.ink}>
                    {displayName}
                  </DNText>
                  {displayLocation && (
                    <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 4 }}>
                      📍 {displayLocation}
                    </DNText>
                  )}
                  {option.eventDate && (
                    <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 2 }}>
                      📅 {new Date(option.eventDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(option.eventDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                    </DNText>
                  )}
                  {(option.rating != null || option.priceLevel != null) && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                      {option.rating != null && (
                        <DNText variant="secondary" color={colors.lime}>★ {option.rating.toFixed(1)}</DNText>
                      )}
                      {option.priceLevel != null && (
                        <DNText variant="secondary" color={colors.ink2}>{'$'.repeat(option.priceLevel)}</DNText>
                      )}
                    </View>
                  )}
                  {option.sourceUrl && (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(option.sourceUrl!)}
                      style={{ marginTop: 6 }}
                    >
                      <DNText variant="secondary" color={colors.primary}>View Details →</DNText>
                    </TouchableOpacity>
                  )}
                  {(memberVotes > 0 || guestVotes > 0) && (
                    <DNText variant="secondary" color={colors.ink2} style={{ marginTop: 6, opacity: 0.8 }}>
                      {memberVotes} {memberVotes === 1 ? 'vote' : 'votes'}
                      {guestVotes > 0 ? ` · +${guestVotes} guest` : ''}
                    </DNText>
                  )}
                </View>

                {/* Vote buttons */}
                {isOpen && (
                  <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.md }}>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                      {/* APPROVE */}
                      <Pressable
                        style={[styles.voteBtn, mySentiment === 'APPROVE' && styles.voteBtnApprove]}
                        onPress={() => handleVote(option.id, 'APPROVE')}
                      >
                        <Text style={[styles.voteBtnText, mySentiment === 'APPROVE' && { color: '#fff' }]}>
                          {mySentiment === 'APPROVE' ? "✓ I'm in 👍" : "I'm in 👍"}
                        </Text>
                      </Pressable>
                      {/* MAYBE */}
                      <Pressable
                        style={[styles.voteBtn, styles.voteBtnMaybeBase, mySentiment === 'MAYBE' && styles.voteBtnMaybe]}
                        onPress={() => handleVote(option.id, 'MAYBE')}
                      >
                        <Text style={[styles.voteBtnText, { color: mySentiment === 'MAYBE' ? '#fff' : '#92400E' }]}>
                          {mySentiment === 'MAYBE' ? '✓ Maybe 🤔' : 'Maybe 🤔'}
                        </Text>
                      </Pressable>
                      {/* REJECT */}
                      <Pressable
                        style={[styles.voteBtn, styles.voteBtnRejectBase, mySentiment === 'REJECT' && styles.voteBtnReject]}
                        onPress={() => handleVote(option.id, 'REJECT')}
                      >
                        <Text style={[styles.voteBtnText, { color: mySentiment === 'REJECT' ? '#fff' : '#6B7280' }]}>
                          {mySentiment === 'REJECT' ? "✗ No 🙅" : "Don't think so 🙅"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                )}

                {/* Partner sticker */}
                {votedByPartner && (
                  <View style={{ position: 'absolute', bottom: isOpen ? 60 : 12, right: 12 }}>
                    <DNSticker
                      label={`${partnerName ?? 'Partner'} ♥`}
                      color={colors.limeSoft}
                      textColor={colors.lime}
                      size="sm"
                    />
                  </View>
                )}
              </View>
            );
          })}

          {/* Done voting banner */}
          {myVoteMap.size > 0 && proposal?.status === 'OPEN' && (
            <View style={{ marginTop: 12 }}>
              <Pressable
                onPress={() => {
                  const name = proposerName || 'them';
                  Share.share({ message: `Hey! I'm in for our plan — check it out 👍` });
                }}
                style={{
                  height: 48,
                  borderTopLeftRadius: 22,
                  borderTopRightRadius: 16,
                  borderBottomRightRadius: 22,
                  borderBottomLeftRadius: 16,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                }}
              >
                <Text style={{ fontFamily: 'Sora_700Bold', fontSize: 15, color: '#fff' }}>
                  Let {proposerName || 'them'} know 👍
                </Text>
              </Pressable>
              <Text style={{
                textAlign: 'center',
                marginTop: 8,
                fontFamily: 'Sora_700Bold',
                fontSize: 13,
                color: colors.primaryDeep ?? colors.primary,
              }}>
                You've voted on {myVoteMap.size} option{myVoteMap.size !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* DECIDED: gentle next-step nudge (share stays primary in the header) */}
          {isDecided && (
            <View style={{ alignItems: 'center', marginTop: SPACING.sm, marginBottom: SPACING.md }}>
              <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center', marginBottom: SPACING.xs }}>
                Relive it later — the plan stays right here.
              </DNText>
              <TouchableOpacity
                onPress={() => navigation.navigate('Suggestions', {})}
                style={{ minHeight: 44, justifyContent: 'center' }}
              >
                <DNText variant="secondary" color={colors.primary} style={{ textAlign: 'center', fontWeight: '700' }}>
                  Ready for the next one? →
                </DNText>
              </TouchableOpacity>
            </View>
          )}
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
                {winningName}
              </DNText>
              <DNButton
                label="Add to calendar"
                variant="primary"
                onPress={handleAddToCalendar}
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

const styles = StyleSheet.create({
  voteBtn: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#D9F1F0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  voteBtnApprove: { backgroundColor: '#0E8C8C' },
  voteBtnMaybeBase: { backgroundColor: '#FEF3C7' },
  voteBtnMaybe: { backgroundColor: '#F59E0B' },
  voteBtnRejectBase: { backgroundColor: '#F3F4F6' },
  voteBtnReject: { backgroundColor: '#9CA3AF' },
  voteBtnText: {
    fontFamily: 'Sora_700Bold',
    fontSize: 11,
    color: '#086B6B',
    textAlign: 'center',
  },
});
