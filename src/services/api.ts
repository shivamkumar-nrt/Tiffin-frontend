import axios from 'axios';
import {
  ApiResponse,
  AuthResponse,
  ComboPackage,
  DashboardStats,
  Invoice,
  Menu,
  MenuItem,
  PageResponse,
  Payment,
  PriceConfig,
  TiffinRecord,
  TiffinRequest,
  User,
  UserDashboardStats,
  AuditLog
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tiffin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
        // Only redirect to /login if user is attempting to access protected routes (/admin or /user)
        if (path.startsWith('/admin') || path.startsWith('/user')) {
          localStorage.removeItem('tiffin_token');
          localStorage.removeItem('tiffin_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: { email: string; password: string; fullName: string; phone?: string; department?: string; role?: string }) => {
    const res = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return res.data;
  },
  getCurrentUser: async () => {
    const res = await apiClient.get<ApiResponse<User>>('/auth/me');
    return res.data;
  },
};

// User APIs
export const userService = {
  getUsers: async (params?: { search?: string; page?: number; size?: number; sortBy?: string; direction?: string }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<User>>>('/users', { params });
    return res.data;
  },
  getAllEmployees: async () => {
    const res = await apiClient.get<ApiResponse<User[]>>('/users/employees');
    return res.data;
  },
  createUser: async (data: any) => {
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data;
  },
  getUserById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },
  updateUserStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE') => {
    const res = await apiClient.patch<ApiResponse<User>>(`/users/${id}/status`, { status });
    return res.data;
  },
  resetUserPassword: async (id: number, password: string) => {
    const res = await apiClient.patch<ApiResponse<string>>(`/users/${id}/password`, { password });
    return res.data;
  },
  getUserBalance: async (id: number) => {
    const res = await apiClient.get<ApiResponse<number>>(`/users/${id}/balance`);
    return res.data;
  },
};

// Menu Items & Dishes APIs
export const menuService = {
  getAllMenuItems: async () => {
    const res = await apiClient.get<ApiResponse<MenuItem[]>>('/menus/items');
    return res.data;
  },
  createMenuItem: async (item: MenuItem) => {
    const res = await apiClient.post<ApiResponse<MenuItem>>('/menus/items', item);
    return res.data;
  },
  deleteMenuItem: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<string>>(`/menus/items/${id}`);
    return res.data;
  },
  getMenuByDate: async (date?: string) => {
    const res = await apiClient.get<ApiResponse<Menu>>('/menus', { params: { date } });
    return res.data;
  },
  getMenusInRange: async (startDate: string, endDate: string) => {
    const res = await apiClient.get<ApiResponse<Menu[]>>('/menus/range', { params: { startDate, endDate } });
    return res.data;
  },
  saveMenu: async (menu: Menu) => {
    const res = await apiClient.post<ApiResponse<Menu>>('/menus', menu);
    return res.data;
  },
  deleteMenu: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<string>>(`/menus/${id}`);
    return res.data;
  },
};

// Combos & Thalis APIs
export const comboService = {
  getAllCombos: async () => {
    const res = await apiClient.get<ApiResponse<ComboPackage[]>>('/combos');
    return res.data;
  },
  getActiveCombos: async () => {
    const res = await apiClient.get<ApiResponse<ComboPackage[]>>('/combos/active');
    return res.data;
  },
  getComboById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<ComboPackage>>(`/combos/${id}`);
    return res.data;
  },
  createCombo: async (combo: ComboPackage) => {
    const res = await apiClient.post<ApiResponse<ComboPackage>>('/combos', combo);
    return res.data;
  },
  updateCombo: async (id: number, combo: ComboPackage) => {
    const res = await apiClient.put<ApiResponse<ComboPackage>>(`/combos/${id}`, combo);
    return res.data;
  },
  deleteCombo: async (id: number) => {
    const res = await apiClient.delete<ApiResponse<string>>(`/combos/${id}`);
    return res.data;
  },
};

// Price APIs
export const priceService = {
  getCurrentPrices: async () => {
    const res = await apiClient.get<ApiResponse<{ FULL: PriceConfig; HALF: PriceConfig }>>('/prices/current');
    return res.data;
  },
  getAllPrices: async () => {
    const res = await apiClient.get<ApiResponse<PriceConfig[]>>('/prices');
    return res.data;
  },
  createPrice: async (price: PriceConfig) => {
    const res = await apiClient.post<ApiResponse<PriceConfig>>('/prices', price);
    return res.data;
  },
  updatePrice: async (id: number, price: PriceConfig) => {
    const res = await apiClient.put<ApiResponse<PriceConfig>>(`/prices/${id}`, price);
    return res.data;
  },
};

