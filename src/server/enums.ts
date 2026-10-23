// SQLite has no native enums, so the database stores these as plain strings.
// These unions keep the same compile-time safety the Prisma enums used to give.
export const ROLES = ['ROLE_ADMIN', 'ROLE_EMPLOYEE'] as const;
export const USER_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export const TIFFIN_TYPES = ['FULL', 'HALF'] as const;
export const REQUEST_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'] as const;
export const RECORD_STATUSES = ['UNPAID', 'BILLED_PAID'] as const;
export const PAYMENT_STATUSES = ['PENDING_VERIFICATION', 'SUCCESS', 'FAILED'] as const;
export const PAYMENT_METHODS = ['CASH', 'UPI', 'BANK_TRANSFER', 'CREDIT_CARD', 'OTHER'] as const;
export const ITEM_CATEGORIES = [
  'MAIN_COURSE',
  'CURRY',
  'BREAD',
  'RICE',
  'DESSERT',
  'SALAD',
  'BEVERAGE',
  'SPECIAL',
] as const;

export type RoleType = (typeof ROLES)[number];
export type UserStatus = (typeof USER_STATUSES)[number];
export type TiffinType = (typeof TIFFIN_TYPES)[number];
export type RequestStatus = (typeof REQUEST_STATUSES)[number];
export type RecordStatus = (typeof RECORD_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ItemCategory = (typeof ITEM_CATEGORIES)[number];
