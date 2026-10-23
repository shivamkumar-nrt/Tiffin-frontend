/**
 * Shared importer: loads legacy rows (snake_case columns, exactly as the old Spring/Hibernate
 * backend stored them) into the Prisma schema. Ids and password hashes are preserved.
 */
import type { PrismaClient } from '@prisma/client';

export type Row = Record<string, any>;
export type Dump = Record<string, Row[]>;

let TZ = 'Asia/Kolkata';

function tzOffsetMs(utcMs: number, tz: string): number {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(f.find((p) => p.type === t)!.value);
  const asUtc = Date.UTC(g('year'), g('month') - 1, g('day'), g('hour'), g('minute'), g('second'));
  return asUtc - Math.floor(utcMs / 1000) * 1000;
}

/** 'YYYY-MM-DD HH:MM:SS[.ffffff]' wall-clock in TZ -> Date (UTC instant). */
function ts(v: string | null | undefined): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?$/.exec(v);
  if (!m) throw new Error(`Unrecognised timestamp: ${v}`);
  const ms = m[7] ? Number(m[7].padEnd(3, '0').slice(0, 3)) : 0;
  const naive = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6], ms);
  const guess = naive - tzOffsetMs(naive, TZ);
  return new Date(naive - tzOffsetMs(guess, TZ));
}

const day = (v: string | null | undefined) => (v ? new Date(`${v.slice(0, 10)}T00:00:00.000Z`) : null);
const str = (v: any) => (v === undefined || v === null ? null : String(v));

/** Children first, so TRUNCATE order is irrelevant but the list doubles as "all tables". */
export const TABLES = [
  'audit_logs',
  'broadcast_notifications',
  'invoice_items',
  'invoices',
  'tiffin_records',
  'payments',
  'tiffin_requests',
  'menu_items',
  'menus',
  'combo_packages',
  'price_configs',
  'users',
];

