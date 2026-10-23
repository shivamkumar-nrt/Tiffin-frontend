import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../db';
import { badRequest } from '../http';
import { auditDto, broadcastDto } from '../mappers';
import { broadcastHtml, sendEmail } from '../mail';
import { sendAutoWhatsAppMessage } from '../whatsapp';
import { broadcastSchema } from '../schemas';
import { logAction } from './audit';

export async function sendBroadcast(req: z.infer<typeof broadcastSchema>, adminEmail: string) {
  if (!req.title.trim()) throw badRequest('Notification title / subject is required');
  if (!req.message.trim()) throw badRequest('Notification message body is required');

  let targetAudience = req.targetAudience ? req.targetAudience.toUpperCase() : 'ALL';
  let recipients: Awaited<ReturnType<typeof prisma.user.findMany>> = [];
  let targetUserName: string | null = null;

  if (targetAudience === 'SINGLE' && req.targetUserId != null) {
    const target = await prisma.user.findUnique({ where: { id: req.targetUserId } });
    if (!target) throw badRequest(`Target customer not found with id: ${req.targetUserId}`);
    recipients = [target];
    targetUserName = target.fullName;
  } else if (targetAudience === 'WITH_DUES') {
    recipients = await prisma.user.findMany({
      where: { status: 'ACTIVE', role: 'ROLE_EMPLOYEE', records: { some: { status: 'UNPAID' } } },
      orderBy: { id: 'asc' },
    });
  } else {
    recipients = await prisma.user.findMany({
      where: { status: 'ACTIVE', role: 'ROLE_EMPLOYEE' },
      orderBy: { id: 'asc' },
    });
    targetAudience = 'ALL';
  }

  const channels: string[] = [];
  if (req.sendEmail) channels.push('EMAIL');
  if (req.sendWhatsApp) channels.push('WHATSAPP');
  if (req.sendPush) channels.push('PUSH');
  const channelsStr = channels.join(',');

  if (req.sendEmail) {
    await Promise.allSettled(
      recipients
        .filter((r) => r.email && r.email.trim())
        .map((r) => sendEmail(r.email, req.title, broadcastHtml(req.title, req.message, r))),
    );
  }

  const whatsAppLinks: Array<Record<string, string>> = [];
  if (req.sendWhatsApp) {
    const jobs: Promise<void>[] = [];
    for (const r of recipients) {
      if (!r.phone || !r.phone.trim()) continue;
      let phone = r.phone.replace(/[\s\-+()]/g, '');
      if (phone.length === 10) phone = '91' + phone;
      const text =
        `Namaste ${r.fullName} ji 🙏\n\n` +
        `📢 *${req.title}*\n` +
        `-----------------------------------------\n` +
        `${req.message}\n\n` +
        `🍱 _Tiffin Service Management System_`;
      jobs.push(sendAutoWhatsAppMessage(phone, text));
      whatsAppLinks.push({
        userId: String(r.id),
        customerName: r.fullName,
        phone: r.phone,
        whatsappLink: `https://wa.me/${phone}?text=${encodeURIComponent(text)}`,
      });
    }
    await Promise.allSettled(jobs);
  }

  const saved = await prisma.broadcastNotification.create({
    data: {
      title: req.title.slice(0, 200),
      message: req.message.slice(0, 2000),
      targetAudience,
      targetUserId: targetAudience === 'SINGLE' ? req.targetUserId ?? null : null,
      targetUserName,
      channels: channelsStr,
      sentBy: adminEmail,
      recipientsCount: recipients.length,
    },
  });
  await logAction(
    'BROADCAST_NOTIFICATION',
    'Notification',
    saved.id,
    adminEmail,
    `Broadcasted '${saved.title}' to ${saved.recipientsCount} customers via [${channelsStr}]`,
  );
  return broadcastDto(saved, whatsAppLinks);
}

export async function getBroadcastHistory() {
  const rows = await prisma.broadcastNotification.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 20 });
  return rows.map((r) => broadcastDto(r));
}

export async function getMyNotifications(userEmail: string) {
  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) return [];
  if (user.role === 'ROLE_ADMIN') return getBroadcastHistory();

  const hasDues = (await prisma.tiffinRecord.count({ where: { userId: user.id, status: 'UNPAID' } })) > 0;
  const or: Prisma.BroadcastNotificationWhereInput[] = [{ targetAudience: 'ALL' }, { targetUserId: user.id }];
  if (hasDues) or.push({ targetAudience: 'WITH_DUES' });
  const rows = await prisma.broadcastNotification.findMany({
    where: { OR: or },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  });
  return rows.map((r) => broadcastDto(r));
}

// ---------------------------------------------------------------- audit logs

export async function getRecentLogs() {
  const rows = await prisma.auditLog.findMany({ orderBy: [{ timestamp: 'desc' }, { id: 'desc' }], take: 50 });
  return rows.map(auditDto);
}

export async function getLogs(paging: { page: number; size: number; skip: number; take: number }) {
  const [rows, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: [{ timestamp: 'desc' }, { id: 'desc' }],
      skip: paging.skip,
      take: paging.take,
    }),
    prisma.auditLog.count(),
  ]);
  return { rows: rows.map(auditDto), total };
}
