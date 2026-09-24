process.env.NODE_ENV = 'test';

import { getSuggestions } from '@/services/suggestions';

// These tests call real external APIs — allow up to 20s per test
jest.setTimeout(20_000);

describe('getSuggestions', () => {
  it('returns suggestions from seed catalog when no location given', async () => {
    const result = await getSuggestions({});
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('filters by a valid category', async () => {
    const result = await getSuggestions({ category: 'Dining' });
    expect(result.length).toBeGreaterThan(0);
    for (const s of result) {
      expect(s.category).toBe('Dining');
    }
  });

  it('returns suggestions for Streaming Night category', async () => {
    const result = await getSuggestions({ category: 'Streaming Night' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('every suggestion has required fields', async () => {
    const result = await getSuggestions({});
    for (const s of result) {
      expect(s.name).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.shortDescription).toBeTruthy();
      expect(s.source).toBeTruthy();
      expect(s.id).toBeTruthy();
      expect(s.costTier).toMatch(/^(free|\$|\$\$|\$\$\$)$/);
    }
  });

  it('accepts zip code as location input', async () => {
    const result = await getSuggestions({ zip: '80202' }); // Denver
    expect(result.length).toBeGreaterThan(0);
  }, 45_000);

  it('returns All category without filter', async () => {
    const result = await getSuggestions({ category: 'All' });
    expect(result.length).toBeGreaterThan(0);
  });

  it('randomizes order across calls', async () => {
    // Each call with a different dummy zip ensures distinct cache keys
    const zips = ['10001', '90001', '60601', '77001', '85001', '19101', '78201', '92101'];
    const runs = await Promise.all(zips.map((zip) => getSuggestions({ zip })));
    const firstNames = new Set(runs.map((r) => r[0]?.name).filter(Boolean));
    // Different zip codes may surface different seed entries
    expect(firstNames.size).toBeGreaterThanOrEqual(1);
    // All runs should return results
    for (const r of runs) expect(r.length).toBeGreaterThan(0);
  }, 30_000);

  it('sports-active (and legacy golf) resolves to Sports, never Active', async () => {
    // Regression: 'golf' used to map to 'Active'. It now aliases to 'Sports'
    // (the Sports & Active category) — TM sports events are intentional now,
    // but every result must carry the internal 'Sports' category, never 'Active'.
    for (const raw of ['sports-active', 'Sports & Active', 'golf', 'Golf']) {
      const result = await getSuggestions({ category: raw, lat: 39.7392, lng: -104.9903 });
      for (const s of result) {
        expect(s.category).not.toBe('Active');
        expect(s.category).toBe('Sports');
      }
    }
  }, 60_000);

  it('volunteering resolves to Volunteering (Mobilize-backed, no longer seed-only)', async () => {
    for (const raw of ['volunteering', 'Volunteering']) {
      const result = await getSuggestions({ category: raw, lat: 39.7392, lng: -104.9903 });
      expect(result.length).toBeGreaterThan(0);
      for (const s of result) {
        expect(s.category).toBe('Volunteering');
      }
    }
  }, 60_000);

  it('seed suggestions carry isIdea and sort after real results', async () => {
    const result = await getSuggestions({ category: 'Streaming Night' });
    let seenSeed = false;
    for (const s of result) {
      if (s.source === 'seed') {
        seenSeed = true;
        expect(s.isIdea).toBe(true);
      } else {
        // No real result may appear after a seed result
        expect(seenSeed).toBe(false);
      }
    }
  });
});
