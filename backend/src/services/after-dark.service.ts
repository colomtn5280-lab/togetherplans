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

import { AfterDarkItem, AfterDarkTier, AfterDarkWhere, CreateAfterDarkIdeaInput } from '../models/AfterDarkModels';

export class AfterDarkService {
  /**
   * Get all After Dark items (seed + couple-created)
   * Optionally filter by tier (ROMANTIC / SPICY / undefined for all)
   */
  static async getItems(
    groupId?: string,
    tier?: AfterDarkTier
  ): Promise<AfterDarkItem[]> {
    let items: AfterDarkItem[] = [];

    // Load seed catalog (40 items, all groups can see)
    // TODO: fetch from DB or in-memory cache
    // const seedItems = await db.query(
    //   'SELECT * FROM suggestions WHERE category = ? AND source = ?',
    //   ['AFTER_DARK', 'SEED']
    // );
    // items.push(...seedItems);

    // If groupId provided, load couple's custom ideas too
    if (groupId) {
      // TODO: fetch from DB
      // const userIdeas = await db.query(
      //   'SELECT * FROM suggestions WHERE category = ? AND source = ? AND groupId = ?',
      //   ['AFTER_DARK', 'USER', groupId]
      // );
      // items.push(...userIdeas);
    }

    // Filter by tier if specified
    if (tier) {
      items = items.filter((item) => item.tier === tier);
    }

    return items;
  }

  /**
   * Get paginated items (for browsing in Discover)
   */
  static async getItemsPaginated(
    page: number = 1,
    limit: number = 20,
    tier?: AfterDarkTier,
    groupId?: string
  ): Promise<{
    items: AfterDarkItem[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  }> {
    const allItems = await this.getItems(groupId, tier);
    const total = allItems.length;
    const offset = (page - 1) * limit;
    const items = allItems.slice(offset, offset + limit);

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + limit < total,
    };
  }

  /**
   * Create a custom After Dark idea (couple-created)
   * Visible only to that couple
   */
  static async createUserIdea(
    groupId: string,
    userId: string,
    input: CreateAfterDarkIdeaInput
  ): Promise<AfterDarkItem> {
    // Validate input
    if (input.name.length > 40) {
      throw new Error('Name must be ≤ 40 characters');
    }
    if (input.description.length > 140) {
      throw new Error('Description must be ≤ 140 characters');
    }

    // TODO: insert into DB
    // const idea = await db.query(
    //   'INSERT INTO suggestions (id, name, description, category, tier, where, source, groupId, createdById) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    //   [cuid(), input.name, input.description, 'AFTER_DARK', input.tier, input.where, 'USER', groupId, userId]
    // );

    // Stub implementation for now
    return {
      id: `user_${Date.now()}`,
      emoji: input.tier === 'ROMANTIC' ? '💕' : '🔥',
      name: input.name,
      description: input.description,
      where: input.where,
      duration: 'Varies',
      tier: input.tier,
      source: 'USER',
      groupId,
      createdById: userId,
    };
  }

  /**
   * Report a user-created idea
   * Flags for moderation; doesn't delete immediately
   */
  static async reportIdea(itemId: string, reason: string): Promise<void> {
    // TODO: update DB
    // await db.query('UPDATE suggestions SET reported = true WHERE id = ?', [itemId]);
  }

  /**
   * Get category display info for Discover UI
   */
  static getCategoryInfo(): {
    name: string;
    emoji: string;
    description: string;
    color: string;
    tiers: { [key: string]: string };
  } {
    return {
      name: 'After Dark',
      emoji: '🌙',
      description: 'Intimate and playful activities for couples',
      color: '#B2485E', // wine accent
      tiers: {
        ALL: 'Browse all',
        ROMANTIC: 'Romantic moments',
        SPICY: 'Spicy & playful',
      },
    };
  }

  /**
   * Get color tokens for UI
   */
  static getColorTokens(): {
    accent: string;
    soft: string;
    deep: string;
    textOnAccent: string;
  } {
    return {
      accent: '#B2485E',    // main wine color
      soft: '#F7E3E7',      // soft background
      deep: '#8E3448',      // deep wine for dark mode
      textOnAccent: '#FFFFFF',
    };
  }

  /**
   * Calculate search/ranking boost for After Dark category
   * (used by suggestions API when After Dark is selected)
   */
  static getAfterDarkBoost(): number {
    return 1.0; // No special boost; rank by item popularity/recency
  }
}
