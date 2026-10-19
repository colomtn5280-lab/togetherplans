/**
 * OnboardingScreen — DateNight v2 (slides 4a–4c)
 * Shown once after Register. Stores hasOnboarded in AsyncStorage.
 */
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import { TYPE, SPACING, SHADOWS, CARD_RADII } from '@/constants';
import { DNButton, DNText, DNCard, DNSticker, DNInput } from '@/components/ui';
import { FavCategoryChips, saveFavCategories } from '@/components/FavCategories';
import { groupsAPI } from '@/services/api';
import { RootStackParamList } from '@/types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

const { width: SCREEN_W } = Dimensions.get('window');
const ONBOARDED_KEY = 'hasOnboarded';

type GroupType = 'Couple' | 'Friends' | 'Family';

async function markOnboarded() {
  await AsyncStorage.setItem(ONBOARDED_KEY, '1');
}

// ─── Slide 1 illustration ──────────────────────────────────────────────────────
function ChatBubblesIllustration() {
  const { colors } = useTheme();
  const r0 = CARD_RADII[0];
  const r1 = CARD_RADII[1];
  return (
    <View style={illustStyles.root}>
      {/* '47 MESSAGES LATER' sticker — above both bubbles */}
      <DNSticker
        label="47 MESSAGES LATER"
        color={colors.primary}
        textColor={colors.onPrimary}
        rotationIndex={0}
        style={illustStyles.sticker}
      />
      {/* Bubble A */}
      <View
        style={[
          illustStyles.bubble,
          {
            backgroundColor: colors.ink,
            borderTopLeftRadius: r0.topLeft,
            borderTopRightRadius: r0.topRight,
            borderBottomRightRadius: r0.bottomRight,
            borderBottomLeftRadius: r0.bottomLeft,
            transform: [{ rotate: '-4deg' }],
            marginRight: 24,
          },
        ]}
      >
        <Text style={[TYPE.body, { color: colors.onPrimary ?? '#FFFFFF' }]}>What should we do?</Text>
      </View>
      {/* Bubble B */}
      <View
        style={[
          illustStyles.bubble,
          {
            backgroundColor: colors.primarySoft,
            borderTopLeftRadius: r1.topLeft,
            borderTopRightRadius: r1.topRight,
            borderBottomRightRadius: r1.bottomRight,
            borderBottomLeftRadius: r1.bottomLeft,
            transform: [{ rotate: '3deg' }],
            marginLeft: 24,
          },
        ]}
      >
        <Text style={[TYPE.body, { color: colors.primary }]}>Idk, what do YOU want?</Text>
      </View>
    </View>
  );
}

const illustStyles = StyleSheet.create({
  root: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  sticker: { marginBottom: 4, zIndex: 10 },
  bubble: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    maxWidth: SCREEN_W * 0.6,
    ...SHADOWS.card,
  },
});

