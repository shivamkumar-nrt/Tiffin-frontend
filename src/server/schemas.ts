import { z } from 'zod';

const required = (msg: string) => ({ required_error: msg, invalid_type_error: msg });

/** Non-blank string (mirrors @NotBlank). */
const notBlank = (msg: string) =>
  z.string(required(msg)).refine((s) => s.trim().length > 0, { message: msg });

const optStr = z.string().nullish();

const isoDate = (msg: string) =>
  z.string(required(msg)).regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format, expected YYYY-MM-DD' });

const optDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Invalid date format, expected YYYY-MM-DD' })
  .nullish();

/** Accepts numbers or numeric strings (Jackson coerces both). */
const money = (requiredMsg: string, minMsg: string) =>
  z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
    z.number(required(requiredMsg)).min(0.01, minMsg),
  );

const bool = (def = false) => z.boolean().nullish().transform((v) => v ?? def);

const enumOf = <const T extends readonly [string, ...string[]]>(values: T, msg: string) =>
  z.enum(values as unknown as [T[number], ...T[number][]], { required_error: msg, invalid_type_error: msg, message: msg });

export const TiffinTypeEnum = enumOf(['FULL', 'HALF'], 'Tiffin type is required');
const RoleEnum = z.enum(['ROLE_ADMIN', 'ROLE_EMPLOYEE']);
const PaymentMethodEnum = enumOf(['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER'], 'Payment method is required');
const ItemCategoryEnum = enumOf(
  ['MAIN_COURSE', 'CURRY', 'BREAD', 'RICE', 'DESSERT', 'SALAD', 'BEVERAGE', 'SPECIAL'],
  'Category is required',
);

export const authRequestSchema = z.object({
  email: z.string(required('Email is required')).min(1, 'Email is required').email('Invalid email format'),
  password: notBlank('Password is required'),
});

export const registerSchema = z.object({
  email: z.string(required('Email is required')).min(1, 'Email is required').email('Invalid email format'),
  password: z
    .string(required('Password is required'))
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
  fullName: notBlank('Full name is required'),
  phone: optStr,
  department: optStr,
  role: RoleEnum.nullish(),
});

export const userStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE'], required('Status is required')),
});

export const passwordResetSchema = z.object({
  password: z
    .string({ required_error: 'Password must be at least 6 characters', invalid_type_error: 'Password must be at least 6 characters' })
    .min(6, 'Password must be at least 6 characters'),
});

export const comboSchema = z.object({
  name: notBlank('Combo name is required'),
  tiffinType: TiffinTypeEnum,
  price: money('Price is required', 'Price must be greater than zero'),
  description: optStr,
  includedItems: z.array(z.string()).nullish(),
  active: bool(false),
});

export const menuItemSchema = z.object({
  name: notBlank('Item name is required'),
  category: ItemCategoryEnum,
  description: optStr,
  spicy: bool(false),
  sweet: bool(false),
});

export const menuSchema = z.object({
  serviceDate: isoDate('Service date is required'),
  title: notBlank('Title is required'),
  description: optStr,
  special: bool(false),
  items: z.array(menuItemSchema).nullish(),
});

export const priceSchema = z.object({
  tiffinType: TiffinTypeEnum,
  price: money('Price is required', 'Price must be greater than 0'),
  effectiveFrom: isoDate('Effective from date is required'),
  effectiveTo: optDate,
  active: bool(false),
});

export const createRequestSchema = z.object({
  userId: z.number().int().nullish(),
  serviceDate: isoDate('Service date is required'),
  tiffinType: TiffinTypeEnum,
  comboId: z.number().int().nullish(),
  comboName: optStr,
  specialInstructions: optStr,
});

export const updateRequestSchema = z.object({
  serviceDate: optDate,
  tiffinType: z.enum(['FULL', 'HALF']).nullish(),
  specialInstructions: optStr,
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).nullish(),
});

export const manualRecordSchema = z.object({
  userId: z.number(required('User ID is required')).int(),
  serviceDate: isoDate('Service date is required'),
  tiffinType: TiffinTypeEnum,
  amount: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v),
    z.number(required('Amount is required')).min(0, 'Amount must not be negative'),
  ),
  menuSnapshot: optStr,
});

export const updateRecordSchema = z.object({
  serviceDate: optDate,
  tiffinType: z.enum(['FULL', 'HALF']).nullish(),
  amount: z
    .preprocess((v) => (typeof v === 'string' && v.trim() !== '' ? Number(v) : v), z.number().min(0))
    .nullish(),
  menuSnapshot: optStr,
  status: z.enum(['UNPAID', 'BILLED_PAID']).nullish(),
});

export const createPaymentSchema = z.object({
  userId: z.number(required('User ID is required')).int(),
  amount: money('Amount is required', 'Amount must be greater than zero'),
  paymentMethod: PaymentMethodEnum,
  paymentApp: optStr,
  paymentDate: optDate,
  transactionRef: optStr,
  notes: optStr,
  markAsSuccess: bool(true),
});

export const submitPaymentSchema = z.object({
  amount: money('Payment amount is required', 'Amount must be greater than zero'),
  paymentMethod: PaymentMethodEnum,
  paymentApp: optStr,
  transactionRef: z.string(required('Transaction reference / UTR number is required')),
  paymentDate: optDate,
  notes: optStr,
});

export const broadcastSchema = z.object({
  title: notBlank('Title / Subject is required'),
  message: notBlank('Message content is required'),
  targetAudience: optStr,
  targetUserId: z.number().int().nullish(),
  sendEmail: bool(true),
  sendWhatsApp: bool(true),
  sendPush: bool(true),
});
