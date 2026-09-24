/**
 * After Dark Category Service
 * 
 * After Dark surfaces intimate/playful activities as a category option in Discover.
 * 
 * Features:
 *   - Browse 40-item seed catalog (20 Romantic + 20 Spicy)
 *   - Filter by tier (All / Romantic / Spicy)
 *   - Create custom intimate ideas (visible to couple only)
 *   - Propose using standard propose → vote → decide flow
 *   - Activities mix with normal categories in final date plans
 * 
 * Design tokens:
 *   - Accent wine: #B2485E
 *   - Soft background: #F7E3E7
 *   - Deep wine: #8E3448
 *   - Icon: 🌙
 */

import { prisma as db } from '@/services/db';
import { AfterDarkItem, AfterDarkTier, CreateAfterDarkIdeaInput } from '../models/AfterDarkModels';
import { logger } from '@/services/logger';

export class AfterDarkService {
  /**
   * Get all After Dark items (seed + couple-created)
   * Optionally filter by tier (ROMANTIC / SPICY / undefined for all)
   */
  static async getItems(
    groupId?: string,
    tier?: AfterDarkTier,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: AfterDarkItem[], total: number, page: number, limit: number }> {
    // Validate pagination
    page = Math.max(1, Math.min(page, 1000));
    limit = Math.max(1, Math.min(limit, 100));

    const where: Record<string, unknown> = {
      OR: [
        { createdBy: null }, // Public seed items (visible to all)
        { groupId }, // Couple's custom ideas (if groupId provided)
      ]
    };

    if (tier && ['ROMANTIC', 'SPICY'].includes(tier)) {
      where.tier = tier;
    }

    try {
      const [items, total] = await Promise.all([
        db.afterDarkItem.findMany({
          where,
          orderBy: [
            { createdBy: 'asc' }, // Seed items first (createdBy null sorts first)
            { createdAt: 'desc' }
          ],
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.afterDarkItem.count({ where })
      ]);

      return {
        items: items as AfterDarkItem[],
        total,
        page,
        limit
      };
    } catch (error) {
      logger.error('Failed to fetch After Dark items', {
        context: 'getItems',
        groupId,
        tier,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get items by tier with pagination
   */
  static async getItemsByTier(
    tier: AfterDarkTier,
    groupId?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: AfterDarkItem[], total: number }> {
    if (!['ROMANTIC', 'SPICY'].includes(tier)) {
      throw new Error(`Invalid tier: ${tier}`);
    }

    return this.getItems(groupId, tier as AfterDarkTier, page, limit);
  }

  /**
   * Create a custom After Dark idea for a couple
   */
  static async createIdea(
    groupId: string,
    userId: string,
    input: CreateAfterDarkIdeaInput
  ): Promise<AfterDarkItem> {
    // Validate input
    if (!input.title?.trim() || input.title.length > 140) {
      throw new Error('Title required (1-140 characters)');
    }
    if (!input.description?.trim()) {
      throw new Error('Description required');
    }
    if (!['ROMANTIC', 'SPICY'].includes(input.tier)) {
      throw new Error('Tier must be ROMANTIC or SPICY');
    }

    try {
      const idea = await db.afterDarkItem.create({
        data: {
          title: input.title.trim(),
          description: input.description.trim(),
          tier: input.tier,
          icon: input.icon || '💡',
          color: input.tier === 'ROMANTIC' ? '#B2485E' : '#8E3448',
          groupId,
          createdBy: userId,
        }
      });

      logger.info('Created After Dark idea', {
        context: 'createIdea',
        ideaId: idea.id,
        groupId,
        userId,
        tier: input.tier
      });

      return idea as AfterDarkItem;
    } catch (error) {
      logger.error('Failed to create After Dark idea', {
        context: 'createIdea',
        groupId,
        userId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get couple's custom ideas only (not seed catalog)
   */
  static async getCoupleIdeas(
    groupId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{ items: AfterDarkItem[], total: number }> {
    page = Math.max(1, Math.min(page, 1000));
    limit = Math.max(1, Math.min(limit, 100));

    try {
      const [items, total] = await Promise.all([
        db.afterDarkItem.findMany({
          where: {
            groupId,
            createdBy: { not: null } // Only user-created ideas
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.afterDarkItem.count({
          where: {
            groupId,
            createdBy: { not: null }
          }
        })
      ]);

      return {
        items: items as AfterDarkItem[],
        total
      };
    } catch (error) {
      logger.error('Failed to fetch couple ideas', {
        context: 'getCoupleIdeas',
        groupId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Report an inappropriate idea (increment report counter)
   */
  static async reportIdea(ideaId: string): Promise<void> {
    try {
      await db.afterDarkItem.update({
        where: { id: ideaId },
        data: { reportedCount: { increment: 1 } }
      });

      logger.info('Reported After Dark idea', {
        context: 'reportIdea',
        ideaId
      });
    } catch (error) {
      logger.error('Failed to report After Dark idea', {
        context: 'reportIdea',
        ideaId,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get seed catalog (public items, no couple ideas)
   */
  static async getSeedCatalog(
    tier?: AfterDarkTier
  ): Promise<AfterDarkItem[]> {
    const where: Record<string, unknown> = { createdBy: null }; // Only seed items

    if (tier && ['ROMANTIC', 'SPICY'].includes(tier)) {
      where.tier = tier;
    }

    try {
      return await db.afterDarkItem.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      }) as AfterDarkItem[];
    } catch (error) {
      logger.error('Failed to fetch seed catalog', {
        context: 'getSeedCatalog',
        tier,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get After Dark category metadata for Discover
   */
  static getCategoryInfo(): {
    id: string;
    name: string;
    emoji: string;
    description: string;
    color: string;
    accentColor: string;
    softBgColor: string;
    deepColor: string;
  } {
    return {
      id: 'after-dark',
      name: 'After Dark',
      emoji: '🌙',
      description: 'Intimate & playful activities for couples',
      color: '#B2485E',
      accentColor: '#B2485E',
      softBgColor: '#F7E3E7',
      deepColor: '#8E3448'
    };
  }

  /**
   * Get stats for a group's After Dark usage
   */
  static async getGroupStats(groupId: string): Promise<{
    totalIdeas: number;
    romanticIdeas: number;
    spicyIdeas: number;
  }> {
    try {
      const [total, romantic, spicy] = await Promise.all([
        db.afterDarkItem.count({
          where: {
            groupId,
            createdBy: { not: null }
          }
        }),
        db.afterDarkItem.count({
          where: {
            groupId,
            createdBy: { not: null },
            tier: 'ROMANTIC'
          }
        }),
        db.afterDarkItem.count({
          where: {
            groupId,
            createdBy: { not: null },
            tier: 'SPICY'
          }
        })
      ]);

      return {
        totalIdeas: total,
        romanticIdeas: romantic,
        spicyIdeas: spicy
      };
    } catch (error) {
      logger.error('Failed to fetch group stats', {
        context: 'getGroupStats',
        groupId,
        error: error instanceof Error ? error.message : String(error)
      });
      return {
        totalIdeas: 0,
        romanticIdeas: 0,
        spicyIdeas: 0
      };
    }
  }
}
