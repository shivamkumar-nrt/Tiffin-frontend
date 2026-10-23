import { Prisma } from '@prisma/client';

export const num = (d: Prisma.Decimal | number | null | undefined): number =>
  d === null || d === undefined ? 0 : Number(d);

export const numOrNull = (d: Prisma.Decimal | number | null | undefined): number | null =>
  d === null || d === undefined ? null : Number(d);

export const dec = (v: number | string | Prisma.Decimal) => new Prisma.Decimal(v);

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
