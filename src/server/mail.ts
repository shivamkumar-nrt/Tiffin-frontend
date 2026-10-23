import nodemailer, { Transporter } from 'nodemailer';
import type { Payment, TiffinRequest, User } from '@prisma/client';
import { escapeHtml as h, num } from './serialize';
import { fmtDate } from './time';

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const user = process.env.SMTP_USERNAME;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) {
    transporter = null;
    return null;
  }
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000,
  });
  return transporter;
}

/** Never throws: email problems must not break the business operation. */
export async function sendEmail(to: string | null | undefined, subject: string, html: string): Promise<void> {
  if (!to || !to.trim()) return;
  const t = getTransporter();
  if (!t) {
    console.info(
      `[EMAIL NOTIFICATION (SIMULATION)] To: ${to}, Subject: ${subject}\n(Set SMTP_USERNAME and SMTP_PASSWORD to send real emails)`,
    );
    return;
  }
  try {
    await t.sendMail({
      from: { name: 'Tiffin Service System', address: process.env.SMTP_USERNAME! },
      to: to.trim(),
      subject,
      html,
    });
  } catch (e) {
    console.warn(`Failed to send email to ${to}:`, e instanceof Error ? e.message : e);
  }
}

const wrap = (gradient: string, heading: string, body: string, footer: string) =>
  `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">` +
  `<div style="background: ${gradient}; padding: 15px 20px; border-radius: 8px; color: #ffffff; text-align: center;">` +
  `<h2 style="margin: 0; font-size: 20px;">${heading}</h2></div>` +
  body +
  `<p style="font-size: 12px; color: #94a3b8; text-align: center;">Tiffin Management System &bull; ${footer}</p></div>`;

const hello = (name: string) =>
  `<p style="font-size: 15px; color: #334155; margin-top: 20px;">Hello <b>${h(name)}</b>,</p>`;

export function broadcastHtml(title: string, message: string, user: User): string {
  return (
    `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">` +
    `<div style="background: linear-gradient(135deg, #059669, #0f766e); padding: 18px 20px; border-radius: 8px; color: #ffffff; text-align: center;">` +
    `<h2 style="margin: 0; font-size: 20px;">📢 Tiffin Service Announcement</h2></div>` +
    hello(user.fullName) +
    `<div style="background: #f8fafc; border-left: 4px solid #059669; padding: 18px; border-radius: 6px; margin: 20px 0;">` +
    `<h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 16px;">${h(title)}</h3>` +
    `<p style="margin: 0; color: #334155; line-height: 1.6; white-space: pre-line;">${h(message)}</p></div>` +
    `<p style="font-size: 12px; color: #94a3b8; text-align: center;">Tiffin Management System &bull; Official Notification</p></div>`
  );
}

export function sendRequestStatusEmail(user: User, request: TiffinRequest) {
  const approved = request.status === 'APPROVED';
  const color = approved ? '#059669' : '#dc2626';
  const text = approved ? 'APPROVED' : 'REJECTED';
  const html = wrap(
    'linear-gradient(135deg, #059669, #0d9488)',
    '🍱 Tiffin Service Update',
    hello(user.fullName) +
      `<p style="color: #475569;">Your Tiffin Request for <b>${fmtDate(request.serviceDate)}</b> has been updated.</p>` +
      `<div style="background: #f8fafc; border-left: 4px solid ${color}; padding: 15px; border-radius: 6px; margin: 20px 0;">` +
      `<p style="margin: 0 0 8px 0;"><b>Status:</b> <span style="color: ${color}; font-weight: bold;">${text}</span></p>` +
      `<p style="margin: 0 0 8px 0;"><b>Meal Type:</b> ${request.tiffinType}</p>` +
      (request.rejectionReason
        ? `<p style="margin: 0; color: #dc2626;"><b>Reason:</b> ${h(request.rejectionReason)}</p>`
        : '') +
      `</div>`,
    'Automatic Notification',
  );
  return sendEmail(user.email, `Tiffin Request ${text} - ${fmtDate(request.serviceDate)}`, html);
}

export function sendPaymentReminderEmail(user: User, outstanding: number, upiId?: string) {
  const upi = upiId || process.env.PAYEE_UPI_ID || '';
  const payee = process.env.PAYEE_NAME || 'Admin';
  const html = wrap(
    'linear-gradient(135deg, #0284c7, #0369a1)',
    '💳 Monthly Payment Reminder',
    hello(user.fullName) +
      `<p style="color: #475569;">This is a friendly reminder to settle your monthly tiffin balance before month end.</p>` +
      `<div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">` +
      `<p style="margin: 0; color: #166534; font-size: 14px;">Outstanding Balance Due:</p>` +
      `<h1 style="margin: 5px 0 10px 0; color: #15803d; font-size: 28px;">Rs. ${outstanding.toFixed(2)}</h1>` +
      `<p style="margin: 0; font-size: 13px; color: #334155;">Payee: <b>${h(payee)}</b>${upi ? ` | Primary UPI: <b>${h(upi)}</b>` : ''}</p></div>` +
      `<p style="color: #475569; font-size: 13px;">After making the UPI payment, please log into your customer portal and submit your 12-digit UTR/Reference number for instant verification.</p>`,
    'Automatic Notification',
  );
  return sendEmail(user.email, `Tiffin Monthly Payment Reminder (Due: Rs. ${outstanding.toFixed(2)})`, html);
}

