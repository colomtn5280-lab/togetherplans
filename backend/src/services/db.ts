import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://datenight:datenight@localhost:5432/datenight?schema=public';

const adapter = new PrismaPg({ connectionString });

// Single shared Prisma client instance
export const prisma = new PrismaClient({ adapter });
