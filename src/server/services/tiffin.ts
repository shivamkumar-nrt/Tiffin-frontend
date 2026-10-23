import { Prisma, RecordStatus, RequestStatus } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { ApiError, AuthUser, badRequest, notFound, pageOf } from '../http';
import { recordDto, requestDto } from '../mappers';
import { dec } from '../serialize';
import { fmtDate, parseDate } from '../time';
import {
  createRequestSchema,
  manualRecordSchema,
  updateRecordSchema,
  updateRequestSchema,
} from '../schemas';
import { sendNewRequestAlertToAdmin, sendRequestStatusEmail } from '../mail';
import { logAction } from './audit';
import { getMenuByDate, getPriceForTypeAndDate } from './catalog';

type Paging = { page: number; size: number; skip: number; take: number };

// ---------------------------------------------------------------- requests

export async function createRequest(dto: z.infer<typeof createRequestSchema>, caller: AuthUser) {
  if (dto.userId != null && dto.userId !== caller.id && caller.role !== 'ROLE_ADMIN') {
    throw new ApiError(403, 'Access denied: You do not have permission to perform this action.');
  }
  const user =
    dto.userId != null
      ? await prisma.user.findUnique({ where: { id: dto.userId } })
      : await prisma.user.findUnique({ where: { email: caller.email } });
  if (!user) {
    throw notFound(dto.userId != null ? `User not found with id: ${dto.userId}` : `User not found with email: ${caller.email}`);
  }
  if (user.status !== 'ACTIVE') throw badRequest('User account is inactive. Cannot submit tiffin requests.');

  const serviceDate = parseDate(dto.serviceDate);
  const existing = await prisma.tiffinRequest.findFirst({
    where: { userId: user.id, serviceDate, status: { notIn: ['REJECTED', 'CANCELLED'] } },
  });
  if (existing) {
    throw badRequest(`You already have an active request for ${dto.serviceDate} (Status: ${existing.status})`);
  }

  let specialInstructions = dto.specialInstructions ?? null;
  if (dto.comboName) {
    specialInstructions = specialInstructions
      ? `[${dto.comboName}] ${specialInstructions}`
      : `[${dto.comboName}]`;
  }
  if (specialInstructions && specialInstructions.length > 500) specialInstructions = specialInstructions.slice(0, 500);

  const saved = await prisma.tiffinRequest.create({
    data: {
      userId: user.id,
      serviceDate,
      tiffinType: dto.tiffinType,
      specialInstructions,
      status: 'PENDING',
    },
    include: { user: true },
  });
  await logAction(
    'CREATE_TIFFIN_REQUEST',
    'TiffinRequest',
    saved.id,
    caller.email,
    `Requested ${saved.tiffinType} for ${dto.serviceDate}`,
  );
  try {
    const admins = await prisma.user.findMany({ where: { role: 'ROLE_ADMIN' } });
    await Promise.allSettled(admins.map((a) => sendNewRequestAlertToAdmin(a.email, user, saved)));
  } catch {
    /* notification failures never block the request */
  }
  return requestDto(saved);
}

export async function approveRequest(requestId: number, adminEmail: string) {
  const request = await prisma.tiffinRequest.findUnique({ where: { id: requestId } });
  if (!request) throw notFound(`Request not found with id: ${requestId}`);
  if (request.status !== 'PENDING') throw badRequest(`Cannot approve request with current status: ${request.status}`);

  // Work out snapshot + frozen price (combo wins, then daily menu, then price list).
  let chargedAmount: Prisma.Decimal | null = null;
  let menuSnapshot: string | null = null;

  const instr = request.specialInstructions;
  if (instr && instr.startsWith('[')) {
    const closing = instr.indexOf(']');
    if (closing > 1) {
      const comboName = instr.substring(1, closing);
      const combo = await prisma.comboPackage.findFirst({
        where: { name: { equals: comboName, mode: 'insensitive' } },
        orderBy: { id: 'asc' },
      });
      if (combo) {
        chargedAmount = combo.price;
        menuSnapshot =
          combo.includedItems.length > 0
            ? `${combo.name} (${combo.includedItems.join(', ')})`
            : `${combo.name} - ${combo.description ?? 'Standard Thali'}`;
      }
    }
  }
  if (menuSnapshot == null) {
    const menu = await getMenuByDate(request.serviceDate);
    if (menu && menu.items.length > 0) {
      menuSnapshot = `${menu.title}: ${menu.items.map((i) => i.name).join(', ')}`;
    } else {
      menuSnapshot = `${request.tiffinType === 'FULL' ? 'Full Thali' : 'Half Thali'} Meal (Dal, Sabzi, Roti, Rice, Salad)`;
    }
  }
  if (chargedAmount == null) {
    chargedAmount = await getPriceForTypeAndDate(request.tiffinType, request.serviceDate);
  }
  const snapshot = menuSnapshot.length > 1000 ? menuSnapshot.slice(0, 1000) : menuSnapshot;

  const saved = await prisma.$transaction(async (tx) => {
    // Conditional update so two concurrent approvals can't both create a record.
    const claimed = await tx.tiffinRequest.updateMany({
      where: { id: requestId, status: 'PENDING' },
      data: { status: 'APPROVED', reviewedBy: adminEmail, reviewedAt: new Date() },
    });
    if (claimed.count === 0) throw badRequest('Cannot approve request: it is no longer pending');
    await tx.tiffinRecord.create({
      data: {
        requestId,
        userId: request.userId,
        serviceDate: request.serviceDate,
        tiffinType: request.tiffinType,
        menuSnapshot: snapshot,
        chargedAmount,
        status: 'UNPAID',
      },
    });
    return tx.tiffinRequest.findUniqueOrThrow({ where: { id: requestId }, include: { user: true } });
  });

  await logAction(
    'APPROVE_TIFFIN_REQUEST',
    'TiffinRequest',
    requestId,
    adminEmail,
    `Approved request for ${saved.user.email} on ${fmtDate(saved.serviceDate)} with charged amount Rs. ${chargedAmount.toFixed(2)}`,
  );
  await sendRequestStatusEmail(saved.user, saved);
  return requestDto(saved);
}

