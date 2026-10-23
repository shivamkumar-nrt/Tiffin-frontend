import { Prisma } from '@prisma/client';
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from 'pdf-lib';
import { prisma } from '../db';
import { ApiError, AuthUser, notFound, pageOf } from '../http';
import { InvoiceFull, invoiceDto } from '../mappers';
import { num } from '../serialize';
import { fmtLong } from '../time';

type Paging = { page: number; size: number; skip: number; take: number };

const include = { user: true, payment: true, items: true } as const;

function assertCanView(inv: { userId: number }, caller: AuthUser) {
  if (caller.role !== 'ROLE_ADMIN' && inv.userId !== caller.id) {
    throw new ApiError(403, 'Access denied: You do not have permission to perform this action.');
  }
}

export async function searchInvoices(
  filters: { userId?: number; startDate?: Date; endDate?: Date },
  paging: Paging,
) {
  const where: Prisma.InvoiceWhereInput = {
    ...(filters.userId != null && { userId: filters.userId }),
    ...(filters.startDate && { billingStartDate: { gte: filters.startDate } }),
    ...(filters.endDate && { billingEndDate: { lte: filters.endDate } }),
  };
  const [rows, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      include,
      orderBy: [{ generatedAt: 'desc' }, { id: 'desc' }],
      skip: paging.skip,
      take: paging.take,
    }),
    prisma.invoice.count({ where }),
  ]);
  return pageOf(rows.map(invoiceDto), total, paging.page, paging.size);
}

export async function getMyInvoices(userId: number) {
  const rows = await prisma.invoice.findMany({
    where: { userId },
    include,
    orderBy: [{ generatedAt: 'desc' }, { id: 'desc' }],
  });
  return rows.map(invoiceDto);
}

export async function getInvoiceById(id: number, caller: AuthUser) {
  const inv = await prisma.invoice.findUnique({ where: { id }, include });
  if (!inv) throw notFound(`Invoice not found with id: ${id}`);
  assertCanView(inv, caller);
  return invoiceDto(inv);
}

export async function getInvoiceByNumber(invoiceNumber: string, caller: AuthUser) {
  const inv = await prisma.invoice.findUnique({ where: { invoiceNumber }, include });
  if (!inv) throw notFound(`Invoice not found with number: ${invoiceNumber}`);
  assertCanView(inv, caller);
  return invoiceDto(inv);
}

// ---------------------------------------------------------------- PDF

const PRIMARY = rgb(234 / 255, 88 / 255, 12 / 255);
const HEADER_BG = rgb(249 / 255, 250 / 255, 251 / 255);
const TEXT_DARK = rgb(31 / 255, 41 / 255, 55 / 255);
const TEXT_MUTED = rgb(107 / 255, 114 / 255, 128 / 255);
const BORDER = rgb(229 / 255, 231 / 255, 235 / 255);
const GREEN = rgb(22 / 255, 101 / 255, 52 / 255);

/** Standard PDF fonts only cover WinAnsi; strip anything else so rendering can't throw. */
const safe = (s: string) => s.replace(/[^\x20-\x7E -ÿ]/g, '?');

