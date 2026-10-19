// TODO i18n: instrument with useTranslation() — translations in src/locales/{en,es}/translation.json
/**
 * AfterDarkScreen — late-night mode (21:00–03:00)
 *
 * Shows:
 *  - Status header: active / countdown
 *  - Mood selector (6 moods)
 *  - Suggestion feed filtered for late-night categories, ranked by mood
 *  - "Let's Go NOW" impulse button → picks top suggestion and creates proposal
 *
 * Route params: { groupId?: string }  (needed for Impulse)
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlanBuilder } from '@/contexts/PlanBuilderContext';
import { CARD_RADII, SHADOWS, SPACING, TYPE } from '@/constants';
import { DNButton, DNScreenHeader, DNSticker, DNText } from '@/components/ui';
import { AddToDateButton } from '@/components/AddToDateButton';
import { afterDarkAPI } from '@/services/api';
import { api } from '@/services/api';
import type { AfterDarkStatus, AfterDarkMood, AfterDarkSuggestion, AfterDarkItem, RootStackParamList } from '@/types';

type RouteT = RouteProp<RootStackParamList, 'AfterDark'>;

// ── Mood config ────────────────────────────────────────────────────────────────
const MOODS: { key: AfterDarkMood; emoji: string; label: string; tagline: string }[] = [
  { key: 'adventurous', emoji: '🧗', label: 'Adventurous', tagline: 'Surprise us' },
  { key: 'romantic',    emoji: '💫', label: 'Romantic',    tagline: 'Just the two of us' },
  { key: 'social',      emoji: '🥂', label: 'Social',      tagline: 'Good vibes & people' },
  { key: 'chill',       emoji: '🌙', label: 'Chill',       tagline: 'Low-key night' },
  { key: 'spontaneous', emoji: '⚡', label: 'Spontaneous', tagline: 'Whatever, let\'s go' },
  { key: 'cultural',    emoji: '🎨', label: 'Cultural',    tagline: 'Art, music, scene' },
];

const CATEGORY_EMOJI: Record<string, string> = {
  'Live Music':       '🎵',
  Comedy:             '😂',
  'Wine & Drinks':    '🍷',
  Dining:             '🍽️',
  'Unique & Quirky':  '✨',
  'Local Experience': '📍',
};

// ── Countdown to 21:00 ────────────────────────────────────────────────────────
function Countdown({ minutes }: { minutes: number }) {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const toGo = h > 0 ? `${h}h ${m}m to go` : `${m}m to go`;

  return (
    <View style={{ alignItems: 'center', paddingVertical: SPACING.lg }}>
      <Text style={{ fontSize: 48, marginBottom: SPACING.sm }}>🌆</Text>
      <DNText variant="title" color={colors.ink} style={{ textAlign: 'center', marginBottom: SPACING.xs }}>
        After Dark wakes up at 9pm 🌙
      </DNText>
      <DNText variant="secondary" color={colors.ink2} style={{ textAlign: 'center', marginBottom: SPACING.md }}>
        {toGo} — late-night mode is worth the wait
      </DNText>
      <DNButton
        label="Meanwhile, plan something for tonight →"
        variant="secondary"
        onPress={() => navigation.navigate('Suggestions', {})}
      />
    </View>
  );
}

// ── Mood chip ─────────────────────────────────────────────────────────────────
function MoodChip({
  mood,
  isSelected,
  onPress,
}: {
  mood: typeof MOODS[number];
  isSelected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.04, duration: 160, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.0, duration: 100, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.85}
        style={[
          {
            paddingVertical: 10,
            paddingHorizontal: 14,
            borderRadius: 20,
            borderWidth: 1.5,
            borderColor: isSelected ? colors.primary : colors.line,
            backgroundColor: isSelected ? colors.primarySoft : colors.surface,
            alignItems: 'center',
            minWidth: 96,
          },
          SHADOWS.card,
        ]}
      >
        <Text style={{ fontSize: 22, marginBottom: 2 }}>{mood.emoji}</Text>
        <Text style={[TYPE.buttonSm, { color: isSelected ? colors.primary : colors.ink }]}>
          {mood.label}
        </Text>
        <Text style={[TYPE.secondary, { color: colors.ink2, fontSize: 10 }]} numberOfLines={1}>
          {mood.tagline}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Suggestion card ───────────────────────────────────────────────────────────
function SuggestionCard({
  item,
  index,
  onImpulse,
}: {
  item: AfterDarkSuggestion;
  index: number;
  onImpulse: (item: AfterDarkSuggestion) => void;
}) {
  const { colors } = useTheme();
  const radii = CARD_RADII[index % 4];
  const emoji = CATEGORY_EMOJI[item.category] ?? '🌙';

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radii.topLeft,
          borderTopRightRadius: radii.topRight,
          borderBottomRightRadius: radii.bottomRight,
          borderBottomLeftRadius: radii.bottomLeft,
          padding: SPACING.md,
          marginBottom: SPACING.md,
        },
        SHADOWS.card,
      ]}
    >
      {/* Header row */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.sm,
          }}
        >
          <Text style={{ fontSize: 22 }}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <DNText variant="heading" color={colors.ink} numberOfLines={2}>
            {item.name}
          </DNText>
          {item.venue ? (
            <DNText variant="secondary" color={colors.ink2} numberOfLines={1}>
              {item.venue}
            </DNText>
          ) : null}
        </View>

        {/* Cost sticker */}
        {item.costTier !== 'free' ? (
          <DNSticker
            label={item.price ?? item.costTier}
            color={colors.limeSoft}
            textColor={colors.lime}
            size="sm"
            rotationIndex={index % 4}
          />
        ) : (
          <DNSticker
            label="FREE"
            color={colors.primarySoft}
            textColor={colors.primary}
            size="sm"
            rotationIndex={index % 4}
          />
        )}
      </View>

      {/* Description */}
      {item.shortDescription ? (
        <DNText variant="secondary" color={colors.ink2} style={{ marginBottom: SPACING.sm }} numberOfLines={2}>
          {item.shortDescription}
        </DNText>
      ) : null}

      {/* Meta pills */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: SPACING.sm }}>
        {item.address ? (
          <View style={[styles.metaPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[TYPE.secondary, { color: colors.primary, fontSize: 11 }]} numberOfLines={1}>
              📍 {item.address}
            </Text>
          </View>
        ) : null}
        {item.distanceMiles !== undefined ? (
          <View style={[styles.metaPill, { backgroundColor: colors.primarySoft }]}>
            <Text style={[TYPE.secondary, { color: colors.primary, fontSize: 11 }]}>
              {item.distanceMiles.toFixed(1)} mi
            </Text>
          </View>
        ) : null}
        {item.date ? (
          <View style={[styles.metaPill, { backgroundColor: colors.warningSoft }]}>
            <Text style={[TYPE.secondary, { color: colors.onWarningSoft, fontSize: 11 }]}>
              📅 {item.timeStart ?? item.date}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Impulse CTA */}
      <TouchableOpacity
        onPress={() => onImpulse(item)}
        activeOpacity={0.82}
        style={{
          height: 38,
          backgroundColor: colors.primarySoft,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={[TYPE.buttonSm, { color: colors.primary }]}>
          ⚡ Let's go here
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Impulse confirmation sheet ────────────────────────────────────────────────
function ImpulseSheet({
  visible,
  item,
  groupId,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  item: AfterDarkSuggestion | null;
  groupId: string | undefined;
  onClose: () => void;
  onSuccess: (proposalId: string) => void;
}) {
  const { colors } = useTheme();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation<any>();

  if (!item) return null;

  const handleConfirm = async () => {
    if (!groupId) {
      setError('No group selected. Go back and open After Dark from a group.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await afterDarkAPI.impulse(
        groupId,
        item.name,
        item.category,
        item.address,
      );
      onSuccess(res.data.proposal.id);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? 'Failed to create impulse proposal');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <View
          style={[
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              padding: SPACING.xl,
              paddingBottom: SPACING.xl + 16,
            },
            SHADOWS.dock,
          ]}
        >
          <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: SPACING.sm }}>
            ⚡
          </Text>
          <DNText
            variant="title"
            color={colors.ink}
            style={{ textAlign: 'center', marginBottom: SPACING.xs }}
          >
            Let's go!
          </DNText>
          <DNText
            variant="body"
            color={colors.ink2}
            style={{ textAlign: 'center', marginBottom: SPACING.lg }}
          >
            This creates a spontaneous proposal for{'\n'}
            <Text style={{ color: colors.primary }}>{item.name}</Text>
            {'\n'}with your group — tonight, 2 hours from now.
          </DNText>

          {error ? (
            <View
              style={{
                backgroundColor: colors.errorSoft,
                borderRadius: 12,
                padding: SPACING.sm,
                marginBottom: SPACING.md,
              }}
            >
              <DNText variant="secondary" color={colors.error}>{error}</DNText>
            </View>
          ) : null}

          <DNButton
            label={sending ? 'Sending…' : '⚡ Create impulse proposal'}
            onPress={handleConfirm}
            loading={sending}
            variant="primary"
            style={{ marginBottom: SPACING.sm }}
          />
          <DNButton label="Cancel" onPress={onClose} variant="secondary" />
        </View>
      </View>
    </Modal>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AfterDarkScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteT>();
  const groupId = route.params?.groupId;
  const { addOption } = usePlanBuilder();

  const [activeGroupId, setActiveGroupId] = useState<string | undefined>(groupId);

  // If no groupId from route, fetch user's first group
  useEffect(() => {
    if (!groupId) {
      api.get('/groups').then(res => {
        const groups = res.data?.groups || res.data || [];
        if (groups.length > 0) {
          setActiveGroupId(groups[0].id);
        }
      }).catch(() => {});
    } else {
      setActiveGroupId(groupId);
    }
  }, [groupId]);

  const [status, setStatus] = useState<AfterDarkStatus | null>(null);
  const [selectedMood, setSelectedMood] = useState<AfterDarkMood | null>(null);
  const [suggestions, setSuggestions] = useState<AfterDarkSuggestion[]>([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [settingMood, setSettingMood] = useState(false);
  const [impulseItem, setImpulseItem] = useState<AfterDarkSuggestion | null>(null);
  const [showImpulse, setShowImpulse] = useState(false);

  // Catalog state
  const [catalogItems, setCatalogItems] = useState<AfterDarkItem[]>([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<AfterDarkItem | null>(null);

  // Glow pulse for the dark banner
  const glowAnim = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.7, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const offset = -new Date().getTimezoneOffset(); // minutes
      const res = await afterDarkAPI.status(offset);
      setStatus(res.data);
      setSelectedMood(res.data.currentMood ?? null);
    } catch (err) {
      console.warn('AfterDark status failed', err);
    }
  }, []);

  const loadSuggestions = useCallback(async (mood?: AfterDarkMood | null) => {
    setLoadingSugg(true);
    try {
      const res = await afterDarkAPI.suggestions({ mood: mood ?? undefined });
      setSuggestions(res.data.suggestions ?? []);
    } catch (err) {
      console.warn('AfterDark suggestions failed', err);
    } finally {
      setLoadingSugg(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    if (status?.active) {
      loadSuggestions(selectedMood);
    }
  }, [status?.active]);

  // Load catalog items on mount
  useEffect(() => {
    afterDarkAPI.getItems({ limit: 40 })
      .then((res) => {
        const data = res.data as { items?: AfterDarkItem[] };
        setCatalogItems(data.items ?? []);
      })
      .catch(() => {
        console.warn('AfterDark catalog load failed');
      });
  }, []);

  const handleMoodSelect = async (mood: AfterDarkMood) => {
    const prev = selectedMood;
    setSelectedMood(mood);
    setSettingMood(true);
    try {
      await afterDarkAPI.setMood(mood);
      await loadSuggestions(mood);
    } catch {
      setSelectedMood(prev); // revert on error
    } finally {
      setSettingMood(false);
    }
  };

  const handleImpulse = (item: AfterDarkSuggestion) => {
    setImpulseItem(item);
    setShowImpulse(true);
  };

  const handleImpulseSuccess = (proposalId: string) => {
    setShowImpulse(false);
    navigation.navigate('ProposalDetail', { proposalId });
  };

  const isActive = status?.active ?? false;

  return (
    <View style={{ flex: 1, backgroundColor: isActive ? '#0A1018' : colors.bg }}>
      <DNScreenHeader
        title="After Dark 🌙"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.gutter, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status banner */}
        {isActive ? (
          <Animated.View
            style={[
              {
                backgroundColor: '#111827',
                borderRadius: 28,
                padding: SPACING.lg,
                marginBottom: SPACING.lg,
                alignItems: 'center',
                opacity: glowAnim,
              },
              SHADOWS.dock,
            ]}
          >
            <Text style={{ fontSize: 48, marginBottom: SPACING.sm }}>🌙</Text>
            <Text style={[TYPE.title, { color: '#ffffff', textAlign: 'center', marginBottom: SPACING.xs }]}>
              After Dark is on
            </Text>
            <Text style={[TYPE.secondary, { color: 'rgba(255,255,255,0.6)', textAlign: 'center' }]}>
              Active until 3 AM · Late-night mode
            </Text>
          </Animated.View>
        ) : (
          <View
            style={[
              {
                backgroundColor: colors.surface,
                borderRadius: 28,
                padding: SPACING.lg,
                marginBottom: SPACING.lg,
              },
              SHADOWS.card,
            ]}
          >
            <Countdown minutes={status?.minutesUntilActive ?? 0} />
          </View>
        )}

        {/* Mood selector */}
        <Text
          style={[
            TYPE.section,
            { color: isActive ? 'rgba(255,255,255,0.5)' : colors.ink2, marginBottom: SPACING.sm },
          ]}
        >
          What's the vibe?
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 10, paddingBottom: SPACING.sm, paddingRight: SPACING.gutter }}
          style={{ marginHorizontal: -SPACING.gutter, paddingHorizontal: SPACING.gutter, marginBottom: SPACING.lg }}
        >
          {MOODS.map((m) => (
            <MoodChip
              key={m.key}
              mood={m}
              isSelected={selectedMood === m.key}
              onPress={() => handleMoodSelect(m.key)}
            />
          ))}
        </ScrollView>

        {/* Romantic & Spicy Ideas Catalog */}
        {catalogItems.length > 0 && (
          <View style={{ marginBottom: SPACING.lg }}>
            <Text
              style={[
                TYPE.section,
                { color: isActive ? 'rgba(255,255,255,0.5)' : colors.ink2, marginBottom: SPACING.sm },
              ]}
            >
              Romantic & Spicy Ideas
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: SPACING.gutter }}
              style={{ marginHorizontal: -SPACING.gutter, paddingHorizontal: SPACING.gutter }}
            >
              {catalogItems.map((item) => {
                const isDark = ['#2D1B2E', '#8E3448', '#4A1525', '#B2485E'].includes(item.color);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setSelectedCatalogItem(item)}
                    activeOpacity={0.82}
                    style={{
                      backgroundColor: item.color,
                      borderRadius: 18,
                      padding: 16,
                      width: 140,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 32, marginBottom: 8 }}>{item.icon}</Text>
                    <Text
                      style={{
                        fontFamily: 'Sora-Bold',
                        fontSize: 12,
                        color: isDark ? '#F7E3E7' : '#2D1020',
                        textAlign: 'center',
                        lineHeight: 16,
                      }}
                      numberOfLines={2}
                    >
                      {item.title}
                    </Text>
                    <View
                      style={{
                        marginTop: 6,
                        backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(45,16,32,0.1)',
                        borderRadius: 100,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}
                    >
                      <Text style={{ fontSize: 10, color: isDark ? '#F7E3E7' : '#2D1020' }}>
                        {item.tier === 'ROMANTIC' ? '💫 Romantic' : '🔥 Spicy'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Catalog item detail modal */}
        {selectedCatalogItem && (
          <Modal
            transparent
            animationType="slide"
            visible={!!selectedCatalogItem}
            onRequestClose={() => setSelectedCatalogItem(null)}
          >
            <TouchableOpacity
              style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
              activeOpacity={1}
              onPress={() => setSelectedCatalogItem(null)}
            />
            <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
              <View
                style={[
                  {
                    backgroundColor: selectedCatalogItem.color,
                    borderTopLeftRadius: 32,
                    borderTopRightRadius: 32,
                    padding: SPACING.xl,
                    paddingBottom: SPACING.xl + 16,
                    alignItems: 'center',
                  },
                  SHADOWS.dock,
                ]}
              >
                {(() => {
                  const isDark = ['#2D1B2E', '#8E3448', '#4A1525', '#B2485E'].includes(selectedCatalogItem.color);
                  const textColor = isDark ? '#F7E3E7' : '#2D1020';
                  const subColor = isDark ? 'rgba(247,227,231,0.7)' : 'rgba(45,16,32,0.65)';
                  return (
                    <>
                      <Text style={{ fontSize: 48, marginBottom: SPACING.sm }}>{selectedCatalogItem.icon}</Text>
                      <DNText variant="title" style={{ color: textColor, textAlign: 'center', marginBottom: SPACING.xs }}>
                        {selectedCatalogItem.title}
                      </DNText>
                      <DNText variant="body" style={{ color: subColor, textAlign: 'center', marginBottom: SPACING.lg }}>
                        {selectedCatalogItem.description}
                      </DNText>
                      <View
                        style={{
                          backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(45,16,32,0.1)',
                          borderRadius: 100,
                          paddingHorizontal: 14,
                          paddingVertical: 5,
                          marginBottom: SPACING.lg,
                        }}
                      >
                        <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>
                          {selectedCatalogItem.tier === 'ROMANTIC' ? '💫 Romantic' : '🔥 Spicy'}
                        </Text>
                      </View>
                      <AddToDateButton
                        onPress={() => {
                          addOption({
                            name: selectedCatalogItem.title,
                            category: 'After Dark',
                            description: selectedCatalogItem.description,
                          });
                          setSelectedCatalogItem(null);
                          navigation.navigate('CreateProposal', {});
                        }}
                        style={{ width: '100%', marginBottom: SPACING.sm }}
                      />
                      <DNButton
                        label="Close"
                        variant="secondary"
                        onPress={() => setSelectedCatalogItem(null)}
                        style={{ width: '100%' }}
                      />
                    </>
                  );
                })()}
              </View>
            </View>
          </Modal>
        )}

        {/* Suggestions */}
        {isActive ? (
          <>
            <Text
              style={[TYPE.section, { color: 'rgba(255,255,255,0.5)', marginBottom: SPACING.md }]}
            >
              {settingMood ? 'Updating…' : selectedMood ? `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} picks` : "Tonight\u2019s picks"}
            </Text>

            {loadingSugg ? (
              <View style={{ paddingVertical: SPACING.xl, alignItems: 'center' }}>
                <Text style={[TYPE.body, { color: 'rgba(255,255,255,0.4)' }]}>
                  Finding late-night spots…
                </Text>
              </View>
            ) : suggestions.length === 0 ? (
              <View style={{ paddingVertical: SPACING.xl, alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: SPACING.sm }}>🌃</Text>
                <Text style={[TYPE.body, { color: 'rgba(255,255,255,0.4)', textAlign: 'center' }]}>
                  No suggestions found nearby.{'\n'}Try a different mood or set your location.
                </Text>
              </View>
            ) : (
              suggestions.slice(0, 20).map((item, i) => (
                <SuggestionCard
                  key={item.id}
                  item={item}
                  index={i}
                  onImpulse={handleImpulse}
                />
              ))
            )}
          </>
        ) : (
          /* Pre-active state — preview moods only */
          <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
            <Text style={{ fontSize: 32, marginBottom: SPACING.sm }}>👀</Text>
            <DNText
              variant="body"
              color={colors.ink2}
              style={{ textAlign: 'center' }}
            >
              Set your vibe above — suggestions unlock when After Dark starts.
            </DNText>
          </View>
        )}
      </ScrollView>

      {/* Floating "Let's go NOW" FAB — only when active + suggestions loaded */}
      {isActive && suggestions.length > 0 && (
        <View
          style={{
            position: 'absolute',
            bottom: SPACING.xl,
            left: SPACING.gutter,
            right: SPACING.gutter,
          }}
        >
          <TouchableOpacity
            onPress={() => handleImpulse(suggestions[0])}
            activeOpacity={0.88}
            style={[
              {
                backgroundColor: colors.lime,
                borderRadius: 24,
                paddingVertical: 16,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 8,
              },
              SHADOWS.dock,
            ]}
          >
            <Text style={{ fontSize: 20 }}>⚡</Text>
            <Text style={[TYPE.button, { color: colors.bg }]}>Let's go NOW</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Impulse sheet */}
      <ImpulseSheet
        visible={showImpulse}
        item={impulseItem}
        groupId={activeGroupId}
        onClose={() => setShowImpulse(false)}
        onSuccess={handleImpulseSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  metaPill: {
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
});
