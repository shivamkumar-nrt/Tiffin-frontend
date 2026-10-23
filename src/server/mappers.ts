import { Prisma } from '@prisma/client';
import type {
  AuditLog,
  BroadcastNotification,
  ComboPackage,
  Invoice,
  InvoiceItem,
  Menu,
  MenuItem,
  Payment,
  PriceConfig,
  TiffinRecord,
  TiffinRequest,
  User,
} from '@prisma/client';
import { fmtDate, fmtDateTime } from './time';
import { num, numOrNull } from './serialize';

export const userDto = (u: User, balance: number) => ({
  id: u.id,
  email: u.email,
  fullName: u.fullName,
  phone: u.phone,
  department: u.department,
  role: u.role,
  status: u.status,
  outstandingBalance: balance,
  createdAt: fmtDateTime(u.createdAt),
});

export const priceDto = (p: {
  id?: number;
  tiffinType: string;
  price: Prisma.Decimal | number;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
  isActive: boolean;
}) => ({
  id: p.id ?? null,
  tiffinType: p.tiffinType,
  price: num(p.price),
  effectiveFrom: fmtDate(p.effectiveFrom),
  effectiveTo: fmtDate(p.effectiveTo),
  active: p.isActive,
});

export const menuItemDto = (i: MenuItem) => ({
  id: i.id,
  name: i.name,
  category: i.category,
  description: i.description,
  spicy: i.isSpicy,
  sweet: i.isSweet,
});

export const menuDto = (m: Menu & { items: MenuItem[] }) => ({
  id: m.id,
  serviceDate: fmtDate(m.serviceDate),
  title: m.title,
  description: m.description,
  special: m.isSpecial,
  items: [...m.items].sort((a, b) => a.id - b.id).map(menuItemDto),
});

/** SQLite has no array type: combo items are stored as a JSON string. */
export function parseItems(raw: string | null | undefined): string[] {
  try {
    const v = JSON.parse(raw || '[]');
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export const comboDto = (c: ComboPackage) => ({
  id: c.id,
  name: c.name,
  tiffinType: c.tiffinType,
  price: num(c.price),
  description: c.description,
  includedItems: parseItems(c.includedItems),
  active: c.isActive,
  createdAt: fmtDateTime(c.createdAt),
});

/** The combo name is stored as a "[Name] ..." prefix of specialInstructions. */
export function comboNameFrom(instructions: string | null | undefined): string | null {
  if (instructions && instructions.startsWith('[')) {
    const closing = instructions.indexOf(']');
    if (closing > 1) return instructions.substring(1, closing);
  }
  return null;
}

export const requestDto = (r: TiffinRequest & { user: User }) => ({
  id: r.id,
  userId: r.user.id,
  userName: r.user.fullName,
  userEmail: r.user.email,
  userDepartment: r.user.department,
  serviceDate: fmtDate(r.serviceDate),
  tiffinType: r.tiffinType,
  comboId: null,
  comboName: comboNameFrom(r.specialInstructions),
  specialInstructions: r.specialInstructions,
  status: r.status,
  reviewedBy: r.reviewedBy,
  rejectionReason: r.rejectionReason,
  reviewedAt: fmtDateTime(r.reviewedAt),
  createdAt: fmtDateTime(r.createdAt),
});

export const recordDto = (r: TiffinRecord & { user: User }) => ({
  id: r.id,
  requestId: r.requestId,
  userId: r.user.id,
  userName: r.user.fullName,
  userEmail: r.user.email,
  serviceDate: fmtDate(r.serviceDate),
  tiffinType: r.tiffinType,
  menuSnapshot: r.menuSnapshot,
  chargedAmount: num(r.chargedAmount),
  status: r.status,
  paymentId: r.paymentId,
  createdAt: fmtDateTime(r.createdAt),
});

export const paymentDto = (p: Payment & { user: User; invoice?: Invoice | null }) => ({
  id: p.id,
  paymentNumber: p.paymentNumber,
  userId: p.user.id,
  userName: p.user.fullName,
  userEmail: p.user.email,
  amount: num(p.amount),
  paymentMethod: p.paymentMethod,
  paymentApp: p.paymentApp,
  paymentDate: fmtDate(p.paymentDate),
  transactionRef: p.transactionRef,
  notes: p.notes,
  rejectionReason: p.rejectionReason,
  status: p.status,
  verifiedBy: p.verifiedBy,
  verifiedAt: fmtDateTime(p.verifiedAt),
  createdAt: fmtDateTime(p.createdAt),
  invoiceId: p.invoice?.id ?? null,
  invoiceNumber: p.invoice?.invoiceNumber ?? null,
});

export const invoiceItemDto = (i: InvoiceItem) => ({
  id: i.id,
  tiffinRecordId: i.tiffinRecordId,
  serviceDate: fmtDate(i.serviceDate),
  tiffinType: i.tiffinType,
  menuSummary: i.menuSummary,
  chargedAmount: num(i.chargedAmount),
});

export type InvoiceFull = Invoice & { user: User; payment: Payment | null; items: InvoiceItem[] };

export const invoiceDto = (inv: InvoiceFull) => ({
  id: inv.id,
  invoiceNumber: inv.invoiceNumber,
  userId: inv.user.id,
  userName: inv.user.fullName,
  userEmail: inv.user.email,
  userPhone: inv.user.phone,
  userDepartment: inv.user.department,
  paymentId: inv.payment?.id ?? null,
  paymentNumber: inv.payment?.paymentNumber ?? null,
  billingStartDate: fmtDate(inv.billingStartDate),
  billingEndDate: fmtDate(inv.billingEndDate),
  totalAmount: num(inv.totalAmount),
  paymentAmount: num(inv.paymentAmount),
  paymentStatus: inv.paymentStatus,
  notes: inv.notes,
  generatedBy: inv.generatedBy,
  generatedAt: fmtDateTime(inv.generatedAt),
  items: [...inv.items].sort((a, b) => a.id - b.id).map(invoiceItemDto),
});

export const auditDto = (l: AuditLog) => ({
  id: l.id,
  action: l.action,
  entityName: l.entityName,
  entityId: l.entityId,
  performedBy: l.performedBy,
  details: l.details,
  timestamp: fmtDateTime(l.timestamp),
});

export const broadcastDto = (n: BroadcastNotification, whatsAppLinks?: Array<Record<string, string>>) => ({
  id: n.id,
  title: n.title,
  message: n.message,
  targetAudience: n.targetAudience,
  targetUserId: n.targetUserId,
  targetUserName: n.targetUserName,
  channels: n.channels,
  sentBy: n.sentBy,
  recipientsCount: n.recipientsCount,
  createdAt: fmtDateTime(n.createdAt),
  whatsAppLinks: whatsAppLinks ?? null,
});

export { numOrNull };
