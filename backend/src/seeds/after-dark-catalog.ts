/**
 * After Dark Seed Catalog Loader
 * 
 * Loads 40 curated intimate/playful activities (20 Romantic + 20 Spicy)
 * into the AfterDarkItem table on app startup.
 * 
 * Source: https://github.com/colomtn5280-lab/claude_upload/blob/main/AFTER_DARK_MENU.md
 */

import { prisma as db } from '@/services/db';
import { logger } from '@/services/logger';

// Romantic activities (18 items — 'Couples getaway' and 'Adventure bucket list' removed; not After Dark)
const ROMANTIC_ITEMS = [
  {
    title: 'Cook-off challenge',
    description: 'Cook your favorite meal together and judge each other',
    icon: '👨‍🍳',
  },
  {
    title: 'Couples massage',
    description: 'Give each other a relaxing massage at home',
    icon: '💆',
  },
  {
    title: 'Moonlit walk',
    description: 'Take a romantic walk under the stars',
    icon: '🌙',
  },
  {
    title: 'Paint night',
    description: 'Create art together, no experience needed',
    icon: '🎨',
  },
  {
    title: 'Recreate first date',
    description: 'Relive the magic of your first date',
    icon: '💕',
  },
  {
    title: 'Couples yoga',
    description: 'Practice yoga together for wellness and bonding',
    icon: '🧘',
  },
  {
    title: 'Spa day',
    description: 'Pamper yourselves with facials, soaks, or scrubs',
    icon: '🛁',
  },
  {
    title: 'Wine tasting',
    description: 'Sample wines and learn about different varieties',
    icon: '🍷',
  },
  {
    title: 'Breakfast in bed',
    description: 'Make each other a special breakfast feast',
    icon: '🥐',
  },
  {
    title: 'Sunset picnic',
    description: 'Pack a picnic and watch the sunset together',
    icon: '🧺',
  },
  {
    title: 'Slow dancing',
    description: 'Dance together to your favorite slow songs',
    icon: '💃',
  },
  {
    title: 'Movie marathon',
    description: 'Watch your favorite movies back-to-back',
    icon: '🎬',
  },
  {
    title: 'Book club for two',
    description: 'Read the same book and discuss it',
    icon: '📚',
  },
  {
    title: 'Couples photoshoot',
    description: 'Get professional couple photos taken',
    icon: '📷',
  },
  {
    title: 'Cooking class',
    description: 'Take a couples cooking class together',
    icon: '👩‍🍳',
  },
  {
    title: 'Hot tub night',
    description: 'Relax in a hot tub with candles and music',
    icon: '🛁',
  },
  {
    title: 'Couples playlist',
    description: 'Create a playlist of songs that represent your love',
    icon: '🎵',
  },
];

// Spicy activities (20 items)
const SPICY_ITEMS = [
  {
    title: 'Yes/No/Maybe list',
    description: 'Explore desires and boundaries together',
    icon: '🎯',
  },
  {
    title: 'Outfit surprise',
    description: 'Surprise each other with a special outfit',
    icon: '👗',
  },
  {
    title: 'Dare jar',
    description: 'Create a jar of dares for each other',
    icon: '🎲',
  },
  {
    title: 'Love note hunt',
    description: 'Hide love notes around the house for discovery',
    icon: '📝',
  },
  {
    title: 'Share fantasies',
    description: 'Have an open conversation about desires',
    icon: '💭',
  },
  {
    title: 'Blindfolded experience',
    description: 'Explore sensations with limited sight',
    icon: '🕶️',
  },
  {
    title: 'Massage oil play',
    description: 'Use scented oils for a sensual massage',
    icon: '🧴',
  },
  {
    title: 'Couples scavenger hunt',
    description: 'Hide items and clues for playful discovery',
    icon: '🔍',
  },
  {
    title: 'Board game night',
    description: 'Play naughty board games designed for couples',
    icon: '🎮',
  },
  {
    title: 'Intimate playlist',
    description: 'Create a sensual playlist for the mood',
    icon: '🎶',
  },
  {
    title: 'Costume night',
    description: 'Dress up in fun or sexy costumes',
    icon: '🎭',
  },
  {
    title: 'Shower time',
    description: 'Make shower time intimate and playful',
    icon: '🚿',
  },
  {
    title: 'Pillow talk',
    description: 'Have deep, intimate conversations in bed',
    icon: '🛏️',
  },
  {
    title: 'Workout together',
    description: 'Work up a sweat with partner exercises',
    icon: '💪',
  },
  {
    title: 'Intimacy calendar',
    description: 'Plan intimate moments throughout the month',
    icon: '📆',
  },
  {
    title: 'Sensual photoshoot',
    description: 'Take intimate photos of each other',
    icon: '📸',
  },
  {
    title: 'Romantic dinner prep',
    description: 'Cook together then enjoy the meal sensually',
    icon: '🍽️',
  },
  {
    title: 'Oil selection date',
    description: 'Pick massage oils together and explore scents',
    icon: '🧴',
  },
  {
    title: 'Couples workout video',
    description: 'Exercise together as a duo',
    icon: '📺',
  },
];

export async function seedAfterDarkCatalog(): Promise<void> {
  try {
    // Check if already seeded (17 romantic + 19 spicy = 36 total after removing 3 planning items)
    const count = await db.afterDarkItem.count({
      where: { createdBy: null } // Seed items have no creator
    });

    if (count >= 36) {
      logger.info('After Dark catalog already seeded, skipping...');
      return;
    }

    logger.info('Seeding After Dark catalog...');

    // Seed romantic items
    for (const item of ROMANTIC_ITEMS) {
      await db.afterDarkItem.create({
        data: {
          title: item.title,
          description: item.description,
          tier: 'ROMANTIC',
          icon: item.icon,
          color: '#B2485E', // Wine accent
          createdBy: null, // Seed items have no creator
          groupId: null, // Public to all groups
        }
      });
    }

    // Seed spicy items
    for (const item of SPICY_ITEMS) {
      await db.afterDarkItem.create({
        data: {
          title: item.title,
          description: item.description,
          tier: 'SPICY',
          icon: item.icon,
          color: '#8E3448', // Deep wine
          createdBy: null,
          groupId: null,
        }
      });
    }

    logger.info(`After Dark catalog seeded successfully (${ROMANTIC_ITEMS.length + SPICY_ITEMS.length} items)`, {
      romantic: ROMANTIC_ITEMS.length,
      spicy: SPICY_ITEMS.length
    });
  } catch (error) {
    logger.error('Failed to seed After Dark catalog', {
      context: 'seedAfterDarkCatalog',
      error: error instanceof Error ? error.message : String(error)
    });
    // Don't throw - allow app to continue if seeding fails
  }
}