export async function rejectRequest(requestId: number, reason: string | null, adminEmail: string) {
  const request = await prisma.tiffinRequest.findUnique({ where: { id: requestId } });
  if (!request) throw notFound(`Request not found with id: ${requestId}`);
  if (request.status !== 'PENDING') throw badRequest(`Cannot reject request with current status: ${request.status}`);

  const rejectionReason = (reason ?? 'Rejected by admin').slice(0, 500);
  const claimed = await prisma.tiffinRequest.updateMany({
    where: { id: requestId, status: 'PENDING' },
    data: { status: 'REJECTED', reviewedBy: adminEmail, rejectionReason, reviewedAt: new Date() },
  });
  if (claimed.count === 0) throw badRequest('Cannot reject request: it is no longer pending');
  const saved = await prisma.tiffinRequest.findUniqueOrThrow({ where: { id: requestId }, include: { user: true } });

  await logAction(
    'REJECT_TIFFIN_REQUEST',
    'TiffinRequest',
    requestId,
    adminEmail,
    `Rejected request for ${saved.user.email} on ${fmtDate(saved.serviceDate)}. Reason: ${rejectionReason}`,
  );
  await sendRequestStatusEmail(saved.user, saved);
  return requestDto(saved);
}

export async function cancelRequest(requestId: number, userEmail: string) {
  const request = await prisma.tiffinRequest.findUnique({ where: { id: requestId }, include: { user: true } });
  if (!request) throw notFound(`Request not found with id: ${requestId}`);
  if (request.status !== 'PENDING') {
    throw badRequest(`Only pending requests can be cancelled. Current status: ${request.status}`);
  }
  if (request.user.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw badRequest('You do not have permission to cancel this request');
  }
  const claimed = await prisma.tiffinRequest.updateMany({
    where: { id: requestId, status: 'PENDING' },
    data: { status: 'CANCELLED' },
  });
  if (claimed.count === 0) throw badRequest('Only pending requests can be cancelled.');
  const saved = await prisma.tiffinRequest.findUniqueOrThrow({ where: { id: requestId }, include: { user: true } });
  await logAction('CANCEL_TIFFIN_REQUEST', 'TiffinRequest', requestId, userEmail, `Cancelled tiffin request for ${fmtDate(saved.serviceDate)}`);
  return requestDto(saved);
}

