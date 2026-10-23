import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { num } from '../serialize';

type Db = Prisma.TransactionClient | typeof prisma;

export async function userBalance(userId: number, db: Db = prisma): Promise<number> {
  const r = await db.tiffinRecord.aggregate({
    where: { userId, status: 'UNPAID' },
    _sum: { chargedAmount: true },
  });
  return num(r._sum.chargedAmount);
}

/** Outstanding balance per user id, in one query. */
export async function balancesFor(userIds: number[], db: Db = prisma): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (!userIds.length) return map;
  const rows = await db.tiffinRecord.groupBy({
    by: ['userId'],
    where: { userId: { in: userIds }, status: 'UNPAID' },
    _sum: { chargedAmount: true },
  });
  for (const r of rows) map.set(r.userId, num(r._sum.chargedAmount));
  return map;
}