export function sendPaymentApprovalEmail(user: User, payment: Payment) {
  const html = wrap(
    'linear-gradient(135deg, #059669, #10b981)',
    '✅ Payment Verified & Approved',
    hello(user.fullName) +
      `<p style="color: #475569;">We have successfully verified and received your tiffin payment settlement.</p>` +
      `<div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; margin: 20px 0;">` +
      `<p style="margin: 0 0 6px 0;"><b>Amount Received:</b> Rs. ${num(payment.amount).toFixed(2)}</p>` +
      `<p style="margin: 0 0 6px 0;"><b>UTR / Transaction Ref:</b> ${h(payment.transactionRef ?? 'N/A')}</p>` +
      `<p style="margin: 0 0 6px 0;"><b>Payment App:</b> ${h(payment.paymentApp ?? 'UPI')}</p>` +
      `<p style="margin: 0;"><b>Status:</b> <span style="color: #059669; font-weight: bold;">VERIFIED & COMPLETED</span></p></div>` +
      `<p style="color: #475569; font-size: 13px;">Your customer account balance has been updated accordingly. Thank you for your payment!</p>`,
    'Official Receipt',
  );
  return sendEmail(user.email, `Payment Approved (Rs. ${num(payment.amount).toFixed(2)}) - Receipt`, html);
}

export function sendNewRequestAlertToAdmin(adminEmail: string, user: User, request: TiffinRequest) {
  const html = wrap(
    'linear-gradient(135deg, #059669, #0d9488)',
    '🔔 New Tiffin Order Received',
    hello('Admin') +
      `<p style="color: #475569;">A new tiffin request has been submitted by customer <b>${h(user.fullName)}</b>.</p>` +
      `<div style="background: #f8fafc; border-left: 4px solid #059669; padding: 15px; border-radius: 6px; margin: 20px 0;">` +
      `<p style="margin: 0 0 6px 0;"><b>Customer Name:</b> ${h(user.fullName)}</p>` +
      `<p style="margin: 0 0 6px 0;"><b>Phone:</b> ${h(user.phone ?? 'N/A')}</p>` +
      `<p style="margin: 0 0 6px 0;"><b>Service Date:</b> ${fmtDate(request.serviceDate)}</p>` +
      `<p style="margin: 0 0 6px 0;"><b>Meal Type:</b> ${request.tiffinType}</p>` +
      (request.specialInstructions
        ? `<p style="margin: 0;"><b>Instructions:</b> ${h(request.specialInstructions)}</p>`
        : '') +
      `</div><p style="color: #475569; font-size: 13px;">Please log into the Admin Console to review and approve this order.</p>`,
    'Admin Alert',
  );
  return sendEmail(adminEmail, `🔔 New Tiffin Request: ${user.fullName} (${fmtDate(request.serviceDate)})`, html);
}

export function sendNewPaymentAlertToAdmin(adminEmail: string, user: User, payment: Payment) {
  const html = wrap(
    'linear-gradient(135deg, #0284c7, #0369a1)',
    '💰 New Payment Submitted (Pending Verification)',
    hello('Admin') +
      `<p style="color: #475569;">A payment settlement has been submitted by customer <b>${h(user.fullName)}</b>.</p>` +
      `<div style="background: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; border-radius: 6px; margin: 20px 0;">` +
      `<p style="margin: 0 0 6px 0;"><b>Amount Paid:</b> Rs. ${num(payment.amount).toFixed(2)}</p>` +
      `<p style="margin: 0 0 6px 0;"><b>UTR / Transaction Ref:</b> ${h(payment.transactionRef ?? 'N/A')}</p>` +
      `<p style="margin: 0 0 6px 0;"><b>Payment App:</b> ${h(payment.paymentApp ?? 'UPI')}</p>` +
      `<p style="margin: 0;"><b>Customer:</b> ${h(user.fullName)} (${h(user.email)})</p></div>` +
      `<p style="color: #475569; font-size: 13px;">Please check bank account and verify/approve in Admin Console.</p>`,
    'Admin Alert',
  );
  return sendEmail(
    adminEmail,
    `💰 New Payment Submitted: Rs. ${num(payment.amount).toFixed(2)} from ${user.fullName}`,
    html,
  );
}