export async function getRequests(
  filters: { userId?: number; status?: RequestStatus; startDate?: Date; endDate?: Date },
  paging: Paging,
) {
  const where: Prisma.TiffinRequestWhereInput = {
    ...(filters.userId != null && { userId: filters.userId }),
    ...(filters.status && { status: filters.status }),
    ...((filters.startDate || filters.endDate) && {
      serviceDate: {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      },
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.tiffinRequest.findMany({
      where,
      include: { user: true },
      orderBy: [{ serviceDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      skip: paging.skip,
      take: paging.take,
    }),
    prisma.tiffinRequest.count({ where }),
  ]);
  return pageOf(rows.map(requestDto), total, paging.page, paging.size);
}

export async function getMyRequests(userId: number) {
  const rows = await prisma.tiffinRequest.findMany({
    where: { userId },
    include: { user: true },
    orderBy: [{ serviceDate: 'desc' }, { id: 'desc' }],
  });
  return rows.map(requestDto);
}

export async function getRequestById(id: number, caller: AuthUser) {
  const r = await prisma.tiffinRequest.findUnique({ where: { id }, include: { user: true } });
  if (!r) throw notFound(`Request not found with id: ${id}`);
  if (caller.role !== 'ROLE_ADMIN' && r.userId !== caller.id) {
    throw new ApiError(403, 'Access denied: You do not have permission to perform this action.');
  }
  return requestDto(r);
}

export async function updateRequest(id: number, dto: z.infer<typeof updateRequestSchema>, adminEmail: string) {
  const existing = await prisma.tiffinRequest.findUnique({ where: { id } });
  if (!existing) throw notFound('Request not found');
  const saved = await prisma.tiffinRequest.update({
    where: { id },
    data: {
      ...(dto.serviceDate && { serviceDate: parseDate(dto.serviceDate) }),
      ...(dto.tiffinType && { tiffinType: dto.tiffinType }),
      ...(dto.specialInstructions != null && { specialInstructions: dto.specialInstructions.slice(0, 500) }),
      ...(dto.status && { status: dto.status }),
    },
    include: { user: true },
  });
  await logAction('UPDATE_TIFFIN_REQUEST', 'TiffinRequest', id, adminEmail, 'Admin manually updated tiffin request details.');
  return requestDto(saved);
}

// ---------------------------------------------------------------- records

export async function searchRecords(
  filters: { userId?: number; status?: RecordStatus; startDate?: Date; endDate?: Date },
  paging: Paging,
) {
  const where: Prisma.TiffinRecordWhereInput = {
    ...(filters.userId != null && { userId: filters.userId }),
    ...(filters.status && { status: filters.status }),
    ...((filters.startDate || filters.endDate) && {
      serviceDate: {
        ...(filters.startDate && { gte: filters.startDate }),
        ...(filters.endDate && { lte: filters.endDate }),
      },
    }),
  };
  const [rows, total] = await Promise.all([
    prisma.tiffinRecord.findMany({
      where,
      include: { user: true },
      orderBy: [{ serviceDate: 'desc' }, { id: 'desc' }],
      skip: paging.skip,
      take: paging.take,
    }),
    prisma.tiffinRecord.count({ where }),
  ]);
  return pageOf(rows.map(recordDto), total, paging.page, paging.size);
}

export async function getMyRecords(userId: number, order: 'asc' | 'desc' = 'asc') {
  const rows = await prisma.tiffinRecord.findMany({
    where: { userId },
    include: { user: true },
    orderBy: [{ serviceDate: order }, { id: order }],
  });
  return rows.map(recordDto);
}

export async function getRecordsByDate(date: Date) {
  const rows = await prisma.tiffinRecord.findMany({
    where: { serviceDate: date },
    include: { user: true },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  return rows.map(recordDto);
}

export async function getUnpaidRecordsForUser(userId: number) {
  const rows = await prisma.tiffinRecord.findMany({
    where: { userId, status: 'UNPAID' },
    include: { user: true },
    orderBy: [{ serviceDate: 'asc' }, { id: 'asc' }],
  });
  return rows.map(recordDto);
}

export async function addManualRecord(dto: z.infer<typeof manualRecordSchema>, adminEmail: string) {
  const user = await prisma.user.findUnique({ where: { id: dto.userId } });
  if (!user) throw notFound('User not found');
  const serviceDate = parseDate(dto.serviceDate);
  const snapshot = (dto.menuSnapshot ?? 'Manual Entry').slice(0, 1000);

  const record = await prisma.$transaction(async (tx) => {
    const synthetic = await tx.tiffinRequest.create({
      data: {
        userId: user.id,
        serviceDate,
        tiffinType: dto.tiffinType,
        status: 'APPROVED',
        specialInstructions: 'Manual entry by Admin',
        reviewedBy: adminEmail,
        reviewedAt: new Date(),
      },
    });
    return tx.tiffinRecord.create({
      data: {
        requestId: synthetic.id,
        userId: user.id,
        serviceDate,
        tiffinType: dto.tiffinType,
        chargedAmount: dec(dto.amount),
        menuSnapshot: snapshot,
        status: 'UNPAID',
      },
      include: { user: true },
    });
  });
  await logAction(
    'ADD_MANUAL_RECORD',
    'TiffinRecord',
    record.id,
    adminEmail,
    `Manually added tiffin record for user ${user.email} on ${dto.serviceDate}`,
  );
  return recordDto(record);
}

export async function updateRecord(id: number, dto: z.infer<typeof updateRecordSchema>, adminEmail: string) {
  const existing = await prisma.tiffinRecord.findUnique({ where: { id } });
  if (!existing) throw notFound('Record not found');
  const record = await prisma.tiffinRecord.update({
    where: { id },
    data: {
      ...(dto.serviceDate && { serviceDate: parseDate(dto.serviceDate) }),
      ...(dto.tiffinType && { tiffinType: dto.tiffinType }),
      ...(dto.amount != null && { chargedAmount: dec(dto.amount) }),
      ...(dto.menuSnapshot != null && { menuSnapshot: dto.menuSnapshot.slice(0, 1000) }),
      ...(dto.status && { status: dto.status }),
    },
    include: { user: true },
  });
  await logAction('UPDATE_TIFFIN_RECORD', 'TiffinRecord', id, adminEmail, 'Admin updated tiffin record');
  return recordDto(record);
}
