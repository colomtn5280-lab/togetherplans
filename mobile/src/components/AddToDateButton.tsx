/**
 * AddToDateButton
 *
 * Soft-tint bubble button for suggestion cards. v2 10.17.26
 * Spec: ADD_TO_DATE_BUTTON.md (Design Pack 9)
 *   - 44px tall, full card width
 *   - Default: primarySoft (#D9F1F0) bg, primaryDeep (#086B6B) text
 *   - Pressed: solid teal (#0E8C8C) bg, white text
 *   - Added state: lime-soft (#EAF6D3) bg, lime-deep (#3F6A06) text, mirrored radii
 *   - Light haptic impact on add (iOS); CONFIRM on Android
 */
import React, { useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface AddToDateButtonProps {
  added?: boolean;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export function AddToDateButton({
  added = false,
  onPress,
  disabled = false,
  style,
}: AddToDateButtonProps) {
  const { colors, dark } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const lastPress = useRef(0);
  const [pressed, setPressed] = useState(false);

  const handlePress = async () => {
    const now = Date.now();
    if (now - lastPress.current < 500) return;
    lastPress.current = now;

    // Haptic
    try {
      if (Platform.OS === 'ios') {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      // haptics unavailable in simulator / web — silent
    }

    onPress();
  };

  const onPressIn = () => {
    setPressed(true);
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const onPressOut = () => {
    setPressed(false);
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 2,
    }).start();
  };

  // Determine background and text colors
  let bgColor: string;
  let textColor: string;

  if (added) {
    bgColor = dark ? '#2A3A1A' : '#EAF6D3';
    textColor = dark ? '#C6EE85' : '#3F6A06';
  } else if (pressed) {
    bgColor = '#0E8C8C';
    textColor = '#FFFFFF';
  } else {
    bgColor = dark ? '#163A3B' : '#D9F1F0';
    textColor = dark ? '#7FE0DD' : '#086B6B';
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || added}
        style={[
          styles.base,
          added
            ? {
                backgroundColor: bgColor,
                borderTopLeftRadius: 17,
                borderTopRightRadius: 23,
                borderBottomRightRadius: 17,
                borderBottomLeftRadius: 23,
                shadowOpacity: 0,
                elevation: 0,
              }
            : {
                backgroundColor: bgColor,
                borderTopLeftRadius: 23,
                borderTopRightRadius: 17,
                borderBottomRightRadius: 23,
                borderBottomLeftRadius: 17,
              },
          disabled && styles.disabled,
        ]}
        accessibilityRole="button"
        accessibilityState={{ checked: added }}
        accessibilityLabel={added ? 'Added to date' : 'Add to Date'}
      >
        <Text
          style={[
            styles.label,
            { color: textColor },
          ]}
        >
          {added ? '✓ Added' : '+ Add to Date'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    width: '100%',
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0E8C8C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },
  label: {
    fontFamily: 'Sora_700Bold',
    fontSize: 14,
    letterSpacing: -0.14,
  },
  disabled: {
    opacity: 0.5,
  },
});
