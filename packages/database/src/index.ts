// Export Prisma types
export * from '@prisma/client';

// Export singleton Prisma Client instance
import { prisma as prismaInstance } from './client.js';
export const prisma = prismaInstance;
