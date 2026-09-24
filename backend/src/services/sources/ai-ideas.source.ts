/**
 * AI Ideas source — Gemini 1.5 Flash
 *
 * Generates fresh, location-aware date/activity ideas for any category.
 * Uses Google Gemini 1.5 Flash (free tier: 15 RPM, 1M tokens/day).
 * Falls back to the seed catalog if Gemini is unavailable.
 *
 * API key: GEMINI_API_KEY env var.
 * Get a free key at: https://aistudio.google.com/app/apikey
 * The existing GOOGLE_MAPS_API_KEY does NOT cover Gemini — separate key needed.
 */

import { Suggestion, SuggestionCategory } from './types';
import { logger } from '@/services/logger';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta';
const GEMINI_MODEL = 'gemini-flash-latest';

// Category-specific prompts for better idea quality
const CATEGORY_PROMPTS: Partial<Record<SuggestionCategory | string, string>> = {
  'Couples':        'romantic date night activities and outings for couples',
  'Family':         'family-friendly activities and outings for parents with kids',
  'Hotels':         'hotel stays, staycation ideas, and weekend getaway destinations',
  'Wellness':       'wellness, spa, self-care, yoga, and relaxation activities',
  'Volunteering':   'volunteer opportunities and community service activities',
  'Unique & Quirky':'unique, unusual, and quirky date or group experiences',
  'Sports':         'sports activities, games, and athletic events',
  'Active':         'active outdoor and fitness activities',
  'Day Trip':       'day trip destinations and scenic drives',
  'Local Experience': 'local experiences, escape rooms, trivia, and hidden gems',
  'Dining':         'restaurant styles, dining experiences, and food events',
  'Live Music':     'live music venues, concerts, and music experiences',
  'Comedy':         'comedy shows, improv nights, and stand-up events',
  'Movies':         'movie theater experiences, film festivals, and screenings',
  'Theater & Plays':'theater productions, musicals, and performing arts',
  'Arts & Culture': 'art galleries, museums, and cultural experiences',
  'Wine & Drinks':  'wineries, breweries, cocktail bars, and drink tastings',
  'Outdoors':       'outdoor adventures, hikes, parks, and nature activities',
};

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
}

interface IdeaItem {
  name: string;
  description: string;
  cost: string;
  duration: number;
}

/**
 * Generate location-aware activity ideas via Gemini.
 * Returns an empty array on any failure — never throws.
 */
export async function fetchAiIdeas(
  category: string,
  city: string,
  state: string,
  count = 8,
): Promise<Suggestion[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];

  const categoryDesc = CATEGORY_PROMPTS[category] ?? `${category} activities`;
  const locationStr = city && state ? `in or near ${city}, ${state}` : 'in a typical US city';

  const prompt = `Generate ${count} specific, actionable ${categoryDesc} ${locationStr}.

Return ONLY a JSON array of exactly ${count} items. No markdown, no explanation, no truncation. Each item:
{
  "name": "Short activity name (max 6 words)",
  "description": "One engaging sentence (max 100 chars)",
  "cost": "free" | "$" | "$$" | "$$$",
  "duration": minutes as a number
}

Rules:
- Be specific to the location and category
- Mix price points
- Focus on experiences couples or small groups would love
- No generic suggestions like "go for a walk"`;

  try {
    const resp = await fetch(
      `${GEMINI_BASE}/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (!resp.ok) {
      logger.warn('Gemini AI ideas request failed', { status: resp.status, category });
      return [];
    }

    const data = await resp.json() as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    // Parse JSON — handle both bare array and wrapped responses
    let ideas: IdeaItem[] = [];
    try {
      const parsed = JSON.parse(text);
      ideas = Array.isArray(parsed) ? parsed : (parsed.ideas ?? parsed.results ?? []);
    } catch {
      // Try extracting JSON array from the text
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        try { ideas = JSON.parse(match[0]); } catch { /* give up */ }
      }
    }

    if (!ideas.length) {
      logger.warn('Gemini returned no parseable ideas', { category, city });
      return [];
    }

    logger.info(`Gemini AI ideas: ${ideas.length} ideas for ${category} near ${city}`);

    return ideas.slice(0, count).map((idea, i): Suggestion => ({
      id: `ai:${category.toLowerCase().replace(/\s+/g, '-')}:${i}`,
      name: idea.name ?? 'Date Idea',
      category: category as SuggestionCategory,
      shortDescription: idea.description ?? '',
      costTier: (['free', '$', '$$', '$$$'].includes(idea.cost) ? idea.cost : '$$') as Suggestion['costTier'],
      dateFriendly: true,
      groupFriendly: true,
      durationMinutes: typeof idea.duration === 'number' ? idea.duration : 90,
      source: 'seed' as const, // show as "idea" cards on the frontend
      externalId: `ai-${i}`,
      isIdea: true,
      attribution: 'Ideas by Google Gemini',
    }));
  } catch (err) {
    logger.warn('Gemini AI ideas error', {
      category,
      error: err instanceof Error ? err.message : String(err),
    });
    return [];
  }
}