// ─── Slide 2 illustration ──────────────────────────────────────────────────────
function OptionCardsIllustration() {
  const { colors } = useTheme();
  const activities = ['🎬 Movie night', '🍕 Dinner out', '🎳 Bowling'];
  return (
    <View style={optStyles.root}>
      <DNSticker
        label="LOCKED IN 🎉"
        color={colors.lime}
        textColor="#101820"
        rotationIndex={1}
        style={optStyles.sticker}
      />
      {activities.map((act, i) => {
        const r = CARD_RADII[i % 4];
        const rotation = i === 0 ? '-3deg' : i === 1 ? '0deg' : '3deg';
        const isWinner = i === 1;
        return (
          <View
            key={act}
            style={[
              optStyles.card,
              {
                backgroundColor: isWinner ? colors.primarySoft : colors.surface,
                borderTopLeftRadius: r.topLeft,
                borderTopRightRadius: r.topRight,
                borderBottomRightRadius: r.bottomRight,
                borderBottomLeftRadius: r.bottomLeft,
                borderWidth: isWinner ? 2 : 0,
                borderColor: isWinner ? colors.primary : undefined,
                transform: [{ rotate: rotation }],
              },
              SHADOWS.card,
            ]}
          >
            <Text style={[TYPE.body, { color: isWinner ? colors.primary : colors.ink }]}>{act}</Text>
            {isWinner && (
              <Text style={{ marginLeft: 'auto', fontSize: 18 }}>🤍</Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const optStyles = StyleSheet.create({
  root: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  sticker: { marginBottom: 4, zIndex: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    width: SCREEN_W * 0.72,
  },
});

// ─── Dots ──────────────────────────────────────────────────────────────────────
function Dots({ current, total }: { current: number; total: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: SPACING.lg }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i === current ? colors.primary : 'transparent',
            borderWidth: i === current ? 0 : 1.5,
            borderColor: colors.primary,
          }}
        />
      ))}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function OnboardingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [slide, setSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Slide 3 state — favorite categories (fully skippable)
  const [favIds, setFavIds] = useState<string[]>([]);

  // Slide 4 state
  const [selectedGroup, setSelectedGroup] = useState<GroupType>('Couple');
  const [groupName, setGroupName] = useState('');
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupError, setGroupError] = useState('');

  const TOTAL = 4;

  const persistFavs = async () => {
    if (favIds.length > 0) await saveFavCategories(favIds);
  };

  const skip = async () => {
    await persistFavs();
    await markOnboarded();
    navigation.replace('Main', undefined);
  };

  const goNext = () => {
    if (slide < TOTAL - 1) {
      Animated.timing(slideAnim, { toValue: 0, duration: 0, useNativeDriver: true }).start();
      setSlide((s) => s + 1);
    }
  };

  const handleFinish = async () => {
    if (!groupName.trim()) {
      setGroupError(t('onboarding.giveGroupName'));
      return;
    }
    setGroupLoading(true);
    setGroupError('');
    try {
      await persistFavs();
      const typeMap: Record<GroupType, string> = {
        Couple: 'COUPLE',
        Friends: 'FRIENDS',
        Family: 'FAMILY',
      };
      const res = await groupsAPI.create(groupName.trim(), undefined, typeMap[selectedGroup]);
      const groupId: string = (res.data as { id: string }).id;
      await markOnboarded();
      navigation.replace('Main', { groupId });
    } catch {
      setGroupError(t('onboarding.couldNotCreate'));
      // Still mark onboarded so they don't loop forever
      await markOnboarded();
      navigation.replace('Main', undefined);
    } finally {
      setGroupLoading(false);
    }
  };

  const groupTypes: { key: GroupType; emoji: string }[] = [
    { key: 'Couple', emoji: '💑' },
    { key: 'Friends', emoji: '👯' },
    { key: 'Family', emoji: '👨‍👩‍👧' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      {/* Skip */}
      <View style={styles.topBar}>
        <View />
        <TouchableOpacity onPress={skip} style={styles.skipBtn}>
          <Text style={[TYPE.secondary, { color: colors.ink2 }]}>{t('onboarding.skip')}</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      {slide === 0 && (
        <View style={styles.slideContent}>
          <ChatBubblesIllustration />
          <DNText variant="title" style={{ textAlign: 'center', marginBottom: SPACING.sm }}>
            {t('onboarding.slide0Title')}
          </DNText>
          <DNText variant="body" color={colors.ink2} style={{ textAlign: 'center', marginBottom: SPACING.xl }}>
            {t('onboarding.slide0Body')}
          </DNText>
          <DNButton label={t('common.next')} onPress={goNext} />
        </View>
      )}

      {slide === 1 && (
        <View style={styles.slideContent}>
          <OptionCardsIllustration />
          <DNText variant="title" style={{ textAlign: 'center', marginBottom: SPACING.sm }}>
            {t('onboarding.slide1Title')}
          </DNText>
          <DNText variant="body" color={colors.ink2} style={{ textAlign: 'center', marginBottom: SPACING.xl }}>
            {t('onboarding.slide1Body')}
          </DNText>
          <DNButton label={t('common.next')} onPress={goNext} />
        </View>
      )}

      {slide === 2 && (
        <View style={styles.slideContent}>
          <DNText variant="title" style={{ textAlign: 'center', marginBottom: SPACING.sm }}>
            {t('onboarding.slide2Title')}
          </DNText>
          <DNText variant="body" color={colors.ink2} style={{ textAlign: 'center', marginBottom: SPACING.lg }}>
            {t('onboarding.slide2Body')}
          </DNText>
          <FavCategoryChips selected={favIds} onChange={setFavIds} />
          <DNButton
            label={favIds.length > 0 ? t('onboarding.saveFavourites') : t('onboarding.skipForNow')}
            onPress={goNext}
            style={{ marginTop: SPACING.lg }}
          />
        </View>
      )}

      {slide === 3 && (
        <View style={[styles.slideContent, { gap: 0 }]}>
          <DNText variant="title" style={{ textAlign: 'center', marginBottom: SPACING.lg }}>
            {t('onboarding.slide3Title')}
          </DNText>

          {/* Group type cards */}
          <View style={styles.groupCards}>
            {groupTypes.map(({ key, emoji }, i) => (
              <View key={key} style={{ position: 'relative' }}>
                <DNCard
                  index={i}
                  selected={selectedGroup === key}
                  onPress={() => setSelectedGroup(key)}
                  style={styles.groupCard}
                >
                  <Text style={{ fontSize: 28, textAlign: 'center' }}>{emoji}</Text>
                  <Text
                    style={[
                      TYPE.heading,
                      { color: selectedGroup === key ? colors.primary : colors.ink, textAlign: 'center', marginTop: 4 },
                    ]}
                  >
                    {key}
                  </Text>
                </DNCard>
                {key === 'Couple' && (
                  <DNSticker
                    label="MOST POPULAR"
                    color={colors.lime}
                    textColor="#101820"
                    rotationIndex={1}
                    size="sm"
                    style={styles.popularSticker}
                  />
                )}
              </View>
            ))}
          </View>

          {/* Name input */}
          <DNInput
            label={t('onboarding.nameIt')}
            placeholder={t('onboarding.namePlaceholder')}
            value={groupName}
            onChangeText={(tx) => { setGroupName(tx); setGroupError(''); }}
            error={groupError}
            style={{ marginTop: SPACING.lg }}
          />

          <DNButton
            label={t('onboarding.createGroup')}
            onPress={handleFinish}
            loading={groupLoading}
            style={{ marginTop: SPACING.sm }}
          />
        </View>
      )}

      {/* Dots */}
      <Dots current={slide} total={TOTAL} />

      <View style={{ height: insets.bottom + SPACING.xl }} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.gutter,
    paddingBottom: SPACING.sm,
  },
  skipBtn: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: SPACING.sm,
  },
  slideContent: {
    flex: 1,
    paddingHorizontal: SPACING.gutter,
    justifyContent: 'center',
  },
  groupCards: {
    flexDirection: 'row',
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  groupCard: {
    width: (SCREEN_W - SPACING.gutter * 2 - SPACING.sm * 2) / 3,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  popularSticker: {
    position: 'absolute',
    top: -12,
    left: '50%',
    transform: [{ translateX: -32 }],
  },
});
