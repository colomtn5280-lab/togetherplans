/**
 * Favorite categories — AsyncStorage-only personalization (key: tp.favCategories).
 * Picked during onboarding ("What are you two into?") and editable from Profile.
 * Discover orders the category grid favorites-first (in picked order).
 *
 * NOTE: no backend persistence yet — cross-device sync is a follow-up.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '@/contexts/ThemeContext';
import { TYPE } from '@/constants';
import { CATEGORIES, Category } from '@/constants/categories';

export const FAV_CATEGORIES_KEY = 'tp.favCategories';
export const MAX_FAVORITES = 5;

export async function loadFavCategories(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(FAV_CATEGORIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === 'string');
  } catch {
    return [];
  }
}

export async function saveFavCategories(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(FAV_CATEGORIES_KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
  } catch {
    // storage unavailable — personalization silently off
  }
}

/** Favorites first (in picked order), then the rest in constant order. */
export function orderCategoriesByFavorites(favIds: string[]): Category[] {
  if (favIds.length === 0) return CATEGORIES;
  const favs = favIds
    .map((id) => CATEGORIES.find((c) => c.id === id))
    .filter((c): c is Category => !!c);
  const rest = CATEGORIES.filter((c) => !favIds.includes(c.id));
  return [...favs, ...rest];
}

/**
 * The 15 category chips (emoji + name), teal selected state, pick up to 5.
 * Fully controlled; minimum 0 — skipping is always fine.
 */
export function FavCategoryChips({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const { colors } = useTheme();

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else if (selected.length < MAX_FAVORITES) {
      onChange([...selected, id]);
    }
  };

  const full = selected.length >= MAX_FAVORITES;

  return (
    <View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selected.includes(cat.id);
          const disabled = !isSelected && full;
          return (
            <TouchableOpacity
              key={cat.id}
              onPress={() => toggle(cat.id)}
              disabled={disabled}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 5,
                paddingVertical: 7,
                paddingHorizontal: 13,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: isSelected ? colors.primary : colors.line,
                backgroundColor: isSelected ? colors.primary : colors.surface,
                opacity: disabled ? 0.45 : 1,
              }}
            >
              <Text style={{ fontSize: 14 }}>{cat.emoji}</Text>
              <Text
                style={[
                  TYPE.secondary,
                  {
                    color: isSelected ? colors.onPrimary : colors.ink,
                    fontWeight: '700',
                  },
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={[TYPE.secondary, { color: colors.ink2, textAlign: 'center', marginTop: 12 }]}>
        {selected.length === 0
          ? `Pick up to ${MAX_FAVORITES} — or skip, no pressure`
          : `${selected.length} of ${MAX_FAVORITES} picked${full ? " — that's the max!" : ''}`}
      </Text>
    </View>
  );
}
