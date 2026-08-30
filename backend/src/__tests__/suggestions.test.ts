process.env.NODE_ENV = 'test';

import { getSuggestions } from '@/services/suggestions';

describe('getSuggestions', () => {
  it('returns 3-5 suggestions', async () => {
    const result = await getSuggestions({});
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('filters by category', async () => {
    const result = await getSuggestions({ category: 'restaurant' });
    expect(result.length).toBeGreaterThan(0);
    for (const s of result) {
      expect(s.category).toBe('restaurant');
    }
  });

  it('randomizes order across calls (statistically)', async () => {
    const runs = await Promise.all(
      Array.from({ length: 10 }, () => getSuggestions({}))
    );
    const firstNames = new Set(runs.map((r) => r[0].name));
    // 10 shuffles of 15 items yielding the identical first item every time is ~0
    expect(firstNames.size).toBeGreaterThan(1);
  });

  it('every suggestion has name, category, description', async () => {
    const result = await getSuggestions({});
    for (const s of result) {
      expect(s.name).toBeTruthy();
      expect(s.category).toBeTruthy();
      expect(s.description).toBeTruthy();
    }
  });
});
