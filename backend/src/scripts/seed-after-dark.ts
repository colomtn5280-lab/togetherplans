/**
 * seed-after-dark.ts
 *
 * Seeds 40 AfterDarkItems (20 ROMANTIC + 20 SPICY) into the production DB.
 * Run with:
 *   cd /root/DateNight/backend && npx ts-node -r tsconfig-paths/register src/scripts/seed-after-dark.ts
 *
 * Idempotent — deletes existing seed items (createdBy=null) first, then re-inserts.
 */

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString = process.env.DATABASE_URL || 'postgresql://datenight:***@localhost:5432/datenight?schema=public';
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ROMANTIC_ITEMS = [
  {
    title: 'Stargazing picnic',
    description: 'Blanket, wine, a sky full of stars. No phones allowed.',
    icon: '🌟',
    color: '#F7E3E7',
  },
  {
    title: 'Couples massage at home',
    description: 'Dim the lights, put on a playlist, take turns.',
    icon: '💆',
    color: '#E8C0C8',
  },
  {
    title: 'Midnight kitchen experiment',
    description: "Cook something you've never made together at 11pm.",
    icon: '🍳',
    color: '#F4D0D8',
  },
  {
    title: 'Wine and paint night',
    description: 'Cheap canvases, a YouTube tutorial, no pressure.',
    icon: '🎨',
    color: '#F7E3E7',
  },
  {
    title: 'Love letter exchange',
    description: 'Write one page. Read them out loud. No skipping.',
    icon: '💌',
    color: '#E8C0C8',
  },
  {
    title: 'Rooftop or balcony dinner',
    description: 'Takeout elevated by candles and the night air.',
    icon: '🕯️',
    color: '#F4D0D8',
  },
  {
    title: 'Slow dance in the living room',
    description: 'Put on your song. No audience needed.',
    icon: '💃',
    color: '#F7E3E7',
  },
  {
    title: "Draw each other's portrait",
    description: 'Terrible art guaranteed. Framed anyway.',
    icon: '🖼️',
    color: '#E8C0C8',
  },
  {
    title: 'Recreate your first date',
    description: 'Same place, same order, same energy.',
    icon: '💕',
    color: '#F4D0D8',
  },
  {
    title: 'Moonlit walk',
    description: 'No destination. Just the night and each other.',
    icon: '🌙',
    color: '#F7E3E7',
  },
  {
    title: 'Couples tarot or astrology deep dive',
    description: "Believe in it or not, it's a conversation starter.",
    icon: '🔮',
    color: '#E8C0C8',
  },
  {
    title: 'Watch the sunrise together',
    description: 'Set an alarm. Worth every lost hour of sleep.',
    icon: '🌅',
    color: '#F4D0D8',
  },
  {
    title: 'Homemade spa night',
    description: 'Face masks, hot towels, candles, no schedule.',
    icon: '🛁',
    color: '#F7E3E7',
  },
  {
    title: 'Write a bucket list together',
    description: "Put it somewhere you'll both see it.",
    icon: '📝',
    color: '#E8C0C8',
  },
  {
    title: 'Hide notes around the house',
    description: 'They find them one by one through the next week.',
    icon: '🗒️',
    color: '#F4D0D8',
  },
  {
    title: 'Champagne and strawberries',
    description: 'Classic for a reason. Upgrade the glassware.',
    icon: '🍓',
    color: '#B2485E',
  },
  {
    title: 'Blindfolded taste test',
    description: 'Feed each other, guess the ingredient. Gets silly fast.',
    icon: '🫐',
    color: '#F7E3E7',
  },
  {
    title: 'Read to each other',
    description: "One chapter each. Pick something neither of you has read.",
    icon: '📖',
    color: '#E8C0C8',
  },
  {
    title: 'Dance class at home',
    description: 'YouTube salsa tutorial. Expect to step on feet.',
    icon: '👟',
    color: '#F4D0D8',
  },
  {
    title: 'Memory jar',
    description: 'Write down your 10 favorite shared memories on slips of paper.',
    icon: '🫙',
    color: '#F7E3E7',
  },
];

