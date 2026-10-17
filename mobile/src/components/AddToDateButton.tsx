/**
 * AddToDateButton
 *
 * Teal bubble button for suggestion cards.
 * Spec: ADD_TO_DATE_BUTTON.md (Design Pack 9)
 *   - 44px tall, full card width
 *   - Asymmetric radius: 23/17/23/17 (TL/TR/BR/BL)
 *   - Added state: lime background, mirrored radii (17/23/17/23)
 *   - Light haptic impact on add (iOS); CONFIRM on Android
 */
import React, { useRef } from 'react';
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
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const lastPress = useRef(0);

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
    Animated.spring(scale, {
      toValue: 0.98,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 2,
    }).start();
  };

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
                backgroundColor: colors.limeSoft ?? '#EAF6D3',
                borderTopLeftRadius: 17,
                borderTopRightRadius: 23,
                borderBottomRightRadius: 17,
                borderBottomLeftRadius: 23,
                shadowOpacity: 0,
                elevation: 0,
              }
            : {
                backgroundColor: colors.primary,
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
            { color: added ? '#101820' : colors.onPrimary ?? '#fff' },
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
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
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
