import { Prisma } from '@prisma/client';
import { prisma } from '../db';

type Db = Prisma.TransactionClient | typeof prisma;

const clip = (s: string | null | undefined, max: number) =>
  s == null ? s : s.length > max ? s.slice(0, max) : s;

export async function logAction(
  action: string,
  entityName: string,
  entityId: string | number | null,
  performedBy: string | null,
  details: string,
  db: Db = prisma,
) {
  await db.auditLog.create({
    data: {
      action: clip(action, 50)!,
      entityName: clip(entityName, 50)!,
      entityId: entityId == null ? null : clip(String(entityId), 50),
      performedBy: clip(performedBy ?? 'SYSTEM', 100)!,
      details: clip(details, 1000),
    },
  });
}