export async function importAll(
  prisma: PrismaClient,
  d: Dump,
  opts: { wipe?: boolean; tz?: string; dryRun?: boolean } = {},
) {
  TZ = opts.tz || process.env.MIGRATION_TZ || 'Asia/Kolkata';
  const rows = (t: string) => d[t] ?? [];

  console.log(`Legacy timestamps are read as: ${TZ}`);
  for (const t of Object.keys(d)) console.log(`  source ${t}: ${d[t].length} rows`);
  if (opts.dryRun) {
    console.log('Dry run: nothing written.');
    return;
  }

  if (opts.wipe) {
    // children first (TABLES order); SQLite has no TRUNCATE
    for (const t of TABLES) await prisma.$executeRawUnsafe(`DELETE FROM "${t}"`);
    await prisma.$executeRawUnsafe('DELETE FROM sqlite_sequence');
    console.log('Existing data in the target database wiped.');
  } else {
    const existing = await prisma.user.count();
    if (existing > 0) {
      throw new Error(
        `Target already has ${existing} user(s). Import into an empty database (before running db:seed) or pass --wipe.`,
      );
    }
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.user.createMany({
        data: rows('users').map((r) => ({
          id: r.id,
          email: r.email,
          password: r.password,
          fullName: r.full_name,
          phone: str(r.phone),
          department: str(r.department),
          role: r.role,
          status: r.status,
          createdAt: ts(r.created_at)!,
          updatedAt: ts(r.updated_at) ?? ts(r.created_at)!,
        })),
      });

      await tx.priceConfig.createMany({
        data: rows('price_configs').map((r) => ({
          id: r.id,
          tiffinType: r.tiffin_type,
          price: r.price,
          effectiveFrom: day(r.effective_from)!,
          effectiveTo: day(r.effective_to),
          isActive: !!r.is_active,
          createdAt: ts(r.created_at)!,
          updatedAt: ts(r.updated_at) ?? ts(r.created_at)!,
        })),
      });

      const comboItems = new Map<number, string[]>();
      for (const ci of rows('combo_items')) {
        const list = comboItems.get(ci.combo_id) ?? [];
        list.push(ci.item_name);
        comboItems.set(ci.combo_id, list);
      }
      await tx.comboPackage.createMany({
        data: rows('combo_packages').map((r) => ({
          id: r.id,
          name: r.name,
          tiffinType: r.tiffin_type,
          price: r.price,
          description: str(r.description),
          includedItems: JSON.stringify(comboItems.get(r.id) ?? []),
          isActive: !!r.is_active,
          createdAt: ts(r.created_at)!,
          updatedAt: ts(r.updated_at) ?? ts(r.created_at)!,
        })),
      });

      await tx.menu.createMany({
        data: rows('menus').map((r) => ({
          id: r.id,
          serviceDate: day(r.service_date)!,
          title: r.title,
          description: str(r.description),
          isSpecial: !!r.is_special,
          createdAt: ts(r.created_at)!,
          updatedAt: ts(r.updated_at) ?? ts(r.created_at)!,
        })),
      });
      await tx.menuItem.createMany({
        data: rows('menu_items').map((r) => ({
          id: r.id,
          menuId: r.menu_id ?? null,
          name: r.name,
          category: r.category,
          description: str(r.description),
          isSpicy: !!r.is_spicy,
          isSweet: !!r.is_sweet,
          isAvailable: r.is_available === null || r.is_available === undefined ? true : !!r.is_available,
        })),
      });

      await tx.tiffinRequest.createMany({
        data: rows('tiffin_requests').map((r) => ({
          id: r.id,
          userId: r.user_id,
          serviceDate: day(r.service_date)!,
          tiffinType: r.tiffin_type,
          specialInstructions: str(r.special_instructions),
          status: r.status,
          reviewedBy: str(r.reviewed_by),
          rejectionReason: str(r.rejection_reason),
          reviewedAt: ts(r.reviewed_at),
          createdAt: ts(r.created_at)!,
          updatedAt: ts(r.updated_at) ?? ts(r.created_at)!,
        })),
      });

      await tx.payment.createMany({
        data: rows('payments').map((r) => ({
          id: r.id,
          paymentNumber: r.payment_number,
          userId: r.user_id,
          amount: r.amount,
          paymentMethod: r.payment_method,
          transactionRef: str(r.transaction_ref),
          paymentDate: day(r.payment_date),
          paymentApp: str(r.payment_app),
          notes: str(r.notes),
          rejectionReason: str(r.rejection_reason),
          status: r.status,
          verifiedBy: str(r.verified_by),
          verifiedAt: ts(r.verified_at),
          createdAt: ts(r.created_at)!,
          updatedAt: ts(r.updated_at) ?? ts(r.created_at)!,
        })),
      });

      await tx.tiffinRecord.createMany({
        data: rows('tiffin_records').map((r) => ({
          id: r.id,
          requestId: r.request_id,
          userId: r.user_id,
          serviceDate: day(r.service_date)!,
          tiffinType: r.tiffin_type,
          menuSnapshot: str(r.menu_snapshot),
          chargedAmount: r.charged_amount,
          status: r.status,
          paymentId: r.payment_id ?? null,
          createdAt: ts(r.created_at)!,
        })),
      });

      await tx.invoice.createMany({
        data: rows('invoices').map((r) => ({
          id: r.id,
          invoiceNumber: r.invoice_number,
          userId: r.user_id,
          paymentId: r.payment_id ?? null,
          billingStartDate: day(r.billing_start_date)!,
          billingEndDate: day(r.billing_end_date)!,
          totalAmount: r.total_amount,
          paymentAmount: r.payment_amount,
          paymentStatus: r.payment_status,
          notes: str(r.notes),
          generatedBy: str(r.generated_by),
          generatedAt: ts(r.generated_at)!,
        })),
      });
      await tx.invoiceItem.createMany({
        data: rows('invoice_items').map((r) => ({
          id: r.id,
          invoiceId: r.invoice_id,
          tiffinRecordId: r.tiffin_record_id,
          serviceDate: day(r.service_date)!,
          tiffinType: r.tiffin_type,
          menuSummary: str(r.menu_summary),
          chargedAmount: r.charged_amount,
        })),
      });

      await tx.auditLog.createMany({
        data: rows('audit_logs').map((r) => ({
          id: r.id,
          action: r.action,
          entityName: r.entity_name,
          entityId: str(r.entity_id),
          performedBy: r.performed_by,
          details: str(r.details),
          timestamp: ts(r.timestamp)!,
        })),
      });
      await tx.broadcastNotification.createMany({
        data: rows('broadcast_notifications').map((r) => ({
          id: r.id,
          title: r.title,
          message: r.message,
          targetAudience: r.target_audience,
          targetUserId: r.target_user_id ?? null,
          targetUserName: str(r.target_user_name),
          channels: str(r.channels),
          sentBy: str(r.sent_by),
          recipientsCount: r.recipients_count ?? 0,
          createdAt: ts(r.created_at)!,
        })),
      });
    },
    { timeout: 120000 },
  );

  // Explicit ids update SQLite's AUTOINCREMENT counter automatically, nothing to reset.
  console.log('Import complete.');
}
