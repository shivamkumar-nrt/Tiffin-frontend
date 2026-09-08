'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authService, userService, healthService } from '@/services/api';
import { AuthResponse, RoleType } from '@/types';

interface AuthContextType {
  user: AuthResponse | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  refreshBalance: () => Promise<void>;
  isAdmin: boolean;
  isEmployee: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const savedToken = localStorage.getItem('tiffin_token');
    const savedUser = localStorage.getItem('tiffin_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('tiffin_token');
        localStorage.removeItem('tiffin_user');
      }
    }
    setLoading(false);
    // Silent warmup ping to backend to prevent cold start delays
    healthService.checkHealth().catch(() => {});
  }, []);

  const login = async (email: string, pass: string) => {
    const response = await authService.login({ email, password: pass });
    if (response.success && response.data) {
      const authData = response.data;
      setUser(authData);
      setToken(authData.token);
      localStorage.setItem('tiffin_token', authData.token);
      localStorage.setItem('tiffin_user', JSON.stringify(authData));

      if (authData.role === 'ROLE_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/user');
      }
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tiffin_token');
    localStorage.removeItem('tiffin_user');
    router.push('/login');
  };

  const refreshBalance = async () => {
    if (user && user.id) {
      try {
        const res = await userService.getUserBalance(user.id);
        if (res.success && res.data !== undefined) {
          if (user.outstandingBalance !== res.data) {
            const updated = { ...user, outstandingBalance: res.data };
            setUser(updated);
            localStorage.setItem('tiffin_user', JSON.stringify(updated));
          }
        }
      } catch (err) {
        console.error('Failed to refresh balance', err);
      }
    }
  };

  const isAdmin = user?.role === 'ROLE_ADMIN';
  const isEmployee = user?.role === 'ROLE_EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshBalance,
        isAdmin,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};