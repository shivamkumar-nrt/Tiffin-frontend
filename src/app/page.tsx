'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { comboService } from '@/services/api';
import { ComboPackage } from '@/types';
import {
  Utensils,
  ChefHat,
  Sparkles,
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Clock,
  HeartHandshake,
  Star,
  PackageCheck,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  Flame,
  Salad,
  Truck,
  Receipt,
  ThumbsUp,
  Award,
  Zap,
  Check,
  Menu,
  X
} from 'lucide-react';

export default function PublicHomePage() {
  const { user, isAdmin } = useAuth();
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FULL' | 'HALF'>('ALL');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await comboService.getActiveCombos();
        if (res.success && res.data) {
          setCombos(res.data);
        }
      } catch (err) {
        console.error('Failed to load combos', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCombos();
  }, []);

  const filteredCombos = combos.filter((c) => {
    if (activeTab === 'ALL') return true;
    return c.tiffinType === activeTab;
  });

  const faqs = [
    {
      q: 'How does daily tiffin ordering work?',
      a: 'Simply sign up or login, choose your desired Thali or Combo package, select your delivery date, and confirm! Our kitchen prepares it fresh and delivers it hot to your doorstep.'
    },
    {
      q: 'What are the delivery timings for Lunch & Dinner?',
      a: 'Lunch is delivered hot between 12:00 PM and 02:30 PM. Dinner is delivered between 07:30 PM and 09:30 PM every day.'
    },
    {
      q: 'Is the food hygienic and cooked with pure ingredients?',
      a: 'Yes! We use 100% pure desi ghee, fresh daily vegetables, high-grade spices, and zero reused cooking oil or artificial food colors.'
    },
    {
      q: 'How do payments and invoices work?',
      a: 'You can pay instantly via UPI, QR code, Card, or Cash. Your account maintains a digital ledger, and you can download official GST/tax PDF invoices in 1 click anytime.'
    },
    {
      q: 'Can I request custom dietary preferences?',
      a: 'Yes! While placing your daily tiffin request, you can enter special instructions (e.g. less spicy, extra rotis, no onion-garlic).'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      {/* Dynamic Background Glowing Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            x: [0, 60, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-[140px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/3 -right-40 w-[550px] h-[550px] bg-amber-500/15 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 40, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] bg-rose-600/10 rounded-full blur-[140px]"
        />
      </div>

      {/* 1. Animated Sticky Glass Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 transition-all shadow-lg shadow-black/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between">
          {/* Logo with Animated Badge */}
          <Link href="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-orange-500/30"
            >
              <Utensils className="w-5 h-5" />
            </motion.div>
            <div>
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-black text-lg sm:text-xl text-white tracking-tight group-hover:text-orange-400 transition">
                  Tiffin<span className="text-orange-500">System</span>
                </span>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-extrabold bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-full animate-pulse">
                  <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                  <span>Fresh & Hot</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">Home-Style Kitchen Service</p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-8 text-xs font-semibold text-slate-300">
            <a href="#combos" className="hover:text-orange-400 transition-colors">Menu & Thalis</a>
            <a href="#experience" className="hover:text-orange-400 transition-colors">The Experience</a>
            <a href="#how-it-works" className="hover:text-orange-400 transition-colors">How It Works</a>
            <a href="#reviews" className="hover:text-orange-400 transition-colors">Reviews</a>
            <a href="#faq" className="hover:text-orange-400 transition-colors">FAQ</a>
          </div>

          {/* Action Buttons & Mobile Hamburger */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {user ? (
              <Link
                href={isAdmin ? '/admin' : '/user'}
                className="px-3.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center space-x-1.5 sm:space-x-2 transition transform hover:-translate-y-0.5"
              >
                <span>{isAdmin ? 'Admin' : 'Portal'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden xs:inline-block px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-slate-300 hover:text-white transition rounded-xl hover:bg-slate-800/60"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="relative group overflow-hidden px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 transition transform hover:-translate-y-0.5 flex items-center space-x-1.5"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-slate-950/95 border-t border-slate-800 px-5 py-4 space-y-3 backdrop-blur-2xl">
            <div className="space-y-2 text-xs font-semibold text-slate-300">
              <a
                href="#combos"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-slate-900 hover:text-orange-400 transition"
              >
                🍲 Menu & Thalis
              </a>
              <a
                href="#experience"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-slate-900 hover:text-orange-400 transition"
              >
                ✨ The Experience
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-slate-900 hover:text-orange-400 transition"
              >
                ⏱️ How It Works
              </a>
              <a
                href="#reviews"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-slate-900 hover:text-orange-400 transition"
              >
                ⭐ Customer Reviews
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-3 rounded-lg hover:bg-slate-900 hover:text-orange-400 transition"
              >
                ❓ Frequently Asked Questions
              </a>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center space-x-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 bg-slate-900 text-center text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex-1 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-center text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}
      </motion.nav>

      {/* 2. High-Impact Animated Hero Section */}
      <section className="relative z-10 pt-12 pb-24 lg:pt-20 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-7 space-y-7 text-center lg:text-left"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold shadow-inner"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                <span>100% Pure Desi Ghee & Fresh Home-Cooked Meals</span>
              </motion.div>

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
                Wholesome Home Food <br />
                <span className="bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-sm">
                  Delivered Hot & Fresh
                </span> <br />
                To Your Doorstep.
              </h1>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Craving that comforting taste of ghar ka khana? Enjoy piping hot soft phulkas, royal paneer butter masala, slow-simmered dal tadka, jeera basmati rice & sweet desserts every single day!
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-white rounded-2xl text-sm font-extrabold shadow-xl shadow-orange-600/30 flex items-center justify-center space-x-2.5 transition transform hover:-translate-y-1 hover:shadow-2xl"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Start Daily Tiffin Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#combos"
                  className="w-full sm:w-auto px-7 py-4 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white rounded-2xl text-sm font-bold shadow-md flex items-center justify-center space-x-2 transition backdrop-blur-md"
                >
                  <PackageCheck className="w-4 h-4 text-orange-400" />
                  <span>Explore Menu & Rates</span>
                </a>
              </div>

              {/* Trust Metric Badges */}
              <div className="pt-8 border-t border-slate-800/80 grid grid-cols-3 gap-6 text-center lg:text-left max-w-lg mx-auto lg:mx-0">
                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-white">500+</div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-center lg:justify-start space-x-1">
                    <CheckCircle className="w-3 h-3 text-emerald-400" />
                    <span>Daily Diners</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-amber-400">4.9 ★</div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-center lg:justify-start space-x-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>Top Rated</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">100%</div>
                  <div className="text-[11px] text-slate-400 font-medium flex items-center justify-center lg:justify-start space-x-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Pure Veg / Fresh</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Animated Bento Card Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-5 relative"
            >
              {/* Floating Live Delivery Tracker Pill */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-6 -left-6 z-20 hidden sm:flex items-center space-x-2.5 bg-slate-900/95 border border-slate-700/80 px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl"
              >
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-bold text-white">Live Kitchen: Cooking Batch #4</span>
              </motion.div>

              {/* Floating Rating Pill */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-6 -right-6 z-20 hidden sm:flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white px-4 py-2.5 rounded-2xl shadow-2xl backdrop-blur-xl"
              >
                <Star className="w-4 h-4 fill-white" />
                <span className="text-xs font-black">4.9/5 Average Taste Rating</span>
              </motion.div>

              {/* Main Bento Card */}
              <div className="relative rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 border border-slate-700/80 shadow-2xl shadow-black/80 backdrop-blur-xl">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center font-bold">
                      <ChefHat className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Chef&apos;s Royal Executive Thali</h4>
                      <p className="text-[11px] text-emerald-400 font-semibold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                        <span>Prepared fresh every morning & evening</span>
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-lg text-xs font-black">
                    Popular
                  </span>
                </div>

                {/* Interactive Items List */}
                <div className="py-4 space-y-2.5">
                  {[
                    { name: 'Shahi Paneer Butter Masala', tag: 'Main Dish', icon: '🍛' },
                    { name: 'Slow-Simmered Dal Makhani', tag: 'Lentils', icon: '🍲' },
                    { name: '4 Hot Ghee Phulka Rotis', tag: 'Breads', icon: '🫓' },
                    { name: 'Fragrant Jeera Basmati Rice', tag: 'Rice', icon: '🍚' },
                    { name: 'Hot Gulab Jamun & Fresh Salad', tag: 'Sweet & Sides', icon: '🍮' },
                  ].map((dish, idx) => (
                    <motion.div
                      key={idx}
                      whileHover={{ x: 6, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 transition-colors"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="text-base">{dish.icon}</span>
                        <span className="text-xs font-semibold text-slate-200">{dish.name}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-700/60 text-slate-400">
                        {dish.tag}
                      </span>
                    </motion.div>
                  ))}
                </div>

                {/* Card Footer CTA */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Starting From</div>
                    <div className="text-xl font-black text-orange-400">Rs. 80.00 / Meal</div>
                  </div>

                  <Link
                    href="/login"
                    className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 flex items-center space-x-1.5 transition transform hover:scale-105"
                  >
                    <span>Order Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Live Combos & Daily Thalis Showcase */}
      <section id="combos" className="relative z-10 py-20 bg-slate-900/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header & Tabs */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Daily Menu Catalog</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Our Popular Combos & Thalis
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Choose your desired meal size. Every combo is packed hot in insulated containers and delivered on schedule.
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center p-1.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 self-start md:self-auto">
              {(['ALL', 'FULL', 'HALF'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All Packages' : tab === 'FULL' ? 'Full Thali (4 Roti)' : 'Half Thali (2 Roti)'}
                </button>
              ))}
            </div>
          </div>

          {/* Combos Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-orange-500 border-t-transparent"></div>
              <p className="text-xs text-slate-400 mt-3">Loading fresh kitchen menu...</p>
            </div>
          ) : filteredCombos.length > 0 ? (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7"
            >
              <AnimatePresence>
                {filteredCombos.map((combo) => (
                  <motion.div
                    key={combo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -8 }}
                    transition={{ duration: 0.3 }}
                    className="group relative rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 p-6 sm:p-7 border border-slate-800 hover:border-orange-500/60 shadow-xl hover:shadow-2xl hover:shadow-orange-500/10 flex flex-col justify-between transition-all"
                  >
                    <div className="space-y-5">
                      {/* Top Header */}
                      <div className="flex justify-between items-start">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                          combo.tiffinType === 'FULL'
                            ? 'bg-orange-500/20 border border-orange-500/40 text-orange-300'
                            : 'bg-blue-500/20 border border-blue-500/40 text-blue-300'
                        }`}>
                          {combo.tiffinType === 'FULL' ? 'Full Thali Combo' : 'Half Thali Meal'}
                        </span>

                        <div className="text-2xl font-black text-orange-400">
                          Rs. {Number(combo.price).toFixed(2)}
                        </div>
                      </div>

                      {/* Name & Desc */}
                      <div>
                        <h3 className="text-lg font-black text-white group-hover:text-orange-400 transition">
                          {combo.name}
                        </h3>
                        {combo.description && (
                          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                            {combo.description}
                          </p>
                        )}
                      </div>

                      {/* Included Items Checklist */}
                      <div className="pt-4 border-t border-slate-800/80">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                          Included In This Package ({combo.includedItems?.length || 0}):
                        </div>
                        <div className="space-y-2">
                          {combo.includedItems?.map((dish, idx) => (
                            <div key={idx} className="flex items-center space-x-2.5 text-xs text-slate-300">
                              <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center flex-shrink-0">
                                <Check className="w-2.5 h-2.5 stroke-[3]" />
                              </div>
                              <span className="font-medium">{dish}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-8 pt-4 border-t border-slate-800/80">
                      <Link
                        href="/login"
                        className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20 flex items-center justify-center space-x-2 transition transform hover:scale-[1.02]"
                      >
                        <span>Select & Order This Thali</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="py-16 text-center bg-slate-900/40 rounded-3xl border border-dashed border-slate-800">
              <ChefHat className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Kitchen is preparing new exciting combos. Please check back shortly!</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. Experience & Quality Highlights (Bento Grid) */}
      <section id="experience" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold">
              <Award className="w-3.5 h-3.5" />
              <span>Premium Quality Promise</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Crafted With Passion & Pure Ingredients
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              We treat your daily meals with the same care, hygiene, and love as your family at home.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -6 }}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-orange-500/50 space-y-3 backdrop-blur-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center text-2xl">
                🍲
              </div>
              <h3 className="text-base font-extrabold text-white">100% Pure Desi Ghee</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rotis are topped with genuine desi ghee and curries prepared with fresh cold-pressed oil. Light on stomach every single day.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 space-y-3 backdrop-blur-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl">
                🔒
              </div>
              <h3 className="text-base font-extrabold text-white">Locked Price Snapshot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The combo price at the moment you order is locked permanently into your ledger. Never worry about retroactive price increases.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6 }}
              className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 space-y-3 backdrop-blur-md"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl">
                📱
              </div>
              <h3 className="text-base font-extrabold text-white">Digital Self-Service Portal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Easily place requests, check running balances, make flexible payments, and download official PDF tax invoices with 1 click.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 5. How It Works (3 Animated Steps) */}
      <section id="how-it-works" className="relative z-10 py-20 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Effortless 3-Step Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              How TiffinSystem Delivers Your Meal
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Zero hassle, completely digital, and reliably punctual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4 text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-orange-500/30">
                1
              </div>
              <h3 className="text-base font-extrabold text-white">1. Select Combo & Date</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sign up in seconds, pick your favorite Thali combo, and add any special dietary instructions for our chef.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4 text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/30">
                2
              </div>
              <h3 className="text-base font-extrabold text-white">2. Fresh Kitchen Cooking</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our chefs cook fresh using wholesome ingredients, pack everything in insulated hot containers, and deliver promptly.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl space-y-4 text-center relative overflow-hidden"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                3
              </div>
              <h3 className="text-base font-extrabold text-white">3. Easy Pay & Tax Invoices</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Review your digital statement, pay online or cash, and download official PDF tax invoices anytime for tax or reimbursement.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Customer Testimonials */}
      <section id="reviews" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold">
              <Star className="w-3.5 h-3.5 fill-yellow-400" />
              <span>Real Customer Stories</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Loved By Professionals & Families
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              See why hundreds of regular customers trust us for their daily lunch and dinner.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              {
                name: 'Vivek Kumar',
                role: 'Software Engineer',
                text: 'The food tastes exactly like home! Soft rotis with desi ghee, fresh sabji, and dal tadka. Best tiffin service I have ever subscribed to.',
                rating: 5,
              },
              {
                name: 'Pooja Sharma',
                role: 'Bank Branch Manager',
                text: 'The online portal and 1-click PDF invoice downloads make company reimbursement super simple. Completely transparent and punctual delivery.',
                rating: 5,
              },
              {
                name: 'Ankit Verma',
                role: 'Marketing Executive',
                text: 'Very hygienic packaging and always steaming hot when it reaches my office. The Executive Deluxe Thali is an absolute weekend delight!',
                rating: 5,
              },
            ].map((review, idx) => (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                className="bg-slate-900/80 p-7 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex text-amber-400 space-x-1">
                    {Array.from({ length: review.rating }).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-800 flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-bold text-xs flex items-center justify-center">
                    {review.name[0]}
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-white">{review.name}</div>
                    <div className="text-[10px] text-slate-400">{review.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Interactive FAQ Section */}
      <section id="faq" className="relative z-10 py-20 bg-slate-900/60 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Got questions? We have answers.
            </p>
          </div>

          <div className="space-y-3.5">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-orange-400 transition"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                      openFaq === idx ? 'transform rotate-180 text-orange-400' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. High-Converting Animated CTA Banner */}
      <section className="relative z-10 py-20 bg-gradient-to-r from-orange-600 via-amber-600 to-amber-500 text-white overflow-hidden shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-6 relative z-10">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight drop-shadow-md">
              Ready For Wholesome Home Meals Every Day?
            </h2>
            <p className="text-sm sm:text-base text-orange-100 max-w-2xl mx-auto font-medium">
              Create your account in 10 seconds, choose your favorite thali, and start enjoying healthy homemade food right away.
            </p>
          </motion.div>

          <div className="flex items-center justify-center space-x-4 pt-2">
            <Link
              href="/login"
              className="px-8 py-4 bg-slate-950 hover:bg-slate-900 text-white rounded-2xl text-sm font-black shadow-2xl transition transform hover:-translate-y-1 hover:shadow-black/50 flex items-center space-x-2"
            >
              <span>Get Started Now • Sign Up</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 9. Modern Dark Footer */}
      <footer className="relative z-10 bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2 text-white font-black text-lg">
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white">
                <Utensils className="w-4 h-4" />
              </div>
              <span>TiffinSystem</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Wholesome home-cooked daily meals with digital self-service ordering, running ledger statements & instant PDF tax invoices.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Quick Navigation</div>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#combos" className="hover:text-orange-400 transition">Menu & Daily Combos</a></li>
              <li><a href="#experience" className="hover:text-orange-400 transition">The Food Experience</a></li>
              <li><a href="#how-it-works" className="hover:text-orange-400 transition">How It Works</a></li>
              <li><a href="#reviews" className="hover:text-orange-400 transition">Customer Reviews</a></li>
              <li><a href="#faq" className="hover:text-orange-400 transition">FAQ</a></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Meal & Delivery Timings</div>
            <ul className="space-y-2 text-[11px] text-slate-300">
              <li className="flex justify-between border-b border-slate-900 pb-1">
                <span>Lunch Delivery:</span>
                <span className="text-white font-bold">12:00 PM – 2:30 PM</span>
              </li>
              <li className="flex justify-between border-b border-slate-900 pb-1">
                <span>Dinner Delivery:</span>
                <span className="text-white font-bold">07:30 PM – 9:30 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Service Days:</span>
                <span className="text-orange-400 font-bold">Monday to Sunday</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Kitchen & Support</div>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-slate-300">shivamstm01@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-slate-300">+91 9876543210</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-orange-400" />
                <span className="text-slate-300">Daily Fast Doorstep Delivery</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-900 text-center text-[10px] text-slate-500">
          © {new Date().getFullYear()} TiffinSystem. All rights reserved. Crafted with ❤️ for healthy home-cooked food.
        </div>
      </footer>
    </div>
  );
}