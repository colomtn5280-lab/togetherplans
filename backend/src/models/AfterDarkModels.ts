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
 * After Dark Activity Item (matches database schema)
 * Can be SEED (40-item catalog) or USER (couple-created)
 */
export interface AfterDarkItem {
  id: string;
  title: string;
  description: string;
  tier: AfterDarkTier;        // ROMANTIC | SPICY (filter/label)
  icon: string | null;        // Emoji or icon name
  color: string;              // Hex color
  createdBy: string | null;   // null for seed items, userId for couple-created
  groupId: string | null;     // null for seed, groupId for couple ideas
  reportedCount: number;      // Number of times reported
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a custom After Dark idea
 */
export interface CreateAfterDarkIdeaInput {
  title: string;
  description: string;
  tier: AfterDarkTier;
  icon?: string;
  // groupId and userId come from context (not input)
}

/**
 * After Dark Category Display
 * Shows in Discover alongside Wine & Drinks, Dining, Live Music, etc.
 * Visible to all groups (not couple-restricted at browse level)
 */
export interface AfterDarkCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  accentColor: string;
  softBgColor: string;
  deepColor: string;
}

/**
 * API Response wrapper for paginated items
 */
export interface AfterDarkItemsResponse {
  items: AfterDarkItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
