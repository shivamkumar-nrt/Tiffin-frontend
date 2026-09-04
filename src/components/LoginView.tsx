'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api';
import {
  Utensils,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Sparkles,
  UserPlus,
  LogIn,
  ChefHat,
  Receipt,
  HeartHandshake
} from 'lucide-react';
import Link from 'next/link';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Sign In State (Clean blank inputs)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign Up State
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!fullName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (signupPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      const res = await authService.register({
        fullName: fullName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        phone: phone.trim(),
        role: 'ROLE_EMPLOYEE',
      });

      if (res.success) {
        setSuccessMsg('Account created successfully! Logging you in...');
        await login(signupEmail.trim(), signupPassword);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Email might already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left 50% Hero Showcase */}
      <div className="lg:col-span-7 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 p-8 lg:p-14 flex flex-col justify-between relative overflow-hidden text-white">
        {/* Ambient Glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>

        {/* Top Brand Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30 group-hover:scale-105 transition">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">TiffinSystem</h1>
              <p className="text-[11px] text-orange-200/80 font-medium">Daily Fresh Food & Account Portal</p>
            </div>
          </Link>

          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition backdrop-blur-md hidden sm:block"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Center Showcase Content */}
        <div className="relative z-10 my-10 space-y-6 max-w-xl">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Pure, Fresh & Home-Style Meals</span>
          </div>

          <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
            Delicious Daily Meals, <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-amber-200 bg-clip-text text-transparent">
              Managed Seamlessly.
            </span>
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed">
            Order healthy Full & Half Thalis, explore special custom combos, track daily food consumption records, and view automatic tax invoices.
          </p>

          {/* Value Proposition Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-400 flex-shrink-0 mt-0.5">
                <ChefHat className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Curated Thalis & Combos</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Soft rotis, rich paneer dishes, dal tadka, jeera rice, sweets & fresh salad.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 p-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Transparent Account & Invoicing</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automated running ledger, locked pricing snapshots, and 1-click PDF invoices.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <HeartHandshake className="w-4 h-4 text-orange-400" />
            <span>Hygienic Home Kitchen • On-time Delivery</span>
          </div>
          <span className="font-bold text-white">4.9 ★ Rating</span>
        </div>
      </div>

      {/* Right 50% Auth Card Panel */}
      <div className="lg:col-span-5 bg-slate-50/70 p-6 lg:p-12 flex flex-col justify-center border-l border-slate-200/60">
        <div className="max-w-md w-full mx-auto space-y-6">
          {/* Header Title */}
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              {mode === 'LOGIN' ? 'Sign In to Your Account' : 'Create an Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'LOGIN'
                ? 'Enter your credentials to access your portal.'
                : 'Join now to place your daily tiffin orders with custom thalis.'}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-slate-200/70 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                mode === 'LOGIN'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('SIGNUP');
                setError(null);
                setSuccessMsg(null);
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition flex items-center justify-center space-x-1.5 ${
                mode === 'SIGNUP'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Sign Up (New User)</span>
            </button>
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-center space-x-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form Area */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50">
            {mode === 'LOGIN' ? (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      name="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* Sign Up Form */
              <form className="space-y-3.5" onSubmit={handleSignup} autoComplete="off">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      name="fullname"
                      autoComplete="off"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      name="signup_email"
                      autoComplete="off"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. rahul@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      name="signup_pwd"
                      autoComplete="new-password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      name="signup_phone"
                      autoComplete="off"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-500/20 flex items-center justify-center space-x-2 transition disabled:opacity-50"
                >
                  <span>{loading ? 'Creating Account...' : 'Sign Up & Start Ordering'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};