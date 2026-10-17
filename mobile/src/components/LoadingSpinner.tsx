/**
 * LoadingSpinner — animated teal ring spinner for DateMeUp mobile.
 * No external deps — uses Animated.timing with rotation interpolation.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { DNText } from '@/components/ui';

const SIZES = { sm: 24, md: 40, lg: 64 } as const;
const BORDER = { sm: 3, md: 4, lg: 6 } as const;

interface LoadingSpinnerProps {
  size?: keyof typeof SIZES;
  label?: string;
  fullscreen?: boolean;
  color?: string;
}

export function LoadingSpinner({ size = 'md', label, fullscreen, color }: LoadingSpinnerProps) {
  const { colors } = useTheme();
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 900,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [rotation]);

  const rotate = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const sz = SIZES[size];
  const bw = BORDER[size];
  const ringColor = color ?? colors.primary;

  const spinner = (
    <View style={label ? styles.withLabel : undefined}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: sz,
            height: sz,
            borderRadius: sz / 2,
            borderWidth: bw,
            borderColor: `${ringColor}28`,
            borderTopColor: ringColor,
            transform: [{ rotate }],
          },
        ]}
      />
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
  ring: {
    alignSelf: 'center',
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
