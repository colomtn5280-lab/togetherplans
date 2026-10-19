/**
 * ShareCardScreen — display a generated share card for a DECIDED proposal
 * and let the user share it via the native share sheet.
 *
 * Route params: { proposalId: string }
 * Accessed from ProposalDetailScreen when status === 'DECIDED'.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { CARD_RADII, SHADOWS, SPACING, STICKER_ROTATIONS, TYPE } from '@/constants';
import { DNButton, DNScreenHeader, DNSticker, DNText } from '@/components/ui';
import { shareCardsAPI } from '@/services/api';
import type { RootStackParamList, ShareCard } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'ShareCard'>;

const CATEGORY_EMOJI: Record<string, string> = {
  Dining:             '🍽️',
  'Live Music':       '🎵',
  Comedy:             '😂',
  'Theater & Plays':  '🎭',
  Movies:             '🎬',
  'Streaming Night':  '📺',
  Outdoors:           '🌿',
  'Day Trip':         '🚗',
  'Wine & Drinks':    '🍷',
  'Arts & Culture':   '🎨',
  Active:             '🏃',
  'Local Experience': '📍',
  'Unique & Quirky':  '✨',
};

// ── Animated entrance helper ──────────────────────────────────────────────────
function useFadeSlide(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

// ── Vote bar for each option ──────────────────────────────────────────────────
function OptionRow({
  name,
  voteCount,
  totalVotes,
  isWinner,
  index,
}: {
  name: string;
  voteCount: number;
  totalVotes: number;
  isWinner: boolean;
  index: number;
}) {
  const { colors } = useTheme();
  const pct = totalVotes > 0 ? voteCount / totalVotes : 0;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct,
      duration: 700,
      delay: 200 + index * 80,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text
          style={[
            TYPE.rowLabel,
            { color: isWinner ? colors.primary : colors.ink, flex: 1, marginRight: 8 },
          ]}
          numberOfLines={1}
        >
          {isWinner ? '🏆 ' : ''}{name}
        </Text>
        <Text style={[TYPE.secondary, { color: colors.ink2 }]}>
          {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
        </Text>
      </View>
      <View
        style={{
          height: 8,
          backgroundColor: colors.line,
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Animated.View
          style={{
            height: 8,
            backgroundColor: isWinner ? colors.lime : colors.primarySoft,
            borderRadius: 4,
            width: barAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ShareCardScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute<RouteT>();
  const { proposalId } = route.params;

  const [card, setCard] = useState<ShareCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const heroAnim = useFadeSlide(0);
  const contentAnim = useFadeSlide(120);
  const actionsAnim = useFadeSlide(240);

  const radii = CARD_RADII[0];

  const load = useCallback(async () => {
    try {
      const res = await shareCardsAPI.generate(proposalId);
      setCard(res.data);
    } catch (err) {
      console.warn('ShareCard load failed', err);
    } finally {
      setLoading(false);
    }
  }, [proposalId]);

  useEffect(() => { load(); }, [load]);

  const handleShare = async () => {
    if (!card) return;
    setSharing(true);
    try {
      const emoji = card.winningOption?.emoji ?? '📅';
      await Share.share({
        title: card.og.title,
        message: [
          card.og.title,
          card.og.description,
          '',
          `📲 See the plan: ${card.shareUrl}`,
        ].filter(Boolean).join('\n'),
        url: card.shareUrl,
      });
    } catch {
      // user cancelled — noop
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={[TYPE.body, { color: colors.ink2 }]}>{t('shareCard.building')}</Text>
      </View>
    );
  }

  if (!card) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', padding: SPACING.gutter }}>
        <Text style={[TYPE.heading, { color: colors.ink, textAlign: 'center', marginBottom: SPACING.md }]}>
          {t('shareCard.couldntLoad')}
        </Text>
        <DNButton label={t('common.retry')} onPress={load} variant="secondary" />
      </View>
    );
  }

  const winner = card.winningOption;
  const emoji = winner ? (CATEGORY_EMOJI[winner.category] ?? '📅') : '📅';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <DNScreenHeader
        title={t('shareCard.title')}
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero card */}
        <Animated.View style={heroAnim}>
          <View
            style={[
              {
                backgroundColor: colors.primary,
                borderTopLeftRadius: radii.topLeft,
                borderTopRightRadius: radii.topRight,
                borderBottomRightRadius: radii.bottomRight,
                borderBottomLeftRadius: radii.bottomLeft,
                padding: SPACING.xl,
                marginBottom: SPACING.md,
                alignItems: 'center',
              },
              SHADOWS.dock,
            ]}
          >
            {/* Decorative circle */}
            <View
              style={{
                position: 'absolute',
                top: -30,
                right: -30,
                width: 140,
                height: 140,
                borderRadius: 70,
                backgroundColor: colors.lime,
                opacity: 0.18,
              }}
            />

            <DNSticker
              label="DECIDED"
              color={colors.lime}
              textColor={colors.bg}
              rotationIndex={1}
              style={{ marginBottom: SPACING.md, alignSelf: 'flex-start' }}
            />

            <Text style={{ fontSize: 56, marginBottom: SPACING.sm }}>{emoji}</Text>

            <Text
              style={[
                TYPE.title,
                { color: colors.onPrimary, textAlign: 'center', marginBottom: SPACING.xs },
              ]}
            >
              {winner?.name ?? card.title}
            </Text>

            <Text style={[TYPE.secondary, { color: 'rgba(255,255,255,0.75)', textAlign: 'center' }]}>
              {card.groupName}
            </Text>

            {/* Date + address pills */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: SPACING.md }}>
              <View style={styles.pill}>
                <Text style={[TYPE.secondary, { color: colors.primary }]}>
                  📅 {card.dateFormatted}
                </Text>
              </View>
              <View style={styles.pill}>
                <Text style={[TYPE.secondary, { color: colors.primary }]}>
                  🕐 {card.timeFormatted}
                </Text>
              </View>
              {winner?.address ? (
                <View style={styles.pill}>
                  <Text style={[TYPE.secondary, { color: colors.primary }]} numberOfLines={1}>
                    📍 {winner.address}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </Animated.View>

        {/* Vote breakdown */}
        <Animated.View style={contentAnim}>
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: 24,
                padding: SPACING.md,
                marginBottom: SPACING.md,
              },
              SHADOWS.card,
            ]}
          >
            <Text style={[TYPE.section, { color: colors.ink2, marginBottom: SPACING.md }]}>
              {t('shareCard.howVoted')}
            </Text>

            {card.allOptions.map((opt, i) => (
              <OptionRow
                key={opt.id}
                name={opt.name}
                voteCount={opt.voteCount}
                totalVotes={card.totalVotes}
                isWinner={opt.isWinner}
                index={i}
              />
            ))}

            <Text style={[TYPE.secondary, { color: colors.ink2, marginTop: 4 }]}>
              {card.totalVotes} total {card.totalVotes === 1 ? 'vote' : 'votes'}
            </Text>
          </View>
        </Animated.View>

        {/* Share URL chip */}
        <Animated.View style={contentAnim}>
          <View
            style={[
              {
                backgroundColor: colors.primarySoft,
                borderRadius: 16,
                padding: SPACING.md,
                marginBottom: SPACING.lg,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              },
            ]}
          >
            <Text style={{ fontSize: 18 }}>🔗</Text>
            <Text
              style={[TYPE.secondary, { color: colors.primary, flex: 1 }]}
              numberOfLines={1}
            >
              {card.shareUrl}
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Sticky share button */}
      <Animated.View
        style={[
          actionsAnim,
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.bg,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            padding: SPACING.gutter,
            paddingBottom: SPACING.lg + 8,
            gap: 10,
          },
        ]}
      >
        <DNButton
          label={sharing ? t('shareCard.sharing') : t('shareCard.shareWithFriends')}
          onPress={handleShare}
          variant="primary"
          loading={sharing}
          style={{ width: '100%' }}
        />
        {winner?.ticketUrl ? (
          <DNButton
            label={t('shareCard.getTickets')}
            onPress={() => {
              // Open ticket URL — requires Linking
              const { Linking } = require('react-native');
              Linking.openURL(winner.ticketUrl!).catch(() => {});
            }}
            variant="secondary"
            style={{ width: '100%' }}
          />
        ) : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
});