// Tiffin Request APIs
export const tiffinRequestService = {
  submitRequest: async (data: { userId?: number; serviceDate: string; tiffinType: 'FULL' | 'HALF'; comboId?: number; comboName?: string; specialInstructions?: string }) => {
    const res = await apiClient.post<ApiResponse<TiffinRequest>>('/tiffin-requests', data);
    return res.data;
  },
  getRequests: async (params?: { userId?: number; status?: string; startDate?: string; endDate?: string; page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<TiffinRequest>>>('/tiffin-requests', { params });
    return res.data;
  },
  getMyRequests: async () => {
    const res = await apiClient.get<ApiResponse<TiffinRequest[]>>('/tiffin-requests/my');
    return res.data;
  },
  approveRequest: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<TiffinRequest>>(`/tiffin-requests/${id}/approve`);
    return res.data;
  },
  rejectRequest: async (id: number, rejectionReason?: string) => {
    const res = await apiClient.patch<ApiResponse<TiffinRequest>>(`/tiffin-requests/${id}/reject`, { rejectionReason });
    return res.data;
  },
  cancelRequest: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<TiffinRequest>>(`/tiffin-requests/${id}/cancel`);
    return res.data;
  },
};

// Tiffin Record APIs
export const tiffinRecordService = {
  getRecords: async (params?: { userId?: number; status?: string; startDate?: string; endDate?: string; page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<TiffinRecord>>>('/tiffin-records', { params });
    return res.data;
  },
  getMyRecords: async () => {
    const res = await apiClient.get<ApiResponse<TiffinRecord[]>>('/tiffin-records/my');
    return res.data;
  },
  getRecordsByDate: async (date: string) => {
    const res = await apiClient.get<ApiResponse<TiffinRecord[]>>('/tiffin-records/by-date', { params: { date } });
    return res.data;
  },
  getUnpaidRecords: async (userId: number) => {
    const res = await apiClient.get<ApiResponse<TiffinRecord[]>>(`/tiffin-records/unpaid/${userId}`);
    return res.data;
  },
};

// Payment APIs
export const paymentService = {
  recordPayment: async (data: { userId: number; amount: number; paymentMethod: string; transactionRef?: string; notes?: string; markAsSuccess?: boolean }) => {
    const res = await apiClient.post<ApiResponse<Payment>>('/payments', data);
    return res.data;
  },
  markPaymentSuccess: async (id: number) => {
    const res = await apiClient.patch<ApiResponse<Payment>>(`/payments/${id}/success`);
    return res.data;
  },
  getPayments: async (params?: { userId?: number; status?: string; page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<Payment>>>('/payments', { params });
    return res.data;
  },
  getMyPayments: async () => {
    const res = await apiClient.get<ApiResponse<Payment[]>>('/payments/my');
    return res.data;
  },
  getPaymentById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Payment>>(`/payments/${id}`);
    return res.data;
  },
};

// Invoice APIs
export const invoiceService = {
  getInvoices: async (params?: { userId?: number; startDate?: string; endDate?: string; page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<Invoice>>>('/invoices', { params });
    return res.data;
  },
  getMyInvoices: async () => {
    const res = await apiClient.get<ApiResponse<Invoice[]>>('/invoices/my');
    return res.data;
  },
  getInvoiceById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<Invoice>>(`/invoices/${id}`);
    return res.data;
  },
  getPdfUrl: (id: number) => {
    return `${API_BASE_URL}/invoices/${id}/pdf`;
  },
};

// Dashboard APIs
export const dashboardService = {
  getAdminStats: async () => {
    const res = await apiClient.get<ApiResponse<DashboardStats>>('/dashboard/admin');
    return res.data;
  },
  getUserStats: async () => {
    const res = await apiClient.get<ApiResponse<UserDashboardStats>>('/dashboard/user');
    return res.data;
  },
};

// Audit Log APIs
export const auditLogService = {
  getRecentLogs: async () => {
    const res = await apiClient.get<ApiResponse<AuditLog[]>>('/audit-logs/recent');
    return res.data;
  },
  getLogs: async (params?: { page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<AuditLog>>>('/audit-logs', { params });
    return res.data;
  },
};