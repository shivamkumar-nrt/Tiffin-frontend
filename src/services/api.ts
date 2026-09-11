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
  timeout: 30000,
});

// Global API Activity Tracker for all GET, POST, PUT, DELETE requests
type LoadingListener = (isLoading: boolean, method?: string, url?: string) => void;
const loadingListeners: Set<LoadingListener> = new Set();
let activeRequestsCount = 0;

export const subscribeApiLoading = (listener: LoadingListener) => {
  loadingListeners.add(listener);
  return () => {
    loadingListeners.delete(listener);
  };
};

const notifyApiLoading = (isLoading: boolean, method?: string, url?: string) => {
  loadingListeners.forEach((fn) => {
    try {
      fn(isLoading, method, url);
    } catch (e) {
      console.error(e);
    }
  });
};

apiClient.interceptors.request.use((config) => {
  activeRequestsCount++;
  notifyApiLoading(true, config.method?.toUpperCase(), config.url);

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('tiffin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    if (activeRequestsCount === 0) {
      notifyApiLoading(false);
    }
    return response;
  },
  (error) => {
    activeRequestsCount = Math.max(0, activeRequestsCount - 1);
    if (activeRequestsCount === 0) {
      notifyApiLoading(false);
    }

    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        const path = window.location.pathname;
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

// High-speed In-Memory Client Cache for ultra-fast instant UI rendering
const memoryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60000; // 1 minute client cache

export const clearApiCache = (pattern?: string) => {
  if (!pattern) {
    memoryCache.clear();
  } else {
    memoryCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        memoryCache.delete(key);
      }
    });
  }
};

const cachedGet = async <T>(url: string, params?: any, ttlMs: number = CACHE_TTL_MS): Promise<T> => {
  const cacheKey = `${url}:${JSON.stringify(params || {})}`;
  const cached = memoryCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  const res = await apiClient.get<T>(url, { params });
  memoryCache.set(cacheKey, { data: res.data, timestamp: Date.now() });
  return res.data;
};

// Auth APIs
export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    clearApiCache();
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return res.data;
  },
  register: async (data: { email: string; password: string; fullName: string; phone?: string; department?: string; role?: string }) => {
    clearApiCache();
    const res = await apiClient.post<ApiResponse<User>>('/auth/register', data);
    return res.data;
  },
  getCurrentUser: async () => {
    return cachedGet<ApiResponse<User>>('/auth/me', undefined, 120000);
  },
};

// User APIs
export const userService = {
  getUsers: async (params?: { search?: string; page?: number; size?: number; sortBy?: string; direction?: string }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<User>>>('/users', { params });
    return res.data;
  },
  getAllEmployees: async () => {
    return cachedGet<ApiResponse<User[]>>('/users/employees', undefined, 15000);
  },
  createUser: async (data: any) => {
    clearApiCache('users');
    const res = await apiClient.post<ApiResponse<User>>('/users', data);
    return res.data;
  },
  getUserById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return res.data;
  },
  updateUserStatus: async (id: number, status: 'ACTIVE' | 'INACTIVE') => {
    clearApiCache('users');
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
    return cachedGet<ApiResponse<MenuItem[]>>('/menus/items', undefined, 30000);
  },
  createMenuItem: async (item: MenuItem) => {
    clearApiCache('menus');
    const res = await apiClient.post<ApiResponse<MenuItem>>('/menus/items', item);
    return res.data;
  },
  deleteMenuItem: async (id: number) => {
    clearApiCache('menus');
    const res = await apiClient.delete<ApiResponse<string>>(`/menus/items/${id}`);
    return res.data;
  },
  getMenuByDate: async (date?: string) => {
    return cachedGet<ApiResponse<Menu>>('/menus', { date }, 30000);
  },
  getMenusInRange: async (startDate: string, endDate: string) => {
    const res = await apiClient.get<ApiResponse<Menu[]>>('/menus/range', { params: { startDate, endDate } });
    return res.data;
  },
  saveMenu: async (menu: Menu) => {
    clearApiCache('menus');
    const res = await apiClient.post<ApiResponse<Menu>>('/menus', menu);
    return res.data;
  },
  deleteMenu: async (id: number) => {
    clearApiCache('menus');
    const res = await apiClient.delete<ApiResponse<string>>(`/menus/${id}`);
    return res.data;
  },
};

// Combos & Thalis APIs
export const comboService = {
  getAllCombos: async () => {
    return cachedGet<ApiResponse<ComboPackage[]>>('/combos', undefined, 20000);
  },
  getActiveCombos: async () => {
    return cachedGet<ApiResponse<ComboPackage[]>>('/combos/active', undefined, 30000);
  },
  getComboById: async (id: number) => {
    const res = await apiClient.get<ApiResponse<ComboPackage>>(`/combos/${id}`);
    return res.data;
  },
  createCombo: async (combo: ComboPackage) => {
    clearApiCache('combos');
    const res = await apiClient.post<ApiResponse<ComboPackage>>('/combos', combo);
    return res.data;
  },
  updateCombo: async (id: number, combo: ComboPackage) => {
    clearApiCache('combos');
    const res = await apiClient.put<ApiResponse<ComboPackage>>(`/combos/${id}`, combo);
    return res.data;
  },
  deleteCombo: async (id: number) => {
    clearApiCache('combos');
    const res = await apiClient.delete<ApiResponse<string>>(`/combos/${id}`);
    return res.data;
  },
};

