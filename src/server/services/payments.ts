import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { PaymentStatus } from '../enums';
import { z } from 'zod';
import { prisma } from '../db';
import { ApiError, AuthUser, badRequest, notFound, pageOf } from '../http';
import { paymentDto } from '../mappers';
import { dec, num } from '../serialize';
import { daysInMonth, nowParts, parseDate, today } from '../time';
import { createPaymentSchema, submitPaymentSchema } from '../schemas';
import { sendNewPaymentAlertToAdmin, sendPaymentApprovalEmail, sendPaymentReminderEmail } from '../mail';
import { logAction } from './audit';

type Tx = Prisma.TransactionClient;
type Paging = { page: number; size: number; skip: number; take: number };

const withRels = { user: true, invoice: true } as const;

function stamp(prefix: string) {
  const { year, month, day } = nowParts();
  const d = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
  return `${prefix}-${d}-${randomUUID().substring(0, 6).toUpperCase()}`;
}
export const newInvoiceNumber = () => stamp('INV');
const newPaymentNumber = () => stamp('PAY');

function clip(s: string | null | undefined, max: number) {
  return s == null ? null : s.slice(0, max);
}

/** Marks all of the user's UNPAID records as paid by this payment and creates the invoice. */
async function settleRecordsAndCreateInvoice(tx: Tx, payment: { id: number; userId: number; amount: Prisma.Decimal; paymentNumber: string }, actor: string, userEmail: string) {
  const unpaid = await tx.tiffinRecord.findMany({
    where: { userId: payment.userId, status: 'UNPAID' },
    orderBy: [{ serviceDate: 'asc' }, { id: 'asc' }],
  });
  if (unpaid.length > 0) {
    await tx.tiffinRecord.updateMany({
      where: { id: { in: unpaid.map((r) => r.id) } },
      data: { status: 'BILLED_PAID', paymentId: payment.id },
    });
  }
  const total = unpaid.reduce((acc, r) => acc.add(r.chargedAmount), new Prisma.Decimal(0));
  const startDate = unpaid.length ? unpaid[0].serviceDate : today();
  const endDate = unpaid.length ? unpaid[unpaid.length - 1].serviceDate : today();

  const invoice = await tx.invoice.create({
    data: {
      invoiceNumber: newInvoiceNumber(),
      userId: payment.userId,
      paymentId: payment.id,
      billingStartDate: startDate,
      billingEndDate: endDate,
      totalAmount: total.gt(0) ? total : payment.amount,
      paymentAmount: payment.amount,
      paymentStatus: 'SUCCESS',
      notes: `Settlement for payment #${payment.paymentNumber}`,
      generatedBy: clip(actor, 100),
      items: {
        create: unpaid.map((r) => ({
          tiffinRecordId: r.id,
          serviceDate: r.serviceDate,
          tiffinType: r.tiffinType,
          menuSummary: clip(r.menuSnapshot, 500),
          chargedAmount: r.chargedAmount,
        })),
      },
    },
  });
  await logAction(
    'GENERATE_INVOICE',
    'Invoice',
    invoice.id,
    actor,
    `Generated invoice ${invoice.invoiceNumber} with ${unpaid.length} line items for ${userEmail}`,
    tx,
  );
}

export async function recordPayment(dto: z.infer<typeof createPaymentSchema>, creatorEmail: string) {
  const user = await prisma.user.findUnique({ where: { id: dto.userId } });
  if (!user) throw notFound(`User not found with id: ${dto.userId}`);

  const success = dto.markAsSuccess;
  const saved = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        paymentNumber: newPaymentNumber(),
        userId: user.id,
        amount: dec(dto.amount),
        paymentMethod: dto.paymentMethod,
        paymentApp: clip(dto.paymentApp, 100),
        paymentDate: dto.paymentDate ? parseDate(dto.paymentDate) : today(),
        transactionRef: clip(dto.transactionRef, 100),
        notes: clip(dto.notes, 500),
        status: success ? 'SUCCESS' : 'PENDING_VERIFICATION',
        verifiedBy: success ? creatorEmail : null,
        verifiedAt: success ? new Date() : null,
      },
    });
    if (success) await settleRecordsAndCreateInvoice(tx, payment, creatorEmail, user.email);
    await logAction(
      'RECORD_PAYMENT',
      'Payment',
      payment.id,
      creatorEmail,
      `Recorded payment of Rs. ${payment.amount.toFixed(2)} for ${user.email} (${payment.status})`,
      tx,
    );
    return tx.payment.findUniqueOrThrow({ where: { id: payment.id }, include: withRels });
  });
  return paymentDto(saved);
}

export async function submitCustomerPayment(dto: z.infer<typeof submitPaymentSchema>, userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) throw notFound(`User not found with email: ${userEmail}`);

  const payment = await prisma.payment.create({
    data: {
      paymentNumber: newPaymentNumber(),
      userId: user.id,
      amount: dec(dto.amount),
      paymentMethod: dto.paymentMethod,
      paymentApp: clip(dto.paymentApp, 100),
      paymentDate: dto.paymentDate ? parseDate(dto.paymentDate) : today(),
      transactionRef: clip(dto.transactionRef, 100),
      notes: clip(dto.notes, 500),
      status: 'PENDING_VERIFICATION',
    },
    include: withRels,
  });
  await logAction(
    'SUBMIT_PAYMENT',
    'Payment',
    payment.id,
    userEmail,
    `Customer submitted settlement payment of Rs. ${payment.amount.toFixed(2)} (UTR: ${payment.transactionRef}, App: ${payment.paymentApp})`,
  );
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ROLE_ADMIN' } });
    await Promise.allSettled(admins.map((a) => sendNewPaymentAlertToAdmin(a.email, user, payment)));
  } catch {
    /* notification failures never block the payment */
  }
  return paymentDto(payment);
}

