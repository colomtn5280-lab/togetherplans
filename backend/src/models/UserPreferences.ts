/**
 * User preferences for After Dark and personalization.
 * v1.2.0: In-memory store (can be migrated to DB in v1.3)
 */

export interface IUserPreferences {
  nightStartsAt: 'early' | 'standard' | 'late';
  includeFamilyInAfterDark: boolean;
  favoriteCategories: string[];
  groupSize: 'solo' | 'couple' | 'group';
  notificationPreferences: {
    lastMinuteDeals: boolean;
    trendingTonight: boolean;
    matchSuggestions: boolean;
  };
}

const DEFAULT_PREFERENCES: IUserPreferences = {
  nightStartsAt: 'standard',
  includeFamilyInAfterDark: false,
  favoriteCategories: [],
  groupSize: 'couple',
  notificationPreferences: {
    lastMinuteDeals: true,
    trendingTonight: true,
    matchSuggestions: true,
  },
};

// Simple in-memory store for v1.2.0
const userPreferencesStore = new Map<string, IUserPreferences>();

export function getUserPreferences(userId: string): IUserPreferences {
  return userPreferencesStore.get(userId) || { ...DEFAULT_PREFERENCES };
}

export function setUserPreferences(userId: string, prefs: Partial<IUserPreferences>): IUserPreferences {
  const current = getUserPreferences(userId);
  const updated = { ...current, ...prefs };
  userPreferencesStore.set(userId, updated);
  return updated;
}
