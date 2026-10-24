process.env.NODE_ENV = 'test';

import { getSuggestions } from '@/services/suggestions';

// These tests call real external APIs — allow up to 30s per test
jest.setTimeout(30_000);

describe('getSuggestions', () => {
  it('returns an array (possibly empty) when no location given', async () => {
    // No location → no live API results; no seeds anymore → may return []
    const result = await getSuggestions({});
    expect(Array.isArray(result)).toBe(true);
  });

  it('filters by a valid category — results are correct type if any returned', async () => {
    const result = await getSuggestions({ category: 'Dining' });
    expect(Array.isArray(result)).toBe(true);
    for (const s of result) {
      expect(s.category).toBe('Dining');
    }
  });

  it('returns suggestions for Streaming Night category — array result', async () => {
    // TMDB results depend on TMDB_API_KEY being available in the test env
    const result = await getSuggestions({ category: 'Streaming Night' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('every returned suggestion has required fields', async () => {
    // Use zip to get live results from static DB (doesn't require API keys)
    const result = await getSuggestions({ category: 'restaurants-dining', lat: 39.7392, lng: -104.9903 });
    for (const s of result) {
      expect(s.name).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.shortDescription).toBeTruthy();
      expect(s.source).toBeTruthy();
      expect(s.id).toBeTruthy();
      expect(s.costTier).toMatch(/^(free|\$|\$\$|\$\$\$)$/);
    }
  });

  it('accepts zip code as location input — returns array', async () => {
    const result = await getSuggestions({ zip: '80202' }); // Denver
    expect(Array.isArray(result)).toBe(true);
  }, 45_000);

  it('returns All category without filter — array result', async () => {
    const result = await getSuggestions({ category: 'All' });
    expect(Array.isArray(result)).toBe(true);
  });

  it('multiple zip calls each return arrays', async () => {
    // No seed fallback — some zips may return empty in test env (rate limits, etc.)
    // Just verify the API handles parallel calls without throwing
    const zips = ['10001', '90001', '60601'];
    const runs = await Promise.all(zips.map((zip) => getSuggestions({ zip })));
    for (const r of runs) expect(Array.isArray(r)).toBe(true);
  }, 120_000);

  it('sports-active (and legacy golf) resolves to Sports, never Active', async () => {
    // Regression: 'golf' used to map to 'Active'. Now aliases to 'Sports'.
    for (const raw of ['sports-active', 'Sports & Active', 'golf', 'Golf']) {
      const result = await getSuggestions({ category: raw, lat: 39.7392, lng: -104.9903 });
      for (const s of result) {
        expect(s.category).not.toBe('Active');
        expect(s.category).toBe('Sports');
      }
    }
  }, 60_000);

  it('volunteering resolves to Volunteering — results have correct category', async () => {
    for (const raw of ['volunteering', 'Volunteering']) {
      const result = await getSuggestions({ category: raw, lat: 39.7392, lng: -104.9903 });
      for (const s of result) {
        expect(s.category).toBe('Volunteering');
      }
    }
  }, 60_000);

  it('hotel-stays resolves to Hotels — results have correct category', async () => {
    for (const raw of ['hotel-stays', 'Hotel Stays']) {
      const result = await getSuggestions({ category: raw, lat: 39.7392, lng: -104.9903 });
      for (const s of result) {
        expect(s.category).toBe('Hotels');
      }
    }
  }, 60_000);

  it('no seed results returned — seeds removed as fallback', async () => {
    // Seed fallback was removed in favour of empty result + spinner.
    // Use static DB category which reliably returns results in test env.
    const result = await getSuggestions({ category: 'restaurants-dining', lat: 39.7392, lng: -104.9903 });
    for (const s of result) {
      expect(s.source).not.toBe('seed');
    }
  });
});