export async function markPaymentSuccess(paymentId: number, adminEmail: string) {
  const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!existing) throw notFound(`Payment not found with id: ${paymentId}`);
  if (existing.status === 'SUCCESS') throw badRequest('Payment is already verified and marked as SUCCESS');

  const saved = await prisma.$transaction(async (tx) => {
    // Guard against double-verification racing each other (would settle twice).
    const claimed = await tx.payment.updateMany({
      where: { id: paymentId, status: { not: 'SUCCESS' } },
      data: { status: 'SUCCESS', rejectionReason: null, verifiedBy: adminEmail, verifiedAt: new Date() },
    });
    if (claimed.count === 0) throw badRequest('Payment is already verified and marked as SUCCESS');
    const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { user: true } });
    await settleRecordsAndCreateInvoice(tx, payment, adminEmail, payment.user.email);
    await logAction(
      'VERIFY_PAYMENT',
      'Payment',
      paymentId,
      adminEmail,
      `Verified and approved payment ${payment.paymentNumber} of Rs. ${payment.amount.toFixed(2)}`,
      tx,
    );
    return tx.payment.findUniqueOrThrow({ where: { id: paymentId }, include: withRels });
  });
  await sendPaymentApprovalEmail(saved.user, saved);
  return paymentDto(saved);
}

export async function rejectPayment(paymentId: number, reason: string, adminEmail: string) {
  const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!existing) throw notFound(`Payment not found with id: ${paymentId}`);
  if (existing.status === 'SUCCESS') throw badRequest('Cannot reject an already verified and settled payment');

  const claimed = await prisma.payment.updateMany({
    where: { id: paymentId, status: { not: 'SUCCESS' } },
    data: { status: 'FAILED', rejectionReason: clip(reason, 500), verifiedBy: adminEmail, verifiedAt: new Date() },
  });
  if (claimed.count === 0) throw badRequest('Cannot reject an already verified and settled payment');
  const saved = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: withRels });
  await logAction('REJECT_PAYMENT', 'Payment', paymentId, adminEmail, `Rejected payment ${saved.paymentNumber}. Reason: ${reason}`);
  return paymentDto(saved);
}

export function getReminderStatus() {
  const { year, month, day } = nowParts();
  const lastDay = daysInMonth(year, month);
  const active = day >= 25 && day <= lastDay;
  return {
    active,
    dayOfMonth: day,
    lastDayOfMonth: lastDay,
    daysLeftInMonth: Math.max(0, lastDay - day),
    message: active
      ? 'Monthly payment settlement reminder window is active (25th to month-end). Please settle all pending dues.'
      : 'Payment settlement reminder window will activate from 25th of the month.',
  };
}

export async function sendBulkPaymentReminders(triggerSource: string) {
  const grouped = await prisma.tiffinRecord.groupBy({
    by: ['userId'],
    where: { status: 'UNPAID' },
    _sum: { chargedAmount: true },
  });
  const users = await prisma.user.findMany({ where: { id: { in: grouped.map((g) => g.userId) } } });
  const byId = new Map(users.map((u) => [u.id, u]));
  const totalDue = grouped.reduce((acc, g) => acc + num(g._sum.chargedAmount), 0);

  await Promise.allSettled(
    grouped.map((g) => {
      const u = byId.get(g.userId);
      return u ? sendPaymentReminderEmail(u, num(g._sum.chargedAmount)) : Promise.resolve();
    }),
  );

  await logAction(
    'BULK_PAYMENT_REMINDER',
    'System',
    'REMINDERS',
    triggerSource,
    `Sent payment reminders to ${grouped.length} customers with total pending dues of Rs. ${totalDue.toFixed(2)}`,
  );
  return {
    success: true,
    customersReminded: grouped.length,
    totalPendingDue: totalDue,
    triggeredBy: triggerSource,
    timestamp: new Date().toISOString(),
    message: `Payment reminders dispatched successfully to ${grouped.length} customers.`,
  };
}

export async function searchPayments(
  filters: { userId?: number; status?: PaymentStatus },
  paging: Paging,
) {
  const where: Prisma.PaymentWhereInput = {
    ...(filters.userId != null && { userId: filters.userId }),
    ...(filters.status && { status: filters.status }),
  };
  const [rows, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: withRels,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: paging.skip,
      take: paging.take,
    }),
    prisma.payment.count({ where }),
  ]);
  return pageOf(rows.map(paymentDto), total, paging.page, paging.size);
}

export async function getMyPayments(userId: number) {
  const rows = await prisma.payment.findMany({
    where: { userId },
    include: withRels,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  return rows.map(paymentDto);
}

export async function getPaymentById(id: number, caller: AuthUser) {
  const p = await prisma.payment.findUnique({ where: { id }, include: withRels });
  if (!p) throw notFound(`Payment not found with id: ${id}`);
  if (caller.role !== 'ROLE_ADMIN' && p.userId !== caller.id) {
    throw new ApiError(403, 'Access denied: You do not have permission to perform this action.');
  }
  return paymentDto(p);
}
