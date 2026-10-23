import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { badRequest } from '../http';
import { num } from '../serialize';
import { fmtDate, fmtLong } from '../time';
import { balancesFor } from './balance';

export type ExportFormat = 'csv' | 'pdf';
export const MY_TYPES = ['records', 'requests', 'payments', 'invoices'] as const;
export const ADMIN_TYPES = ['records', 'requests', 'payments', 'invoices', 'users'] as const;
export type MyType = (typeof MY_TYPES)[number];
export type AdminType = (typeof ADMIN_TYPES)[number];

interface Col {
  label: string;
  /** relative width */
  w: number;
  align?: 'left' | 'right';
}

interface Table {
  title: string;
  subtitle: string;
  cols: Col[];
  rows: string[][];
  summary: Array<[string, string]>;
  landscape: boolean;
  filename: string;
}

export interface Range {
  startDate?: Date;
  endDate?: Date;
}

const TZ = process.env.APP_TIMEZONE || 'Asia/Kolkata';
const money = (n: unknown) => num(n as never).toFixed(2);
const dt = (d: Date | null | undefined) =>
  d
    ? new Intl.DateTimeFormat('en-CA', {
        timeZone: TZ,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
        .format(d)
        .replace(',', '')
    : '';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
const stamp = () => new Date().toISOString().slice(0, 10);

function rangeText(r: Range) {
  if (!r.startDate && !r.endDate) return 'All dates';
  return `${r.startDate ? fmtDate(r.startDate) : 'start'} to ${r.endDate ? fmtDate(r.endDate) : 'today'}`;
}

function dateWhere(r: Range, field: string): Record<string, unknown> {
  if (!r.startDate && !r.endDate) return {};
  return { [field]: { ...(r.startDate && { gte: r.startDate }), ...(r.endDate && { lte: r.endDate }) } };
}

// ------------------------------------------------------------------ builders

interface Scope {
  /** null = all users (admin export) */
  userId: number | null;
  label: string;
}

export async function buildTable(
  type: MyType | AdminType,
  scope: Scope,
  range: Range,
  extra: { status?: string } = {},
): Promise<Table> {
  const all = scope.userId === null;
  const who = all ? 'All customers' : scope.label;
  const sub = `${who}  |  ${rangeText(range)}  |  Generated ${dt(new Date())}`;
  const userFilter = all ? {} : { userId: scope.userId! };
  const base = `tiffin-${type}-${all ? 'all' : slug(scope.label)}-${stamp()}`;

  if (type === 'records') {
    const rows = await prisma.tiffinRecord.findMany({
      where: { ...userFilter, ...dateWhere(range, 'serviceDate'), ...(extra.status && { status: extra.status as never }) },
      include: { user: true },
      orderBy: [{ serviceDate: 'asc' }, { id: 'asc' }],
    });
    const total = rows.reduce((a, r) => a + num(r.chargedAmount), 0);
    const unpaid = rows.filter((r) => r.status === 'UNPAID').reduce((a, r) => a + num(r.chargedAmount), 0);
    return {
      title: all ? 'Daily Consumption Records' : 'My Tiffin Records',
      subtitle: sub,
      cols: [
        { label: 'Date', w: 1.2 },
        ...(all ? [{ label: 'Customer', w: 1.6 }] : []),
        { label: 'Type', w: 0.8 },
        { label: 'Menu / Items', w: 3.4 },
        { label: 'Amount (Rs.)', w: 1.2, align: 'right' as const },
        { label: 'Status', w: 1.2 },
      ],
      rows: rows.map((r) => [
        fmtDate(r.serviceDate)!,
        ...(all ? [r.user.fullName] : []),
        r.tiffinType,
        r.menuSnapshot ?? '',
        money(r.chargedAmount),
        r.status === 'UNPAID' ? 'UNPAID' : 'PAID',
      ]),
      summary: [
        ['Total tiffins', String(rows.length)],
        ['Total amount', `Rs. ${money(total)}`],
        ['Outstanding (unpaid)', `Rs. ${money(unpaid)}`],
      ],
      landscape: all,
      filename: base,
    };
  }

  if (type === 'requests') {
    const rows = await prisma.tiffinRequest.findMany({
      where: { ...userFilter, ...dateWhere(range, 'serviceDate'), ...(extra.status && { status: extra.status as never }) },
      include: { user: true },
      orderBy: [{ serviceDate: 'asc' }, { id: 'asc' }],
    });
    return {
      title: all ? 'Tiffin Requests' : 'My Tiffin Requests',
      subtitle: sub,
      cols: [
        { label: 'Date', w: 1.2 },
        ...(all ? [{ label: 'Customer', w: 1.6 }] : []),
        { label: 'Type', w: 0.8 },
        { label: 'Instructions', w: 2.4 },
        { label: 'Status', w: 1.1 },
        { label: 'Reviewed By', w: 1.8 },
        { label: 'Reason', w: 1.5 },
      ],
      rows: rows.map((r) => [
        fmtDate(r.serviceDate)!,
        ...(all ? [r.user.fullName] : []),
        r.tiffinType,
        r.specialInstructions ?? '',
        r.status,
        r.reviewedBy ?? '',
        r.rejectionReason ?? '',
      ]),
      summary: [
        ['Total requests', String(rows.length)],
        ['Approved', String(rows.filter((r) => r.status === 'APPROVED').length)],
        ['Pending', String(rows.filter((r) => r.status === 'PENDING').length)],
      ],
      landscape: true,
      filename: base,
    };
  }

  if (type === 'payments') {
    const where: Prisma.PaymentWhereInput = {
      ...userFilter,
      ...(extra.status && { status: extra.status as never }),
      ...((range.startDate || range.endDate) && {
        createdAt: {
          ...(range.startDate && { gte: range.startDate }),
          ...(range.endDate && { lt: new Date(range.endDate.getTime() + 86400000) }),
        },
      }),
    };
    const rows = await prisma.payment.findMany({
      where,
      include: { user: true, invoice: true },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    });
    const ok = rows.filter((r) => r.status === 'SUCCESS').reduce((a, r) => a + num(r.amount), 0);
    return {
      title: all ? 'Payments & Settlements' : 'My Payments',
      subtitle: sub,
      cols: [
        { label: 'Payment #', w: 2 },
        { label: 'Date', w: 1.2 },
        ...(all ? [{ label: 'Customer', w: 1.5 }] : []),
        { label: 'Amount (Rs.)', w: 1.1, align: 'right' as const },
        { label: 'Method', w: 1.1 },
        { label: 'App / UTR', w: 2 },
        { label: 'Status', w: 1.5 },
        { label: 'Invoice #', w: 2 },
      ],
      rows: rows.map((r) => [
        r.paymentNumber,
        fmtDate(r.paymentDate ?? r.createdAt)!,
        ...(all ? [r.user.fullName] : []),
        money(r.amount),
        r.paymentMethod,
        [r.paymentApp, r.transactionRef].filter(Boolean).join(' / '),
        r.status === 'PENDING_VERIFICATION' ? 'AWAITING APPROVAL' : r.status === 'SUCCESS' ? 'VERIFIED' : 'REJECTED',
        r.invoice?.invoiceNumber ?? '',
      ]),
      summary: [
        ['Payments listed', String(rows.length)],
        ['Verified total', `Rs. ${money(ok)}`],
      ],
      landscape: true,
      filename: base,
    };
  }

  if (type === 'invoices') {
    const rows = await prisma.invoice.findMany({
      where: {
        ...userFilter,
        ...(range.startDate && { billingStartDate: { gte: range.startDate } }),
        ...(range.endDate && { billingEndDate: { lte: range.endDate } }),
      },
      include: { user: true, payment: true, items: true },
      orderBy: [{ generatedAt: 'asc' }, { id: 'asc' }],
    });
    const total = rows.reduce((a, r) => a + num(r.paymentAmount), 0);
    return {
      title: all ? 'Invoices' : 'My Invoices',
      subtitle: sub,
      cols: [
        { label: 'Invoice #', w: 2.1 },
        { label: 'Generated', w: 1.5 },
        ...(all ? [{ label: 'Customer', w: 1.5 }] : []),
        { label: 'Billing Period', w: 2.4 },
        { label: 'Tiffins', w: 0.8, align: 'right' as const },
        { label: 'Total (Rs.)', w: 1.1, align: 'right' as const },
        { label: 'Paid (Rs.)', w: 1.1, align: 'right' as const },
        { label: 'Payment #', w: 2 },
      ],
      rows: rows.map((r) => [
        r.invoiceNumber,
        dt(r.generatedAt).slice(0, 10),
        ...(all ? [r.user.fullName] : []),
        `${fmtDate(r.billingStartDate)} to ${fmtDate(r.billingEndDate)}`,
        String(r.items.length),
        money(r.totalAmount),
        money(r.paymentAmount),
        r.payment?.paymentNumber ?? '',
      ]),
      summary: [
        ['Invoices', String(rows.length)],
        ['Total paid', `Rs. ${money(total)}`],
      ],
      landscape: true,
      filename: base,
    };
  }

  if (type === 'users') {
    if (!all) throw badRequest('Not allowed');
    const users = await prisma.user.findMany({ orderBy: { id: 'asc' } });
    const balances = await balancesFor(users.map((u) => u.id));
    const due = Array.from(balances.values()).reduce((a, b) => a + b, 0);
    return {
      title: 'Users Directory',
      subtitle: sub,
      cols: [
        { label: 'Name', w: 1.8 },
        { label: 'Email', w: 2.4 },
        { label: 'Phone', w: 1.3 },
        { label: 'Department', w: 1.3 },
        { label: 'Role', w: 1.1 },
        { label: 'Status', w: 0.9 },
        { label: 'Balance Due (Rs.)', w: 1.3, align: 'right' as const },
        { label: 'Joined', w: 1.1 },
      ],
      rows: users.map((u) => [
        u.fullName,
        u.email,
        u.phone ?? '',
        u.department ?? '',
        u.role === 'ROLE_ADMIN' ? 'ADMIN' : 'CUSTOMER',
        u.status,
        money(balances.get(u.id) ?? 0),
        fmtDate(u.createdAt)!,
      ]),
      summary: [
        ['Users', String(users.length)],
        ['Total outstanding', `Rs. ${money(due)}`],
      ],
      landscape: true,
      filename: base,
    };
  }

  throw badRequest('Unknown export type');
}

// ------------------------------------------------------------------ CSV

function csvCell(v: string): string {
  let s = v ?? '';
  // Neutralise spreadsheet formula injection (user-entered text like "=HYPERLINK(...)").
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(t: Table): Uint8Array {
  const lines = [t.cols.map((c) => csvCell(c.label)).join(',')];
  for (const r of t.rows) lines.push(r.map(csvCell).join(','));
  lines.push('');
  for (const [k, v] of t.summary) lines.push(`${csvCell(k)},${csvCell(v)}`);
  // BOM so Excel opens UTF-8 (names, rupee text) correctly.
  return new TextEncoder().encode('﻿' + lines.join('\r\n') + '\r\n');
}

// ------------------------------------------------------------------ PDF

const GOLD = rgb(0.79, 0.54, 0.02);
const GOLD_BG = rgb(1, 0.965, 0.82);
const DARK = rgb(0.4, 0.26, 0.06);
const TEXT = rgb(0.16, 0.14, 0.12);
const MUTED = rgb(0.45, 0.42, 0.38);
const LINE = rgb(0.92, 0.86, 0.68);

const safe = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, '?');

function wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = '';
  for (const w of words) {
    // hard-split a single very long token (emails, ids)
    let token = w;
    while (font.widthOfTextAtSize(token, size) > maxW && token.length > 1) {
      let cut = token.length - 1;
      while (cut > 1 && font.widthOfTextAtSize(token.slice(0, cut), size) > maxW) cut--;
      if (line) {
        out.push(line);
        line = '';
      }
      out.push(token.slice(0, cut));
      token = token.slice(cut);
    }
    const cand = line ? `${line} ${token}` : token;
    if (font.widthOfTextAtSize(cand, size) <= maxW) line = cand;
    else {
      if (line) out.push(line);
      line = token;
    }
  }
  if (line) out.push(line);
  return out.length ? out : [''];
}

export async function toPdf(t: Table): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(t.title);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = t.landscape ? 841.89 : 595.28;
  const H = t.landscape ? 595.28 : 841.89;
  const MX = 30;
  const tableW = W - MX * 2;
  const totalW = t.cols.reduce((a, c) => a + c.w, 0);
  const widths = t.cols.map((c) => (c.w / totalW) * tableW);
  const xs: number[] = [];
  widths.reduce((acc, w) => (xs.push(acc), acc + w), MX);
  const PAD = 5;
  const FS = 8;

  const pages: PDFPage[] = [];
  let page: PDFPage;
  let y = 0;

  const newPage = (first: boolean) => {
    page = doc.addPage([W, H]);
    pages.push(page);
    y = H - 36;
    if (first) {
      page.drawText('TIFFIN SYSTEM', { x: MX, y: y - 14, size: 16, font: bold, color: GOLD });
      page.drawText(safe(t.title), { x: MX, y: y - 36, size: 13, font: bold, color: DARK });
      const sub = wrap(t.subtitle, reg, 8.5, tableW);
      sub.forEach((l, i) => page.drawText(l, { x: MX, y: y - 51 - i * 11, size: 8.5, font: reg, color: MUTED }));
      y -= 62 + sub.length * 11;
      page.drawLine({ start: { x: MX, y: y + 6 }, end: { x: W - MX, y: y + 6 }, thickness: 1, color: GOLD });
      y -= 8;
    }
    // header row
    page.drawRectangle({ x: MX, y: y - 20, width: tableW, height: 20, color: GOLD_BG, borderColor: LINE, borderWidth: 0.6 });
    t.cols.forEach((c, i) => {
      const label = safe(c.label);
      if (c.align === 'right') {
        page.drawText(label, { x: xs[i] + widths[i] - PAD - bold.widthOfTextAtSize(label, FS), y: y - 13, size: FS, font: bold, color: DARK });
      } else {
        page.drawText(label, { x: xs[i] + PAD, y: y - 13, size: FS, font: bold, color: DARK });
      }
    });
    y -= 20;
  };

  newPage(true);

  if (t.rows.length === 0) {
    page!.drawText('No data for the selected filters.', { x: MX + PAD, y: y - 18, size: 10, font: reg, color: MUTED });
    y -= 30;
  }

  t.rows.forEach((row, ri) => {
    const cells = row.map((v, i) => wrap(v, reg, FS, widths[i] - PAD * 2));
    const h = Math.max(...cells.map((c) => c.length)) * 10.5 + 8;
    if (y - h < 60) newPage(false);
    if (ri % 2 === 1) page!.drawRectangle({ x: MX, y: y - h, width: tableW, height: h, color: rgb(1, 0.99, 0.95) });
    page!.drawLine({ start: { x: MX, y: y - h }, end: { x: W - MX, y: y - h }, thickness: 0.4, color: LINE });
    cells.forEach((lines, i) => {
      lines.forEach((l, li) => {
        const yy = y - 12 - li * 10.5;
        if (t.cols[i].align === 'right') {
          page!.drawText(l, { x: xs[i] + widths[i] - PAD - reg.widthOfTextAtSize(l, FS), y: yy, size: FS, font: reg, color: TEXT });
        } else {
          page!.drawText(l, { x: xs[i] + PAD, y: yy, size: FS, font: reg, color: TEXT });
        }
      });
    });
    y -= h;
  });

  // summary box
  const boxH = t.summary.length * 15 + 14;
  if (y - boxH < 50) newPage(false);
  y -= 16;
  const boxW = 230;
  page!.drawRectangle({ x: W - MX - boxW, y: y - boxH, width: boxW, height: boxH, color: GOLD_BG, borderColor: GOLD, borderWidth: 0.8 });
  t.summary.forEach(([k, v], i) => {
    const yy = y - 17 - i * 15;
    page!.drawText(safe(k), { x: W - MX - boxW + 10, y: yy, size: 9, font: bold, color: DARK });
    const val = safe(v);
    page!.drawText(val, { x: W - MX - 10 - bold.widthOfTextAtSize(val, 9), y: yy, size: 9, font: bold, color: TEXT });
  });

  // footer: page numbers
  pages.forEach((p, i) => {
    const txt = `Page ${i + 1} of ${pages.length}  |  Computer-generated report, no signature required`;
    p.drawText(txt, { x: (W - reg.widthOfTextAtSize(txt, 7.5)) / 2, y: 22, size: 7.5, font: reg, color: MUTED });
  });

  return doc.save();
}

export async function render(t: Table, format: ExportFormat) {
  if (format === 'csv') {
    return { bytes: toCsv(t), contentType: 'text/csv; charset=utf-8', filename: `${t.filename}.csv` };
  }
  return { bytes: await toPdf(t), contentType: 'application/pdf', filename: `${t.filename}.pdf` };
}

export { fmtLong };
