import { Suggestion } from '../services/sources/types';

export type NightStartsAt = 'early' | 'standard' | 'late';

export interface AfterDarkConfig {
  nightStartsAt: NightStartsAt; // 'early' = 5pm, 'standard' = 7pm, 'late' = 10pm
  includeFamilyEvents: boolean; // If false, deprioritize family/kids activities
  sortByTimeToEvent: boolean; // If true, sort imminent events first
}

const NIGHT_START_HOURS: Record<NightStartsAt, number> = {
  early: 17, // 5pm
  standard: 19, // 7pm
  late: 22, // 10pm
};

const DAYTIME_CATEGORIES = new Set([
  'Family',
  'Active',
  'Outdoors',
  'Sports',
  'Day Trip',
]);

/** Parse ISO date string to hour (0-23) */
function getHourFromISODate(isoString: string): number | null {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return null;
    return date.getHours();
  } catch {
    return null;
  }
}

/** Extract hour from time string like "7:30 PM" */
function getHourFromTimeString(timeStr: string): number | null {
  const match = timeStr.match(/(\d{1,2}):?(\d{2})?\s?(AM|PM)?/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  if (match[3]?.toUpperCase() === 'PM' && hour < 12) hour += 12;
  if (match[3]?.toUpperCase() === 'AM' && hour === 12) hour = 0;
  return hour;
}

/** Check if two dates are the same calendar day (ignoring time) */
function isSameDayUTC(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/** Check if date is tomorrow (UTC) */
function isTomorrowUTC(date: Date, now: Date): boolean {
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return isSameDayUTC(date, tomorrow);
}

/** Check if date is today (UTC) */
function isTodayUTC(date: Date, now: Date): boolean {
  return isSameDayUTC(date, now);
}

/**
 * TIER 1: Filter and sort suggestions for After Dark mode
 * - Filters events that start >= nightStartsAt hour
 * - Optionally deprioritizes family/daytime activities
 * - Optionally sorts by time-to-event (imminent first)
 */
export function filterAfterDark(
  suggestions: Suggestion[],
  config: AfterDarkConfig = {
    nightStartsAt: 'standard',
    includeFamilyEvents: false,
    sortByTimeToEvent: true,
  }
): Suggestion[] {
  const nightStartHour = NIGHT_START_HOURS[config.nightStartsAt];
  const now = new Date();

  // TIER 1: Filter by start time (if available)
  let filtered = suggestions.filter((s) => {
    if (!s.date && !s.timeStart) return true; // Keep events without time info

    let eventHour: number | null = null;

    // Try to get hour from timeStart first (more reliable)
    if (s.timeStart) {
      eventHour = getHourFromTimeString(s.timeStart);
    }

    // Fall back to hour from date
    if (eventHour === null && s.date) {
      eventHour = getHourFromISODate(s.date);
    }

    // If we found an hour, check if it's >= nightStartHour
    if (eventHour !== null) {
      return eventHour >= nightStartHour;
    }

    // Keep if we couldn't parse time
    return true;
  });

  // TIER 1: Deprioritize daytime categories (move to end, don't remove)
  if (!config.includeFamilyEvents) {
    const evening = filtered.filter((s) => !DAYTIME_CATEGORIES.has(s.category));
    const daytime = filtered.filter((s) => DAYTIME_CATEGORIES.has(s.category));
    filtered = [...evening, ...daytime];
  }

  // TIER 1: Sort by time-to-event (imminent first)
  if (config.sortByTimeToEvent) {
    filtered.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      try {
        const timeA = new Date(a.date);
        const timeB = new Date(b.date);
        if (isNaN(timeA.getTime()) || isNaN(timeB.getTime())) return 0;
        const minA = Math.floor((timeA.getTime() - now.getTime()) / 60000);
        const minB = Math.floor((timeB.getTime() - now.getTime()) / 60000);
        return minA - minB;
      } catch {
        return 0;
      }
    });
  }

  return filtered;
}

/**
 * TIER 2: Enrich suggestions with time-until-event metadata
 * Adds:
 * - timeUntilEvent: minutes from now to start
 * - timeDisplay: "Starts in 45 min" or "Starts at 8:30 PM" or "Tomorrow at 7pm"
 * - isTonight: boolean (same calendar day)
 */
export function enrichAfterDarkMetadata(
  suggestions: Suggestion[]
): (Suggestion & {
  timeUntilEvent?: number;
  timeDisplay?: string;
  isTonight?: boolean;
})[] {
  const now = new Date();

  return suggestions.map((s) => {
    if (!s.date) {
      return s; // No enrichment without date
    }

    try {
      const eventDate = new Date(s.date);
      if (isNaN(eventDate.getTime())) {
        return s;
      }

      const minUntilEvent = Math.floor((eventDate.getTime() - now.getTime()) / 60000);

      let timeDisplay = '';
      let isTonightFlag = false;

      if (minUntilEvent < 0) {
        timeDisplay = '🌙 Started';
      } else if (minUntilEvent < 60) {
        timeDisplay = `🌙 Starts in ${minUntilEvent} min`;
        isTonightFlag = isTodayUTC(eventDate, now);
      } else if (isTodayUTC(eventDate, now)) {
        const hours = eventDate.getUTCHours();
        const mins = String(eventDate.getUTCMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        timeDisplay = `🌙 Tonight at ${displayHours}:${mins} ${ampm}`;
        isTonightFlag = true;
      } else if (isTomorrowUTC(eventDate, now)) {
        const hours = eventDate.getUTCHours();
        const mins = String(eventDate.getUTCMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        timeDisplay = `🌙 Tomorrow at ${displayHours}:${mins} ${ampm}`;
      } else {
        const dayName = eventDate.toLocaleDateString('en-US', { weekday: 'short' });
        const hours = eventDate.getUTCHours();
        const mins = String(eventDate.getUTCMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        timeDisplay = `🌙 ${dayName} at ${displayHours}:${mins} ${ampm}`;
      }

      return {
        ...s,
        timeUntilEvent: Math.max(0, minUntilEvent),
        timeDisplay,
        isTonight: isTonightFlag,
      };
    } catch {
      return s;
    }
  });
}

/**
 * TIER 3: Score suggestions based on user preferences & trends
 * (Placeholder for ML integration in v1.4)
 */
export function scoreAfterDarkRelevance(
  suggestions: Suggestion[],
  userPreferences?: {
    favoriteCategories?: string[];
    groupSize?: 'solo' | 'couple' | 'group';
  }
): number[] {
  if (!userPreferences) {
    return suggestions.map(() => 0.5); // Neutral score
  }

  return suggestions.map((s) => {
    let score = 0.5;

    // Boost score if in favorite category
    if (userPreferences.favoriteCategories?.includes(s.category)) {
      score += 0.2;
    }

    // Boost for couple-friendly activities
    if (
      userPreferences.groupSize === 'couple' &&
      ['Wine & Drinks', 'Dining', 'Live Music', 'Theater & Plays'].includes(s.category)
    ) {
      score += 0.15;
    }

    // Boost for imminent events
    if ((s as any).timeUntilEvent !== undefined && (s as any).timeUntilEvent < 120) {
      score += 0.15;
    }

    // Boost highly-rated events
    if (s.rating && s.rating >= 4.5) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  });
}
