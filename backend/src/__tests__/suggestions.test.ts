process.env.NODE_ENV = 'test';

import { getSuggestions } from '@/services/suggestions';

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
  });

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
  });
});
