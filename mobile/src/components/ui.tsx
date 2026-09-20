/**
 * Shared primitive components — DateNight design system v2.
 * All use HANDOFF_README token values via useTheme().
 */
import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ActivityIndicator, ViewStyle, TextStyle,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TYPE, SPACING, RADII, SHADOWS, STICKER_ROTATIONS, CARD_RADII } from '@/constants';

// ─────────────────────────────────────────────────────────────────────────────
// DNText
// ─────────────────────────────────────────────────────────────────────────────
interface DNTextProps {
  variant?: keyof typeof TYPE;
  color?: string;
  style?: TextStyle;
  children: React.ReactNode;
  numberOfLines?: number;
}

export function DNText({ variant = 'body', color, style, children, numberOfLines }: DNTextProps) {
  const { colors } = useTheme();
  return (
    <Text
      numberOfLines={numberOfLines}
      style={[
        TYPE[variant],
        { color: color ?? colors.ink },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DNButton — primary / secondary / tonal / ink
// ─────────────────────────────────────────────────────────────────────────────
interface DNButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'tonal' | 'ink';
  size?: 'default' | 'compact' | 'mini';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export function DNButton({
  label, onPress, variant = 'primary', size = 'default',
  loading, disabled, style, icon,
}: DNButtonProps) {
  const { colors } = useTheme();
  const lastPressTime = useRef<number>(0);

  const height = size === 'mini' ? 38 : size === 'compact' ? 44 : 54;
  const textVariant = size === 'mini' || size === 'compact' ? 'buttonSm' : 'button';
  const r = variant === 'secondary' ? RADII.buttonSec : RADII.button;

  const bg = {
    primary:   colors.primary,
    secondary: 'transparent',
    tonal:     colors.primarySoft,
    ink:       colors.ink,
  }[variant];

  const textColor = {
    primary:   colors.onPrimary,
    secondary: colors.primary,
    tonal:     colors.primary,
    ink:       colors.onPrimary,
  }[variant];

  const borderColor = variant === 'secondary' ? colors.primary : undefined;

  return (
    <TouchableOpacity
      onPress={() => {
        const now = Date.now();
        if (now - lastPressTime.current < 500) return;
        lastPressTime.current = now;
        onPress();
      }}
      disabled={disabled || loading}
      activeOpacity={0.82}
      style={[
        styles.btn,
        {
          height,
          backgroundColor: bg,
          borderRadius: typeof r === 'number' ? r : 0,
          borderTopLeftRadius: typeof r === 'object' ? r.topLeft : undefined,
          borderTopRightRadius: typeof r === 'object' ? r.topRight : undefined,
          borderBottomRightRadius: typeof r === 'object' ? r.bottomRight : undefined,
          borderBottomLeftRadius: typeof r === 'object' ? r.bottomLeft : undefined,
          borderWidth: variant === 'secondary' ? 1.5 : 0,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        SHADOWS.card,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.btnInner}>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          <Text style={[TYPE[textVariant], { color: textColor }]}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg },
  btnInner: { flexDirection: 'row', alignItems: 'center' },
});

// ─────────────────────────────────────────────────────────────────────────────
// DNCard
// ─────────────────────────────────────────────────────────────────────────────
interface DNCardProps {
  index?: number;
  selected?: boolean;
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}

export function DNCard({ index = 0, selected, children, style, onPress }: DNCardProps) {
  const { colors } = useTheme();
  const r = CARD_RADII[index % 4];
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.9}
      style={[
        {
          backgroundColor: colors.surface,
          borderTopLeftRadius: r.topLeft,
          borderTopRightRadius: r.topRight,
          borderBottomRightRadius: r.bottomRight,
          borderBottomLeftRadius: r.bottomLeft,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? colors.primary : undefined,
          padding: SPACING.md,
        },
        SHADOWS.card,
        style,
      ]}
    >
      {children}
    </Wrapper>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DNSticker — status tag
// ─────────────────────────────────────────────────────────────────────────────
interface DNStickerProps {
  label: string;
  color?: string;       // background
  textColor?: string;
  rotationIndex?: number;
  size?: 'default' | 'sm';
  style?: ViewStyle;
}

export function DNSticker({
  label, color, textColor, rotationIndex = 0, size = 'default', style,
}: DNStickerProps) {
  const { colors } = useTheme();
  const bg = color ?? colors.primarySoft;
  const tc = textColor ?? colors.primary;
  const r = size === 'sm' ? RADII.stickerSm : RADII.sticker;
  const rotation = STICKER_ROTATIONS[rotationIndex % 4];
  const padding = size === 'sm'
    ? { paddingVertical: 4, paddingHorizontal: 9 }
    : { paddingVertical: 5, paddingHorizontal: 10 };

  return (
    <View
      style={[
        {
          backgroundColor: bg,
          borderTopLeftRadius: r.topLeft,
          borderTopRightRadius: r.topRight,
          borderBottomRightRadius: r.bottomRight,
          borderBottomLeftRadius: r.bottomLeft,
          transform: [{ rotate: rotation }],
          alignSelf: 'flex-start',
          ...padding,
        },
        style,
      ]}
    >
      <Text style={[TYPE.sticker, { color: tc, fontSize: size === 'sm' ? 9 : 10 }]}>
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DNAvatar — blob avatar with initials
// ─────────────────────────────────────────────────────────────────────────────
const AVATAR_COLORS = ['primary', 'lime', 'cobalt', 'warning'] as const;
type AvatarColorName = typeof AVATAR_COLORS[number];

interface DNAvatarProps {
  name?: string;
  size?: 28 | 42 | 54 | 76;
  colorIndex?: number;
  pending?: boolean;
  style?: ViewStyle;
}

export function DNAvatar({ name, size = 42, colorIndex = 0, pending, style }: DNAvatarProps) {
  const { colors } = useTheme();
  const colorMap: Record<AvatarColorName, { bg: string; text: string }> = {
    primary: { bg: colors.primary, text: colors.onPrimary },
    lime:    { bg: colors.lime,    text: '#101820' },
    cobalt:  { bg: '#2D6CDB',      text: '#FFFFFF' },
    warning: { bg: colors.warning, text: colors.ink },
  };
  const key = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];
  const { bg, text } = colorMap[key];
  const initials = name ? name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const fontSize = size <= 28 ? 10 : size <= 42 ? 14 : size <= 54 ? 18 : 26;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pending ? 'transparent' : bg,
          borderWidth: pending ? 2 : 0,
          borderColor: colors.line,
          borderStyle: pending ? 'dashed' : 'solid',
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
    >
      <Text style={[TYPE.body, { fontFamily: 'Sora_800ExtraBold', fontSize, color: pending ? colors.ink2 : text }]}>
        {pending ? '?' : initials}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DNChip — filter / invite method chip
// ─────────────────────────────────────────────────────────────────────────────
interface DNChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  index?: number;
}

export function DNChip({ label, selected, onPress, index = 0 }: DNChipProps) {
  const { colors } = useTheme();
  const r = index % 2 === 0 ? RADII.chip : RADII.chipAlt;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        {
          height: 38,
          paddingHorizontal: 14,
          backgroundColor: selected ? colors.ink : colors.surface,
          borderTopLeftRadius: r.topLeft,
          borderTopRightRadius: r.topRight,
          borderBottomRightRadius: r.bottomRight,
          borderBottomLeftRadius: r.bottomLeft,
          alignItems: 'center',
          justifyContent: 'center',
          transform: selected ? [{ rotate: '-2deg' }] : [],
        },
        SHADOWS.card,
      ]}
    >
      <Text style={[TYPE.buttonSm, { color: selected ? colors.bg : colors.ink2 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DNSkeleton — shimmer placeholder
// ─────────────────────────────────────────────────────────────────────────────
interface DNSkeletonProps {
  width?: number | string;
  height?: number;
  style?: ViewStyle;
}

export function DNSkeleton({ width = '100%', height = 16, style }: DNSkeletonProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: colors.line,
          borderRadius: 8,
          overflow: 'hidden',
        },
        style,
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DNInput
// ─────────────────────────────────────────────────────────────────────────────
import { TextInput, TextInputProps } from 'react-native';

interface DNInputProps extends TextInputProps {
  label?: string;
  error?: string;
  style?: ViewStyle;
}

export function DNInput({ label, error, style, ...props }: DNInputProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ marginBottom: SPACING.md }, style]}>
      {label && (
        <Text style={[TYPE.secondary, { color: colors.ink2, marginBottom: 4 }]}>{label}</Text>
      )}
      <TextInput
        placeholderTextColor={colors.ink2}
        style={{
          height: props.multiline ? undefined : 52,
          minHeight: props.multiline ? 52 : undefined,
          backgroundColor: colors.bg,
          borderRadius: RADII.input,
          paddingHorizontal: SPACING.md,
          ...TYPE.body,
          color: colors.ink,
          borderWidth: error ? 2 : 0,
          borderColor: error ? colors.error : undefined,
        }}
        {...props}
      />
      {error && (
        <Text style={[TYPE.secondary, { color: colors.error, marginTop: 4 }]}>{error}</Text>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DNScreenHeader — custom header with blob back button
// ─────────────────────────────────────────────────────────────────────────────
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DNScreenHeaderProps {
  title: string;
  subtitle?: string;
  stickerLabel?: string;
  stickerColor?: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

export function DNScreenHeader({
  title, subtitle, stickerLabel, stickerColor, onBack, rightElement,
}: DNScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top + 18, paddingHorizontal: SPACING.gutter, paddingBottom: SPACING.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 42, height: 42, borderRadius: 21,
              backgroundColor: colors.surface,
              alignItems: 'center', justifyContent: 'center',
              marginRight: SPACING.sm,
              ...SHADOWS.card,
            }}
          >
            <Text style={{ color: colors.ink, fontSize: 18 }}>‹</Text>
          </TouchableOpacity>
        )}
        {subtitle && (
          <Text style={[TYPE.secondary, { color: colors.ink2, flex: 1 }]} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {stickerLabel && (
          <DNSticker label={stickerLabel} color={stickerColor} rotationIndex={1} style={{ marginLeft: 'auto' }} />
        )}
        {rightElement && <View style={{ marginLeft: 'auto' }}>{rightElement}</View>}
      </View>
      <Text style={[TYPE.title, { color: colors.ink }]}>{title}</Text>
    </View>
  );
}