function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = safe(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export async function generateInvoicePdf(invoiceId: number): Promise<{ bytes: Uint8Array; invoiceNumber: string }> {
  const invoice = (await prisma.invoice.findUnique({ where: { id: invoiceId }, include })) as InvoiceFull | null;
  if (!invoice) throw notFound(`Invoice not found with id: ${invoiceId}`);

  const admin = await prisma.user.findFirst({ where: { role: 'ROLE_ADMIN' }, orderBy: { id: 'asc' } });
  const adminEmail = admin?.email ?? '';
  const adminPhone = admin?.phone ?? '';

  const doc = await PDFDocument.create();
  doc.setTitle(`Invoice ${invoice.invoiceNumber}`);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const W = 595.28;
  const H = 841.89;
  const MX = 36;
  const right = W - MX;
  let page: PDFPage = doc.addPage([W, H]);
  let y = H - 40;

  const text = (s: string, x: number, yy: number, size: number, font: PDFFont, color = TEXT_DARK) =>
    page.drawText(safe(s), { x, y: yy, size, font, color });
  const textRight = (s: string, xr: number, yy: number, size: number, font: PDFFont, color = TEXT_DARK) => {
    const t = safe(s);
    page.drawText(t, { x: xr - font.widthOfTextAtSize(t, size), y: yy, size, font, color });
  };

  // Header
  text('TIFFIN SYSTEM', MX, y - 18, 22, bold, PRIMARY);
  text('Fresh & Delicious Daily Meals', MX, y - 34, 9, regular, TEXT_MUTED);
  if (adminEmail) text(`Administrator: ${adminEmail}`, MX, y - 48, 9, bold);
  if (adminPhone.trim()) text(`Support Helpline: ${adminPhone}`, MX, y - 61, 9, regular, TEXT_MUTED);

  textRight('TAX INVOICE', right, y - 16, 16, bold);
  textRight(`Invoice #: ${invoice.invoiceNumber}`, right, y - 33, 10, bold);
  textRight(`Date: ${fmtLong(invoice.generatedAt)}`, right, y - 47, 10, regular);
  textRight('Status: PAID', right, y - 61, 10, bold, GREEN);

  y -= 80;
  page.drawLine({ start: { x: MX, y }, end: { x: right, y }, thickness: 0.7, color: BORDER });
  y -= 22;

  // Bill-to / billing details
  const colMid = MX + (right - MX) / 2;
  text('BILLED TO (CUSTOMER):', MX, y, 12, bold);
  text('BILLING DETAILS:', colMid, y, 12, bold);
  let yl = y - 16;
  text(invoice.user.fullName, MX, yl, 10, bold);
  yl -= 14;
  text(`Email: ${invoice.user.email}`, MX, yl, 10, regular);
  if (invoice.user.phone?.trim()) {
    yl -= 14;
    text(`Mobile: ${invoice.user.phone}`, MX, yl, 10, regular);
  }
  if (invoice.user.department?.trim()) {
    yl -= 14;
    text(`Dept: ${invoice.user.department}`, MX, yl, 10, regular);
  }
  let yr = y - 16;
  text(
    `Billing Period: ${fmtLong(invoice.billingStartDate)} to ${fmtLong(invoice.billingEndDate)}`,
    colMid,
    yr,
    10,
    regular,
  );
  if (invoice.payment) {
    yr -= 14;
    text(`Payment Ref: ${invoice.payment.paymentNumber}`, colMid, yr, 10, regular);
    yr -= 14;
    text(`Payment Method: ${invoice.payment.paymentMethod}`, colMid, yr, 10, regular);
  }
  y = Math.min(yl, yr) - 28;

  // Items table
  const cols = [
    { label: '#', w: 0.08, align: 'left' as const },
    { label: 'Date', w: 0.2, align: 'left' as const },
    { label: 'Tiffin Type', w: 0.16, align: 'left' as const },
    { label: 'Menu / Items Description', w: 0.4, align: 'left' as const },
    { label: 'Amount (Rs.)', w: 0.16, align: 'right' as const },
  ];
  const tableW = right - MX;
  const xs: number[] = [];
  let acc = MX;
  for (const c of cols) {
    xs.push(acc);
    acc += c.w * tableW;
  }
  const PAD = 6;

  const drawHeader = () => {
    page.drawRectangle({ x: MX, y: y - 24, width: tableW, height: 24, color: HEADER_BG, borderColor: BORDER, borderWidth: 0.7 });
    cols.forEach((c, i) => {
      const cw = c.w * tableW;
      if (c.align === 'right') textRight(c.label, xs[i] + cw - PAD, y - 16, 9, bold);
      else text(c.label, xs[i] + PAD, y - 16, 9, bold);
    });
    y -= 24;
  };
  drawHeader();

  const items = [...invoice.items].sort((a, b) => a.id - b.id);
  items.forEach((item, idx) => {
    const descW = cols[3].w * tableW - PAD * 2;
    const descLines = wrap(item.menuSummary ?? 'Standard Meal', regular, 10, descW);
    const rowH = Math.max(24, descLines.length * 13 + 10);
    if (y - rowH < 90) {
      page = doc.addPage([W, H]);
      y = H - 40;
      drawHeader();
    }
    page.drawRectangle({ x: MX, y: y - rowH, width: tableW, height: rowH, borderColor: BORDER, borderWidth: 0.7 });
    const ty = y - 16;
    text(String(idx + 1), xs[0] + PAD, ty, 10, regular);
    text(fmtLong(item.serviceDate), xs[1] + PAD, ty, 10, regular);
    text(item.tiffinType, xs[2] + PAD, ty, 10, regular);
    descLines.forEach((l, li) => text(l, xs[3] + PAD, ty - li * 13, 10, regular));
    textRight(num(item.chargedAmount).toFixed(2), xs[4] + cols[4].w * tableW - PAD, ty, 10, regular);
    y -= rowH;
  });

  // Summary
  if (y < 150) {
    page = doc.addPage([W, H]);
    y = H - 40;
  }
  y -= 24;
  const sumX = right - 0.45 * tableW;
  text('Total Billable Amount:', sumX + PAD, y, 10, bold);
  textRight(`Rs. ${num(invoice.totalAmount).toFixed(2)}`, right - PAD, y, 10, bold);
  y -= 20;
  text('Amount Paid:', sumX + PAD, y, 10, bold);
  textRight(`Rs. ${num(invoice.paymentAmount).toFixed(2)}`, right - PAD, y, 10, bold, GREEN);

  // Footer
  y -= 44;
  const footer =
    'Thank you for using our Tiffin Service. This is a computer-generated tax invoice and requires no physical signature.';
  const fw = regular.widthOfTextAtSize(footer, 9);
  text(footer, (W - fw) / 2, y, 9, regular, TEXT_MUTED);

  return { bytes: await doc.save(), invoiceNumber: invoice.invoiceNumber };
}
