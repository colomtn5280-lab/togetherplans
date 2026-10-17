/**
 * LoadingSpinner — DateMeUp logo 5a animation.
 * v2 10.17.26 — three-part animated logo (chevron + two figures) in teal/lime.
 *
 * Size prop: 'page' = 72, 'region' = 56, 'button' = 22
 * (Legacy size keys sm/md/lg still accepted for back-compat.)
 *
 * No external deps — uses Animated from React Native only.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { DNText } from '@/components/ui';

// New named sizes per v2 spec
const NAMED_SIZES = {
  page:   72,
  region: 56,
  button: 22,
  // legacy keys kept for back-compat
  sm: 24,
  md: 40,
  lg: 64,
} as const;

type SizeKey = keyof typeof NAMED_SIZES;

interface LoadingSpinnerProps {
  size?: SizeKey;
  label?: string;
  fullscreen?: boolean;
  color?: string;
}

export function LoadingSpinner({ size = 'md', label, fullscreen, color }: LoadingSpinnerProps) {
  const { colors, dark } = useTheme();

  // Chevron hops: translateY 0 → -9 → 0, 1.2s loop
  const chevronY = useRef(new Animated.Value(0)).current;
  // Figure A leans right: rotate 0 → 9deg → 0, 1.2s loop
  const figARotate = useRef(new Animated.Value(0)).current;
  // Figure B leans left: rotate 0 → -9deg → 0, 1.2s loop
  const figBRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const opts = {
      duration: 1200,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    };

    const chevronAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(chevronY, { toValue: -1, ...opts }),
        Animated.timing(chevronY, { toValue: 0, ...opts }),
      ]),
    );
    const figAAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(figARotate, { toValue: 1, ...opts }),
        Animated.timing(figARotate, { toValue: 0, ...opts }),
      ]),
    );
    const figBAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(figBRotate, { toValue: -1, ...opts }),
        Animated.timing(figBRotate, { toValue: 0, ...opts }),
      ]),
    );

    chevronAnim.start();
    figAAnim.start();
    figBAnim.start();

    return () => {
      chevronAnim.stop();
      figAAnim.stop();
      figBAnim.stop();
    };
  }, [chevronY, figARotate, figBRotate]);

  const sz = NAMED_SIZES[size];
  const teal = color ?? (dark ? colors.primary : '#0E8C8C');
  const lime = dark ? '#A8E04B' : '#7CB518';

  // Animate translateY scaled to container size
  const chevronTranslateY = chevronY.interpolate({
    inputRange: [-1, 0],
    outputRange: [-sz * 0.125, 0],
  });
  const figADeg = figARotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '9deg'],
  });
  const figBDeg = figBRotate.interpolate({
    inputRange: [-1, 0],
    outputRange: ['-9deg', '0deg'],
  });

  // Scale factor for the logo parts
  const scale = sz / 72;
  const figSize = sz * 0.28;
  const chevronH = sz * 0.22;
  const figRadius = figSize / 2;

  const logo = (
    <View style={[styles.logoContainer, { width: sz, height: sz }]}>
      {/* Chevron — top center, animates up */}
      <Animated.View
        style={[
          styles.chevron,
          {
            transform: [{ translateY: chevronTranslateY }],
            width: sz * 0.56,
            height: chevronH,
          },
        ]}
      >
        {/* Left arm */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: sz * 0.32,
            height: sz * 0.07,
            borderRadius: sz * 0.035,
            backgroundColor: teal,
            transform: [{ rotate: '-30deg' }, { translateX: sz * 0.04 }],
          }}
        />
        {/* Right arm */}
        <View
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: sz * 0.32,
            height: sz * 0.07,
            borderRadius: sz * 0.035,
            backgroundColor: teal,
            transform: [{ rotate: '30deg' }, { translateX: -sz * 0.04 }],
          }}
        />
      </Animated.View>

      {/* Figures row */}
      <View style={[styles.figuresRow, { marginTop: sz * 0.06 }]}>
        {/* Figure A — leans right */}
        <Animated.View
          style={{
            alignItems: 'center',
            transform: [{ rotate: figADeg }],
          }}
        >
          {/* Head */}
          <View
            style={{
              width: figSize * 0.7,
              height: figSize * 0.7,
              borderRadius: figSize * 0.35,
              backgroundColor: teal,
              marginBottom: figSize * 0.1,
            }}
          />
          {/* Body */}
          <View
            style={{
              width: figSize,
              height: figSize * 1.1,
              borderTopLeftRadius: figSize * 0.5,
              borderTopRightRadius: figSize * 0.5,
              borderBottomLeftRadius: figSize * 0.3,
              borderBottomRightRadius: figSize * 0.3,
              backgroundColor: teal,
            }}
          />
        </Animated.View>

        {/* Gap */}
        <View style={{ width: sz * 0.08 }} />

        {/* Figure B — leans left (lime) */}
        <Animated.View
          style={{
            alignItems: 'center',
            transform: [{ rotate: figBDeg }],
          }}
        >
          {/* Head */}
          <View
            style={{
              width: figSize * 0.7,
              height: figSize * 0.7,
              borderRadius: figSize * 0.35,
              backgroundColor: lime,
              marginBottom: figSize * 0.1,
            }}
          />
          {/* Body */}
          <View
            style={{
              width: figSize,
              height: figSize * 1.1,
              borderTopLeftRadius: figSize * 0.5,
              borderTopRightRadius: figSize * 0.5,
              borderBottomLeftRadius: figSize * 0.3,
              borderBottomRightRadius: figSize * 0.3,
              backgroundColor: lime,
            }}
          />
        </Animated.View>
      </View>
    </View>
  );

  const spinner = (
    <View style={label ? styles.withLabel : undefined}>
      {logo}
      {label ? (
        <DNText variant="secondary" color={colors.ink2} style={styles.label}>
          {label}
        </DNText>
      ) : null}
    </View>
  );

  if (fullscreen) {
    return (
      <View style={[styles.fullscreen, { backgroundColor: colors.bg }]}>
        {spinner}
      </View>
    );
  }

  return spinner;
}

const styles = StyleSheet.create({
  logoContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  figuresRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  withLabel: {
    alignItems: 'center',
    gap: 10,
  },
  label: {
    marginTop: 8,
    textAlign: 'center',
  },
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
});
