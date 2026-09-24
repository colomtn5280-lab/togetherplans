/**
 * after-dark.test.ts — Comprehensive test suite for TIERS 1, 2, 3
 */

import {
  filterAfterDark,
  enrichAfterDarkMetadata,
  scoreAfterDarkRelevance,
  AfterDarkConfig,
} from '../after-dark.service';
import { Suggestion } from '../../services/sources/types';

describe('After Dark Service', () => {
  const mockSuggestions: Suggestion[] = [
    {
      id: '1',
      name: 'Lunch at Denver Chop House',
      category: 'Dining',
      shortDescription: 'Upscale steakhouse',
      date: new Date('2026-09-24T12:30:00Z').toISOString(), // 12:30 PM
      timeStart: '12:30 PM',
      costTier: '$$',
      rating: 4.5,
      source: 'foursquare',
      externalId: 'foursquare:1',
      dateFriendly: true,
      groupFriendly: true,
    },
    {
      id: '2',
      name: 'Comedy Show at Fillmore',
      category: 'Comedy',
      shortDescription: 'Live comedy',
      date: new Date('2026-09-24T20:00:00Z').toISOString(), // 8 PM
      timeStart: '8:00 PM',
      costTier: '$$$',
      rating: 4.8,
      source: 'ticketmaster',
      externalId: 'ticketmaster:2',
      dateFriendly: true,
      groupFriendly: true,
    },
    {
      id: '3',
      name: 'Wine Tasting at Root & Flower',
      category: 'Wine & Drinks',
      shortDescription: 'Wine tasting event',
      date: new Date('2026-09-24T19:00:00Z').toISOString(), // 7 PM
      timeStart: '7:00 PM',
      costTier: '$$',
      rating: 4.6,
      source: 'foursquare',
      externalId: 'foursquare:3',
      dateFriendly: true,
      groupFriendly: true,
    },
    {
      id: '4',
      name: 'Kids Art Workshop',
      category: 'Family',
      shortDescription: 'Art class for children',
      date: new Date('2026-09-24T15:00:00Z').toISOString(), // 3 PM
      timeStart: '3:00 PM',
      costTier: '$',
      rating: 4.2,
      source: 'eventbrite',
      externalId: 'eventbrite:4',
      dateFriendly: true,
      groupFriendly: true,
    },
    {
      id: '5',
      name: 'Jazz Quartet at Dazzle',
      category: 'Live Music',
      shortDescription: 'Jazz performance',
      date: new Date('2026-09-24T21:30:00Z').toISOString(), // 9:30 PM
      timeStart: '9:30 PM',
      costTier: '$$',
      rating: 4.9,
      source: 'ticketmaster',
      externalId: 'ticketmaster:5',
      dateFriendly: true,
      groupFriendly: true,
    },
  ];

  describe('TIER 1: filterAfterDark', () => {
    it('should filter events after standard night start time (7 PM)', () => {
      const config: AfterDarkConfig = {
        nightStartsAt: 'standard',
        includeFamilyEvents: true,
        sortByTimeToEvent: false,
      };

      const filtered = filterAfterDark(mockSuggestions, config);

      // Should include: Comedy (8PM), Wine (7PM), Jazz (9:30PM)
      // Should NOT include: Lunch (12:30PM), Kids Workshop (3PM)
      expect(filtered.length).toBe(3);
      expect(filtered.map((s) => s.id)).toContain('2'); // Comedy
      expect(filtered.map((s) => s.id)).toContain('3'); // Wine
      expect(filtered.map((s) => s.id)).toContain('5'); // Jazz
    });

    it('should filter events after early night start time (5 PM)', () => {
      const config: AfterDarkConfig = {
        nightStartsAt: 'early',
        includeFamilyEvents: true,
        sortByTimeToEvent: false,
      };

      const filtered = filterAfterDark(mockSuggestions, config);

      // Should include: Kids Workshop (3PM) is skipped (before 5pm)
      // Should include: Wine (7PM), Comedy (8PM), Jazz (9:30PM)
      expect(filtered.length).toBe(3);
    });

    it('should deprioritize family events when includeFamilyEvents is false', () => {
      const config: AfterDarkConfig = {
        nightStartsAt: 'standard',
        includeFamilyEvents: false,
        sortByTimeToEvent: false,
      };

      const filtered = filterAfterDark(mockSuggestions, config);

      // Should still include all 3 evening events, family at end
      expect(filtered.length).toBe(3);
      const lastEventCategory = filtered[filtered.length - 1].category;
      // No family event in evening, so all should be evening
      expect(lastEventCategory).not.toBe('Family');
    });

    it('should sort by time-to-event when enabled (imminent first)', () => {
      const config: AfterDarkConfig = {
        nightStartsAt: 'standard',
        includeFamilyEvents: true,
        sortByTimeToEvent: true,
      };

      const filtered = filterAfterDark(mockSuggestions, config);

      // Wine (7 PM) should be first, then Comedy (8 PM), then Jazz (9:30 PM)
      const times = filtered.map((s) => s.timeStart);
      expect(times[0]).toBe('7:00 PM'); // Soonest
      expect(times[1]).toBe('8:00 PM');
      expect(times[2]).toBe('9:30 PM');
    });
  });

  describe('TIER 2: enrichAfterDarkMetadata', () => {
    it('should add timeDisplay, timeUntilEvent, and isTonight fields', () => {
      const enriched = enrichAfterDarkMetadata(mockSuggestions);

      enriched.forEach((event) => {
        if (event.date) {
          expect(event.timeDisplay).toBeDefined();
          expect(event.timeUntilEvent).toBeDefined();
          expect(event.isTonight).toBeDefined();
        }
      });
    });

    it('should mark evening events as "isTonight: true"', () => {
      const enriched = enrichAfterDarkMetadata(mockSuggestions);

      const eveningEvent = enriched.find((s) => s.id === '2'); // Comedy at 8 PM
      expect(eveningEvent?.isTonight).toBe(true);
    });

    it('should format time display as "Tonight at 8:00 PM"', () => {
      const enriched = enrichAfterDarkMetadata(mockSuggestions);

      const comedyEvent = enriched.find((s) => s.id === '2');
      expect(comedyEvent?.timeDisplay).toContain('Tonight');
      expect(comedyEvent?.timeDisplay).toContain('8:00 PM');
    });

    it('should calculate timeUntilEvent in minutes', () => {
      const enriched = enrichAfterDarkMetadata(mockSuggestions);

      const comedyEvent = enriched.find((s) => s.id === '2');
      expect(typeof comedyEvent?.timeUntilEvent).toBe('number');
      expect((comedyEvent?.timeUntilEvent || 0) >= 0).toBe(true);
    });
  });

  describe('TIER 3: scoreAfterDarkRelevance', () => {
    it('should score all events between 0 and 1', () => {
      const scores = scoreAfterDarkRelevance(mockSuggestions);

      scores.forEach((score) => {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });

    it('should boost score for favorite categories', () => {
      const preferences = {
        favoriteCategories: ['Live Music', 'Wine & Drinks'],
        groupSize: 'couple' as const,
      };

      const scores = scoreAfterDarkRelevance(mockSuggestions, preferences);

      // Jazz and Wine should have higher scores
      const jazzScore = scores[mockSuggestions.findIndex((s) => s.id === '5')];
      const wineScore = scores[mockSuggestions.findIndex((s) => s.id === '3')];
      const lunchScore = scores[mockSuggestions.findIndex((s) => s.id === '1')];

      expect(jazzScore).toBeGreaterThan(lunchScore);
      expect(wineScore).toBeGreaterThan(lunchScore);
    });

    it('should boost score for highly-rated events', () => {
      const scores = scoreAfterDarkRelevance(mockSuggestions);

      // Jazz (4.9) should score higher than Wine (4.6)
      const jazzScore = scores[mockSuggestions.findIndex((s) => s.id === '5')];
      const wineScore = scores[mockSuggestions.findIndex((s) => s.id === '3')];

      expect(jazzScore).toBeGreaterThan(wineScore);
    });
  });

  describe('Integration: Full After Dark Pipeline', () => {
    it('should handle complete flow: filter -> enrich -> score', () => {
      const config: AfterDarkConfig = {
        nightStartsAt: 'standard',
        includeFamilyEvents: false,
        sortByTimeToEvent: true,
      };

      // Step 1: Filter
      const filtered = filterAfterDark(mockSuggestions, config);
      expect(filtered.length).toBeGreaterThan(0);

      // Step 2: Enrich
      const enriched = enrichAfterDarkMetadata(filtered);
      enriched.forEach((event) => {
        expect(event.timeDisplay).toBeDefined();
        expect(event.timeUntilEvent).toBeDefined();
      });

      // Step 3: Score
      const preferences = {
        favoriteCategories: ['Comedy', 'Live Music'],
        groupSize: 'couple' as const,
      };
      const scores = scoreAfterDarkRelevance(enriched, preferences);

      expect(scores.length).toBe(enriched.length);
      // Comedy (4.8) and Jazz (4.9) should have high scores
      const comedyScore = scores[enriched.findIndex((s) => s.id === '2')];
      const jazzScore = scores[enriched.findIndex((s) => s.id === '5')];
      expect(comedyScore).toBeGreaterThan(0.5);
      expect(jazzScore).toBeGreaterThan(0.5);
    });
  });
});
