/**
 * After Dark Category Models
 * 
 * After Dark is a category within Discover that surfaces intimate/playful activities.
 * - Browse seed catalog (40 items: 20 Romantic + 20 Spicy)
 * - Or create custom intimate ideas
 * - Propose using standard propose → vote → decide loop
 * - Activities mix with normal categories in proposals
 * 
 * Spec: https://github.com/colomtn5280-lab/claude_upload/blob/main/AFTER_DARK_SPEC.md
 */

export type AfterDarkTier = 'ROMANTIC' | 'SPICY';
export type AfterDarkWhere = 'HOME' | 'OUT';

/**
 * After Dark Activity Item
 * Can be SEED (40-item catalog) or USER (couple-created)
 */
export interface AfterDarkItem {
  id: string;
  emoji: string;
  name: string;
  description: string;
  where: AfterDarkWhere;      // HOME | OUT
  duration: string;           // "2h", "90m", "1 night", etc.
  tier: AfterDarkTier;        // ROMANTIC | SPICY (filter/label)
  source: 'SEED' | 'USER';    // SEED = catalog, USER = couple-created
  groupId?: string;           // if USER: visible only to this couple
  createdById?: string;       // user who added it
  reported?: boolean;         // flag for user-generated content moderation
}

/**
 * After Dark Category Display
 * Shows in Discover alongside Wine & Drinks, Dining, Live Music, etc.
 * Visible to all groups (not couple-restricted at browse level)
 */
export interface AfterDarkCategory {
  name: 'After Dark';
  emoji: '🌙';
  description: 'Intimate and playful activities for couples';
  color: '#B2485E';           // wine accent from spec
  tiers: {
    ALL: 'Browse all';
    ROMANTIC: 'Romantic moments';
    SPICY: 'Spicy & playful';
  };
}

/**
 * User-Created After Dark Idea
 * Form: name, description, tier (Romantic/Spicy), where (Home/Out)
 */
export interface CreateAfterDarkIdeaInput {
  groupId: string;
  name: string;              // ≤ 40 chars
  description: string;       // ≤ 140 chars
  tier: AfterDarkTier;       // ROMANTIC | SPICY
  where: AfterDarkWhere;     // HOME | OUT
}

/**
 * After Dark Seed Catalog (40 items)
 * Import from after_dark_menu.json
 * 20 ROMANTIC + 20 SPICY
 */
export const AFTER_DARK_ROMANTIC_COUNT = 20;
export const AFTER_DARK_SPICY_COUNT = 20;
export const AFTER_DARK_TOTAL_ITEMS = 40;
