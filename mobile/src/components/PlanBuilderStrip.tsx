/**
 * PlanBuilderStrip — floating bottom strip visible while browsing Discover.
 * Shows option count. Taps open PlanBuilderSheet with remove and finalize actions.
 */
import React, { useCallback, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { usePlanBuilder } from '@/contexts/PlanBuilderContext';
import { SHADOWS, SPACING, TYPE } from '@/constants';
import { DNButton, DNText } from '@/components/ui';
import { CATEGORIES } from '@/constants/categories';
import type { PlanBuilderOption } from '@/types';

// Category → background colour for the emoji fallback
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
  'Shopping & Markets': '#F8D7DA',
  'Couples Events': '#FCE4EC',
  'Family Events': '#D5EFD5',
  'Hotel & Staycation': '#D5E8FD',
  'Volunteering': '#D4EDDA',
  Custom: '#F0F0F0',
};

function getCategoryEmoji(category: string): string {
  const cat = CATEGORIES.find((c) => c.name === category);
  return cat?.emoji ?? '📍';
}

function OptionThumbnail({ option, colors }: { option: PlanBuilderOption; colors: any }) {
  const [imgErr, setImgErr] = useState(false);
  const emoji = getCategoryEmoji(option.category);
  const bg = CATEGORY_COLORS[option.category] ?? '#F0F0F0';

  if (option.imageUrl && !imgErr) {
    return (
      <Image
        source={{ uri: option.imageUrl }}
        style={{ width: 56, height: 56, borderRadius: 10 }}
        onError={() => setImgErr(true)}
      />
    );
  }
  return (
    <View
      style={{
        width: 56,
        height: 56,
        borderRadius: 10,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
    </View>
  );
}

function OptionCard({
  option,
  onRemove,
  colors,
}: {
  option: PlanBuilderOption;
  onRemove: () => void;
  colors: any;
}) {
  const priceStr = option.priceLevel ? '$'.repeat(option.priceLevel) : null;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bg,
        borderRadius: 14,
        padding: SPACING.sm,
        marginBottom: SPACING.sm,
        gap: SPACING.sm,
      }}
    >
      <OptionThumbnail option={option} colors={colors} />
      <View style={{ flex: 1 }}>
        <DNText variant="rowLabel" color={colors.ink} numberOfLines={1}>
          {option.name}
        </DNText>
        <DNText variant="secondary" color={colors.ink2} numberOfLines={1}>
          {option.address ?? option.category}
        </DNText>
        {(option.rating != null || priceStr) && (
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
            {option.rating != null && (
              <DNText variant="secondary" color={colors.lime}>
                ★ {option.rating.toFixed(1)}
              </DNText>
            )}
            {priceStr && (
              <DNText variant="secondary" color={colors.ink2}>
                {priceStr}
              </DNText>
            )}
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={onRemove}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.line,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ color: colors.ink2, fontSize: 16, lineHeight: 20 }}>×</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PlanBuilderStrip() {
  const { colors } = useTheme();
  const { options, removeOption, groupId } = usePlanBuilder();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleFinalize = useCallback(() => {
    setSheetOpen(false);
    // Navigate to CreateProposal with current plan options
    navigation.navigate('CreateProposal', {
      groupId: groupId ?? '',
      options,
    });
  }, [navigation, groupId, options]);

  if (options.length === 0) return null;

  return (
    <>
      {/* Floating strip */}
      <TouchableOpacity
        onPress={() => setSheetOpen(true)}
        activeOpacity={0.88}
        style={[
          {
            position: 'absolute',
            bottom: insets.bottom + 96, // above the dock tab bar (~68 + 32 gap)
            left: SPACING.gutter,
            right: SPACING.gutter,
            backgroundColor: colors.primary,
            borderRadius: 18,
            paddingVertical: 14,
            paddingHorizontal: SPACING.md,
            flexDirection: 'row',
            alignItems: 'center',
          },
          SHADOWS.card,
        ]}
      >
        <Text style={{ fontSize: 20, marginRight: SPACING.sm }}>🗓</Text>
        <DNText variant="buttonSm" color={colors.onPrimary} style={{ flex: 1 }}>
          {options.length} {options.length === 1 ? 'option' : 'options'} added · tap to review
        </DNText>
        <Text style={{ color: colors.onPrimary, fontSize: 16 }}>›</Text>
      </TouchableOpacity>

      {/* Bottom sheet */}
      <Modal
        transparent
        animationType="slide"
        visible={sheetOpen}
        onRequestClose={() => setSheetOpen(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }}
          activeOpacity={1}
          onPress={() => setSheetOpen(false)}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: SPACING.gutter,
            paddingTop: SPACING.md,
            paddingBottom: insets.bottom + SPACING.xl,
            maxHeight: '80%',
          }}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.line,
              alignSelf: 'center',
              marginBottom: SPACING.md,
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md }}>
            <DNText variant="heading" color={colors.ink} style={{ flex: 1 }}>
              Your Plan
            </DNText>
            <DNText variant="secondary" color={colors.ink2}>
              {options.length} / 5
            </DNText>
          </View>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <OptionCard
                key={opt.id}
                option={opt}
                onRemove={() => removeOption(opt.id)}
                colors={colors}
              />
            ))}
          </ScrollView>

          <DNButton
            label="Finalize Plan →"
            variant="primary"
            onPress={handleFinalize}
            style={{ marginTop: SPACING.md }}
          />
          <TouchableOpacity
            onPress={() => setSheetOpen(false)}
            style={{ alignItems: 'center', marginTop: SPACING.sm }}
          >
            <DNText variant="secondary" color={colors.ink2}>
              Keep browsing
            </DNText>
          </TouchableOpacity>
        </View>
      </Modal>
    </>
  );
}
