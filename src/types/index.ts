export type RoleType = 'ROLE_ADMIN' | 'ROLE_EMPLOYEE';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type TiffinType = 'FULL' | 'HALF';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type RecordStatus = 'UNPAID' | 'BILLED_PAID';
export type PaymentStatus = 'PENDING_VERIFICATION' | 'SUCCESS' | 'FAILED';
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'OTHER';
export type ItemCategory = 'MAIN_COURSE' | 'CURRY' | 'BREAD' | 'RICE' | 'DESSERT' | 'SALAD' | 'BEVERAGE' | 'SPECIAL';

export interface User {
  id: number;
  email: string;
  fullName: string;
  phone?: string;
  department?: string;
  role: RoleType;
  status: UserStatus;
  outstandingBalance: number;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  email: string;
  fullName: string;
  role: RoleType;
  outstandingBalance: number;
}

export interface MenuItem {
  id?: number;
  name: string;
  category: ItemCategory;
  description?: string;
  spicy?: boolean;
  sweet?: boolean;
  available?: boolean;
}

export interface ComboPackage {
  id?: number;
  name: string;
  tiffinType: TiffinType;
  price: number;
  description?: string;
  includedItems: string[];
  active: boolean;
  createdAt?: string;
}

export interface Menu {
  id?: number;
  serviceDate: string;
  title: string;
  description?: string;
  special: boolean;
  items: MenuItem[];
}

export interface PriceConfig {
  id?: number;
  tiffinType: TiffinType;
  price: number;
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
}

export interface TiffinRequest {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  userDepartment?: string;
  serviceDate: string;
  tiffinType: TiffinType;
  comboId?: number;
  comboName?: string;
  specialInstructions?: string;
  status: RequestStatus;
  reviewedBy?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface TiffinRecord {
  id: number;
  requestId: number;
  userId: number;
  userName: string;
  userEmail: string;
  serviceDate: string;
  tiffinType: TiffinType;
  menuSnapshot: string;
  chargedAmount: number;
  status: RecordStatus;
  paymentId?: number;
  createdAt: string;
}

export interface Payment {
  id: number;
  paymentNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentApp?: string;
  paymentDate?: string;
  transactionRef?: string;
  notes?: string;
  rejectionReason?: string;
  status: PaymentStatus;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  invoiceId?: number;
  invoiceNumber?: string;
}

export interface SubmitPaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  paymentApp?: string;
  transactionRef: string;
  paymentDate?: string;
  notes?: string;
}

export interface ReminderStatus {
  active: boolean;
  dayOfMonth: number;
  lastDayOfMonth: number;
  daysLeftInMonth: number;
  message: string;
}

export interface InvoiceItem {
  id: number;
  tiffinRecordId: number;
  serviceDate: string;
  tiffinType: TiffinType;
  menuSummary?: string;
  chargedAmount: number;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone?: string;
  userDepartment?: string;
  paymentId?: number;
  paymentNumber?: string;
  billingStartDate: string;
  billingEndDate: string;
  totalAmount: number;
  paymentAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  generatedBy?: string;
  generatedAt: string;
  items: InvoiceItem[];
}

export interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingRequests: number;
  approvedRequestsToday: number;
  totalTiffinsToday: number;
  totalOutstandingDues: number;
  totalRevenueCollected: number;
  todayRevenue: number;
  currentFullPrice: PriceConfig;
  currentHalfPrice: PriceConfig;
  todayMenu?: Menu;
  recentPendingRequests: TiffinRequest[];
  recentPayments: Payment[];
}

export interface UserDashboardStats {
  outstandingBalance: number;
  totalTiffinsConsumed: number;
  pendingRequestsCount: number;
  todayMenu?: Menu;
  currentFullPrice: PriceConfig;
  currentHalfPrice: PriceConfig;
  recentRequests: TiffinRequest[];
  recentRecords: TiffinRecord[];
  recentInvoices: Invoice[];
}

export interface AuditLog {
  id: number;
  action: string;
  entityName: string;
  entityId?: string;
  performedBy: string;
  details?: string;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}