const SPICY_ITEMS = [
  {
    title: 'Truth or dare for couples',
    description: 'Custom rules, no way out of a dare.',
    icon: '🎯',
    color: '#2D1B2E',
  },
  {
    title: 'Two truths and a lie',
    description: 'How well do you really know each other?',
    icon: '🎭',
    color: '#8E3448',
  },
  {
    title: '36 questions that lead to love',
    description: 'The NYT study. Works every time.',
    icon: '❓',
    color: '#4A1525',
  },
  {
    title: 'Midnight drive, no destination',
    description: 'Pick a direction, see where you end up.',
    icon: '🚗',
    color: '#B2485E',
  },
  {
    title: 'Skinny dipping (if you can)',
    description: 'Find a private pool, hot tub, or lake.',
    icon: '🏊',
    color: '#2D1B2E',
  },
  {
    title: 'Couples bucket list challenge',
    description: 'Pick one thing to do this month. Book it tonight.',
    icon: '🗺️',
    color: '#8E3448',
  },
  {
    title: 'Role play a first date',
    description: 'Pretend you just met. At a bar, or at home.',
    icon: '🎬',
    color: '#4A1525',
  },
  {
    title: 'Karaoke for two',
    description: 'Full commitment, no holding back, at home or out.',
    icon: '🎤',
    color: '#B2485E',
  },
  {
    title: 'Tattoo roulette',
    description: 'Each picks a small tattoo for the other. Both get it. Or just plan it.',
    icon: '🎱',
    color: '#2D1B2E',
  },
  {
    title: 'Dare jar',
    description: 'Fill a jar with dares. Draw one. No vetoes.',
    icon: '🫙',
    color: '#8E3448',
  },
  {
    title: 'Couples strip trivia',
    description: 'Wrong answer = one item. Your rules.',
    icon: '🃏',
    color: '#4A1525',
  },
  {
    title: 'Blind restaurant roulette',
    description: "One person picks, the other doesn't know until you arrive.",
    icon: '🍽️',
    color: '#B2485E',
  },
  {
    title: 'Adrenaline date',
    description: 'Axe throwing, rock climbing, haunted house, escape room.',
    icon: '⚡',
    color: '#2D1B2E',
  },
  {
    title: 'Photo shoot for two',
    description: 'Best outfits, your space, your own photographer rules.',
    icon: '📸',
    color: '#8E3448',
  },
  {
    title: 'Confessions game',
    description: 'Each writes 3 confessions. Read and react.',
    icon: '🤫',
    color: '#4A1525',
  },
  {
    title: '30-day challenge together',
    description: 'Pick something: cold showers, no phones after 9, daily walk.',
    icon: '📅',
    color: '#B2485E',
  },
  {
    title: 'Make a couples playlist',
    description: 'Each adds 10 songs. Listen to all 20 together.',
    icon: '🎵',
    color: '#2D1B2E',
  },
  {
    title: 'Cook a full 3-course meal',
    description: 'Appetizer, main, dessert. Dress up for it.',
    icon: '👨‍🍳',
    color: '#8E3448',
  },
  {
    title: 'Watch a foreign film',
    description: 'No subtitles for the first 10 minutes. Make up the dialogue.',
    icon: '🎞️',
    color: '#4A1525',
  },
  {
    title: 'Plan a surprise trip',
    description: 'One person plans it entirely. The other finds out at the airport.',
    icon: '✈️',
    color: '#B2485E',
  },
];

async function main() {
  console.log('🌙 Seeding After Dark catalog...');

  // Clear existing seed items (null createdBy = seed items)
  const deleted = await prisma.afterDarkItem.deleteMany({
    where: { createdBy: null },
  });
  console.log(`Deleted ${deleted.count} existing seed items`);

  // Seed romantic items
  let romanticCount = 0;
  for (const item of ROMANTIC_ITEMS) {
    await prisma.afterDarkItem.create({
      data: {
        title: item.title,
        description: item.description,
        tier: 'ROMANTIC',
        icon: item.icon,
        color: item.color,
        createdBy: null,
        groupId: null,
      },
    });
    romanticCount++;
  }
  console.log(`✅ Seeded ${romanticCount} ROMANTIC items`);

  // Seed spicy items
  let spicyCount = 0;
  for (const item of SPICY_ITEMS) {
    await prisma.afterDarkItem.create({
      data: {
        title: item.title,
        description: item.description,
        tier: 'SPICY',
        icon: item.icon,
        color: item.color,
        createdBy: null,
        groupId: null,
      },
    });
    spicyCount++;
  }
  console.log(`✅ Seeded ${spicyCount} SPICY items`);

  const total = await prisma.afterDarkItem.count();
  console.log(`\n🎉 Done! Total AfterDarkItems in DB: ${total}`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