// Price APIs
export const priceService = {
  getCurrentPrices: async () => {
    return cachedGet<ApiResponse<{ FULL: PriceConfig; HALF: PriceConfig }>>('/prices/current', undefined, 60000);
  },
  getAllPrices: async () => {
    return cachedGet<ApiResponse<PriceConfig[]>>('/prices', undefined, 60000);
  },
  createPrice: async (price: PriceConfig) => {
    clearApiCache('prices');
    const res = await apiClient.post<ApiResponse<PriceConfig>>('/prices', price);
    return res.data;
  },
  updatePrice: async (id: number, price: PriceConfig) => {
    clearApiCache('prices');
    const res = await apiClient.put<ApiResponse<PriceConfig>>(`/prices/${id}`, price);
    return res.data;
  },
};

// Tiffin Request APIs
export const tiffinRequestService = {
  submitRequest: async (data: { userId?: number; serviceDate: string; tiffinType: 'FULL' | 'HALF'; comboId?: number; comboName?: string; specialInstructions?: string }) => {
    clearApiCache('dashboard');
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
    clearApiCache('dashboard');
    const res = await apiClient.patch<ApiResponse<TiffinRequest>>(`/tiffin-requests/${id}/approve`);
    return res.data;
  },
  rejectRequest: async (id: number, rejectionReason?: string) => {
    clearApiCache('dashboard');
    const res = await apiClient.patch<ApiResponse<TiffinRequest>>(`/tiffin-requests/${id}/reject`, { rejectionReason });
    return res.data;
  },
  cancelRequest: async (id: number) => {
    clearApiCache('dashboard');
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
  addManualRecord: async (data: { userId: number; serviceDate: string; tiffinType: string; amount: number; menuSnapshot?: string }) => {
    const res = await apiClient.post<ApiResponse<TiffinRecord>>('/tiffin-records/manual', data);
    return res.data;
  },
};

// Payment APIs
export const paymentService = {
  recordPayment: async (data: { userId: number; amount: number; paymentMethod: string; paymentApp?: string; paymentDate?: string; transactionRef?: string; notes?: string; markAsSuccess?: boolean }) => {
    clearApiCache();
    const res = await apiClient.post<ApiResponse<Payment>>('/payments', data);
    return res.data;
  },
  submitPayment: async (data: { amount: number; paymentMethod: string; paymentApp?: string; transactionRef: string; paymentDate?: string; notes?: string }) => {
    clearApiCache();
    const res = await apiClient.post<ApiResponse<Payment>>('/payments/submit', data);
    return res.data;
  },
  markPaymentSuccess: async (id: number) => {
    clearApiCache();
    const res = await apiClient.patch<ApiResponse<Payment>>(`/payments/${id}/success`);
    return res.data;
  },
  rejectPayment: async (id: number, reason?: string) => {
    clearApiCache();
    const res = await apiClient.patch<ApiResponse<Payment>>(`/payments/${id}/reject`, { reason });
    return res.data;
  },
  getReminderStatus: async () => {
    return cachedGet<ApiResponse<{ active: boolean; dayOfMonth: number; lastDayOfMonth: number; daysLeftInMonth: number; message: string }>>('/payments/reminder-status', undefined, 60000);
  },
  sendBulkReminders: async () => {
    const res = await apiClient.post<ApiResponse<any>>('/payments/send-reminders');
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
    return cachedGet<ApiResponse<DashboardStats>>('/dashboard/admin', undefined, 10000);
  },
  getUserStats: async () => {
    return cachedGet<ApiResponse<UserDashboardStats>>('/dashboard/user', undefined, 10000);
  },
};

// Audit Log APIs
export const auditLogService = {
  getRecentLogs: async () => {
    return cachedGet<ApiResponse<AuditLog[]>>('/audit-logs/recent', undefined, 10000);
  },
  getLogs: async (params?: { page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<PageResponse<AuditLog>>>('/audit-logs', { params });
    return res.data;
  },
};

// System Health & Warmup API
export const healthService = {
  checkHealth: async () => {
    try {
      const res = await apiClient.get('/health');
      return res.data;
    } catch {
      return null;
    }
  },
};

// Notification & Broadcast APIs
export const notificationService = {
  sendBroadcast: async (data: any) => {
    clearApiCache();
    const res = await apiClient.post<ApiResponse<any>>('/notifications/broadcast', data);
    return res.data;
  },
  getBroadcastHistory: async () => {
    return cachedGet<ApiResponse<any[]>>('/notifications/history', undefined, 10000);
  },
  getMyNotifications: async () => {
    return cachedGet<ApiResponse<any[]>>('/notifications/my', undefined, 15000);
  },
};