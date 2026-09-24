/**
 * After Dark Service Tests
 * 
 * Tests for: browse, filter, create custom ideas, pagination
 */

import { AfterDarkService } from '../after-dark.service';
import { AfterDarkItem, AfterDarkTier } from '../../models/AfterDarkModels';

describe('AfterDarkService', () => {
  describe('getItems', () => {
    it('should return items (seed + couple ideas)', async () => {
      const items = await AfterDarkService.getItems();
      expect(items).toBeDefined();
      expect(Array.isArray(items)).toBe(true);
    });

    it('should filter by ROMANTIC tier', async () => {
      const items = await AfterDarkService.getItems(undefined, 'ROMANTIC');
      items.forEach((item) => {
        expect(item.tier).toBe('ROMANTIC');
      });
    });

    it('should filter by SPICY tier', async () => {
      const items = await AfterDarkService.getItems(undefined, 'SPICY');
      items.forEach((item) => {
        expect(item.tier).toBe('SPICY');
      });
    });
  });

  describe('getItemsPaginated', () => {
    it('should paginate results', async () => {
      const result = await AfterDarkService.getItemsPaginated(1, 10);
      expect(result.items).toBeDefined();
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBeGreaterThan(0);
      expect(result.hasMore).toBeDefined();
    });

    it('should have correct hasMore flag', async () => {
      const result = await AfterDarkService.getItemsPaginated(1, 5);
      if (result.total > 5) {
        expect(result.hasMore).toBe(true);
      } else {
        expect(result.hasMore).toBe(false);
      }
    });

    it('should filter by tier in pagination', async () => {
      const result = await AfterDarkService.getItemsPaginated(1, 20, 'ROMANTIC');
      result.items.forEach((item) => {
        expect(item.tier).toBe('ROMANTIC');
      });
    });
  });

  describe('createUserIdea', () => {
    it('should create a user idea', async () => {
      const idea = await AfterDarkService.createUserIdea(
        'group-123',
        'user-456',
        {
          groupId: 'group-123',
          name: 'Candlelit dinner',
          description: 'Cook together at home with soft music.',
          tier: 'ROMANTIC',
          where: 'HOME',
        }
      );

      expect(idea).toBeDefined();
      expect(idea.name).toBe('Candlelit dinner');
      expect(idea.tier).toBe('ROMANTIC');
      expect(idea.source).toBe('USER');
      expect(idea.groupId).toBe('group-123');
      expect(idea.createdById).toBe('user-456');
    });

    it('should reject name > 40 chars', async () => {
      const longName = 'a'.repeat(41);
      await expect(
        AfterDarkService.createUserIdea(
          'group-123',
          'user-456',
          {
            groupId: 'group-123',
            name: longName,
            description: 'Short description',
            tier: 'ROMANTIC',
            where: 'HOME',
          }
        )
      ).rejects.toThrow('Name must be ≤ 40 characters');
    });

    it('should reject description > 140 chars', async () => {
      const longDesc = 'a'.repeat(141);
      await expect(
        AfterDarkService.createUserIdea(
          'group-123',
          'user-456',
          {
            groupId: 'group-123',
            name: 'Activity name',
            description: longDesc,
            tier: 'ROMANTIC',
            where: 'HOME',
          }
        )
      ).rejects.toThrow('Description must be ≤ 140 characters');
    });
  });

  describe('getCategoryInfo', () => {
    it('should return category display info', () => {
      const info = AfterDarkService.getCategoryInfo();
      expect(info.name).toBe('After Dark');
      expect(info.emoji).toBe('🌙');
      expect(info.description).toContain('intimate');
      expect(info.color).toBe('#B2485E');
      expect(info.tiers).toBeDefined();
      expect(info.tiers.ALL).toBeDefined();
      expect(info.tiers.ROMANTIC).toBeDefined();
      expect(info.tiers.SPICY).toBeDefined();
    });
  });

  describe('getColorTokens', () => {
    it('should return wine color palette', () => {
      const colors = AfterDarkService.getColorTokens();
      expect(colors.accent).toBe('#B2485E');
      expect(colors.soft).toBe('#F7E3E7');
      expect(colors.deep).toBe('#8E3448');
      expect(colors.textOnAccent).toBe('#FFFFFF');
    });
  });

  describe('getAfterDarkBoost', () => {
    it('should return no special boost (1.0)', () => {
      const boost = AfterDarkService.getAfterDarkBoost();
      expect(boost).toBe(1.0);
    });
  });

  describe('reportIdea', () => {
    it('should flag idea for moderation', async () => {
      await expect(
        AfterDarkService.reportIdea('item-123', 'Inappropriate content')
      ).resolves.toBeUndefined();
    });
  });
});
