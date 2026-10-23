'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { comboService } from '@/services/api';
import { ComboPackage } from '@/types';
import {
  Utensils, ArrowRight, Star, Phone, Mail, MapPin, Flame, Salad, Truck,
  Receipt, Clock, Check, Menu, X, Sparkles,
} from 'lucide-react';
import Loader from '@/components/Loader';
import { GoldenThali } from '@/components/three';

const glass = 'bg-ink-900/60 backdrop-blur-xl border border-gold-500/25 shadow-xl shadow-black/40';

export default function PublicHomePage() {
  const { user, isAdmin } = useAuth();
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FULL' | 'HALF'>('ALL');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await comboService.getActiveCombos();
        if (res.success && res.data) setCombos(res.data);
      } catch (err) {
        console.error('Failed to load combos', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filteredCombos = combos.filter((c) => activeTab === 'ALL' || c.tiffinType === activeTab);

  return (
    <div className="min-h-screen text-stone-800 selection:bg-gold-300 selection:text-ink-950 overflow-x-hidden">
      {/* Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-50 bg-ink-900/65 backdrop-blur-2xl border-b border-gold-200/70 shadow-sm shadow-gold-500/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 12, scale: 1.08 }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-gold-500 via-gold-400 to-gold-300 flex items-center justify-center text-white shadow-lg shadow-gold-500/40 border border-white/60"
            >
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow" />
            </motion.div>
            <div>
              <span className="font-display font-extrabold text-xl sm:text-2xl text-gold-900 tracking-tight">
                Tiffin<span className="text-gold-600">System</span>
              </span>
              <div className="text-[10px] sm:text-xs text-gold-700/80 font-bold uppercase tracking-widest">Ghar Jaisa Khana</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-stone-600">
            {[['#combos', 'Menu'], ['#experience', 'Gallery'], ['#how-it-works', 'Why Us']].map(([h, t]) => (
              <a key={h} href={h} className="hover:text-gold-700 transition hover:-translate-y-0.5 transform">{t}</a>
            ))}
          </div>

          <div className="hidden sm:flex items-center space-x-4">
            {user ? (
              <Link
                href={isAdmin ? '/admin' : '/user'}
                className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 rounded-xl text-sm font-extrabold shadow-lg shadow-gold-500/30 flex items-center space-x-2 transition transform hover:scale-105 border border-white/50"
              >
                <span>Portal ({user.fullName.split(' ')[0]})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-stone-600 hover:text-gold-800 transition">Sign In</Link>
                <Link
                  href="/login"
                  className="px-6 py-2.5 bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 rounded-xl text-sm font-extrabold shadow-lg shadow-gold-500/30 flex items-center space-x-2 transition transform hover:scale-105 border border-white/50"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-stone-700">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gold-200/70 bg-ink-900/90 backdrop-blur-xl px-4 py-4 space-y-3 text-sm font-bold text-stone-700">
            <a href="#combos" onClick={() => setMobileMenuOpen(false)} className="block">Menu</a>
            <a href="#experience" onClick={() => setMobileMenuOpen(false)} className="block">Gallery</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block">Why Us</a>
            <Link href={user ? (isAdmin ? '/admin' : '/user') : '/login'} className="block text-gold-700">
              {user ? 'Open Portal' : 'Sign In / Order Now'}
            </Link>
          </div>
        )}
      </motion.nav>

      {/* Hero */}
      <section className="relative z-10 pt-12 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-6 items-center">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-6 space-y-7 text-center lg:text-left z-20"
            >
              <div className={`inline-flex items-center space-x-2 px-5 py-2 rounded-full ${glass} text-gold-800 text-xs font-extrabold`}>
                <Flame className="w-4 h-4 text-gold-600 animate-pulse" />
                <span>100% Pure Desi Ghee & Fresh Cooking</span>
              </div>

              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gold-900 tracking-tight leading-[1.05]">
                Taste The <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-gold-600 via-gold-500 to-amber-500">
                  Magic Of Home
                </span>
                <br />
                Delivered Hot.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Piping hot phulkas, rich paneer butter masala and homestyle dal at your doorstep. Zero hassle, zero cleanup, pure joy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 rounded-full text-base font-extrabold shadow-[0_12px_30px_-8px_rgba(233,174,18,0.7)] flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-1 border border-white/60"
                >
                  <Utensils className="w-5 h-5" />
                  <span>Start Your Subscription</span>
                </Link>
                <a
                  href="#combos"
                  className={`w-full sm:w-auto px-8 py-4 ${glass} text-gold-800 rounded-full text-base font-bold flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-1`}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>See Today&apos;s Menu</span>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.2 }}
              className="lg:col-span-6 relative z-20"
            >
              <div className="relative w-full h-[360px] sm:h-[480px] lg:h-[540px]">
                <div className="absolute inset-0 m-auto w-[78%] h-[78%] rounded-full bg-gradient-to-tr from-gold-300/60 to-white/0 blur-3xl" />
                <GoldenThali />

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className={`absolute top-6 left-0 sm:left-4 z-30 ${glass} p-3 sm:p-4 rounded-2xl flex items-center space-x-3`}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gold-100 rounded-full flex items-center justify-center text-gold-700">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] text-stone-500 font-bold">On-Time Delivery</p>
                    <p className="text-sm text-gold-900 font-extrabold">Hot & Fresh Always</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  className={`absolute bottom-6 right-0 sm:right-2 z-30 ${glass} p-3 sm:p-4 rounded-2xl flex items-center space-x-3`}
                >
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((n) => (
                      <img key={n} src={`https://i.pravatar.cc/100?img=${n}`} className="w-9 h-9 rounded-full border-2 border-white" alt="Happy customer" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center text-gold-600 text-xs font-bold"><Star className="w-3 h-3 fill-gold-500 text-gold-500 mr-0.5" /> 4.9</div>
                    <p className="text-xs text-gold-900 font-extrabold">500+ Happy Diners</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="combos" className="relative z-20 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-gold-900 tracking-tight">
              Explore Our <span className="text-gold-600">Daily Menu</span>
            </h2>
            <p className="text-sm sm:text-base text-stone-600">Choose from our carefully curated healthy thalis and combos.</p>
          </div>

          <div className="flex justify-center">
            <div className={`flex p-1.5 rounded-2xl ${glass}`}>
              {(['ALL', 'FULL', 'HALF'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 sm:px-6 py-2.5 rounded-xl text-sm font-extrabold transition-all ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 shadow-md shadow-gold-500/40'
                      : 'text-stone-500 hover:text-gold-800'
                  }`}
                >
                  {tab === 'ALL' ? 'All Packages' : tab === 'FULL' ? 'Full Thali' : 'Half Thali'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16"><Loader text="Loading fresh kitchen menu..." /></div>
          ) : filteredCombos.length === 0 ? (
            <p className="text-center text-stone-500 py-10">Menu is being prepared. Please check back soon.</p>
          ) : (
            <motion.div layout className="flex flex-wrap justify-center gap-7 max-w-6xl mx-auto">
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
                    className="group w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm rounded-[2rem] bg-gradient-to-b from-gold-300 via-gold-200 to-ink-900 p-[2px] shadow-xl shadow-gold-500/15 hover:shadow-2xl hover:shadow-gold-500/30 transition-all"
                  >
                    <div className="bg-ink-900/90 backdrop-blur rounded-[calc(2rem-2px)] p-6 sm:p-7 h-full flex flex-col justify-between relative overflow-hidden">
                      <div className="absolute -top-20 -right-20 w-44 h-44 bg-gold-300/40 rounded-full blur-3xl group-hover:bg-gold-300/60 transition-colors duration-500" />
                      <div className="space-y-5 relative z-10">
                        <div className="text-center space-y-3">
                          <span className="inline-block px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-extrabold bg-gold-100 text-gold-800 border border-gold-300/70">
                            {combo.tiffinType} PACKAGE
                          </span>
                          <div className="font-display text-5xl font-extrabold text-gold-900 flex items-end justify-center">
                            <span className="text-2xl text-gold-600 mr-1 pb-1">₹</span>
                            {Number(combo.price).toFixed(0)}
                            <span className="text-base text-stone-400 font-bold ml-1 pb-1">/meal</span>
                          </div>
                        </div>
                        <div className="text-center border-t border-gold-200 pt-5">
                          <h3 className="font-display text-2xl font-bold text-gold-900">{combo.name}</h3>
                          {combo.description && <p className="text-sm text-stone-500 mt-2 leading-relaxed">{combo.description}</p>}
                        </div>
                        <div className="space-y-2">
                          {combo.includedItems?.map((dish, idx) => (
                            <div key={idx} className="flex items-center space-x-3 text-sm text-stone-700 bg-gold-50 p-2.5 rounded-xl border border-gold-100">
                              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-green-600 stroke-[3]" />
                              </div>
                              <span className="font-bold">{dish}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Link
                        href="/login"
                        className="mt-7 relative z-10 w-full py-3.5 bg-gradient-to-r from-gold-500 to-gold-400 text-ink-950 rounded-2xl text-sm font-extrabold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-gold-500/30 hover:shadow-xl hover:brightness-105"
                      >
                        <span>Order This Thali</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* Gallery */}
      <section id="experience" className="py-10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'photo-1546833999-b9f581a1996d',
              'photo-1617692855027-33b14f061079',
              'photo-1626777552726-4a6b54c97e46',
              'photo-1565557623262-b51c2513a641',
            ].map((id, i) => (
              <div key={id} className="overflow-hidden rounded-3xl border-4 border-white shadow-lg shadow-gold-500/20">
                <img
                  src={`https://images.unsplash.com/${id}?q=80&w=600&auto=format&fit=crop`}
                  className="h-44 sm:h-52 w-full object-cover hover:scale-110 transition-transform duration-700"
                  alt={`Delicious food ${i + 1}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section id="how-it-works" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <h2 className="text-center font-display text-4xl sm:text-5xl font-extrabold text-gold-900 tracking-tight">
            Why Choose <span className="text-gold-600">Us?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
            {[
              { icon: Salad, title: '100% Pure & Fresh', desc: 'No stale ingredients. We cook every morning and evening with fresh vegetables and pure desi ghee.' },
              { icon: Clock, title: 'Punctual Delivery', desc: 'Never skip a meal or wait. Hot food is dispatched on precise schedules straight to your address.' },
              { icon: Receipt, title: 'Digital Ledger & Invoices', desc: 'Track your consumption online and download PDF invoices for your reimbursements.' },
            ].map((f, i) => (
              <motion.div key={i} whileHover={{ y: -8 }} className={`${glass} p-8 rounded-[2rem] text-center space-y-4 hover:border-gold-400 transition-colors`}>
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-gold-200 to-gold-100 text-gold-700 rounded-2xl flex items-center justify-center shadow-inner">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="font-display text-xl font-bold text-gold-900">{f.title}</h3>
                <p className="text-sm text-stone-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 overflow-hidden bg-gradient-to-r from-gold-400 via-gold-300 to-amber-300">
        <div className="absolute -top-24 -left-16 w-72 h-72 rounded-full bg-ink-900/40 blur-3xl" />
        <div className="absolute -bottom-24 -right-10 w-80 h-80 rounded-full bg-gold-500/30 blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 text-center space-y-7 relative z-10">
          <h2 className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight text-ink-950">Craving Good Food?</h2>
          <p className="text-lg sm:text-xl text-ink-950/80 max-w-2xl mx-auto font-bold">
            Join 500+ others and upgrade your daily meals today.
          </p>
          <Link
            href="/login"
            className="inline-flex px-10 py-4 bg-ink-850 text-gold-900 rounded-full text-lg font-extrabold shadow-2xl shadow-gold-700/30 transition transform hover:scale-105 items-center space-x-3"
          >
            <span>Order Your First Tiffin</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-ink-900/70 backdrop-blur-xl text-stone-600 text-xs py-12 border-t border-gold-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-9">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-gold-900 font-display font-extrabold text-lg">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-gold-500 to-gold-300 flex items-center justify-center text-white shadow-md shadow-gold-500/30">
                <Utensils className="w-4 h-4" />
              </div>
              <span>TiffinSystem</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Wholesome home-cooked daily meals with digital ordering, running ledger statements and instant PDF invoices.
            </p>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-gold-900 text-xs uppercase tracking-wider">Quick Navigation</div>
            <ul className="space-y-2 text-[11px]">
              <li><a href="#combos" className="hover:text-gold-700 transition">Menu & Daily Combos</a></li>
              <li><a href="#experience" className="hover:text-gold-700 transition">Food Gallery</a></li>
              <li><a href="#how-it-works" className="hover:text-gold-700 transition">Why Choose Us</a></li>
              <li><Link href="/login" className="hover:text-gold-700 transition">Sign In / Sign Up</Link></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-gold-900 text-xs uppercase tracking-wider">Meal & Delivery Timings</div>
            <ul className="space-y-2 text-[11px]">
              <li className="flex justify-between border-b border-gold-100 pb-1"><span>Lunch Delivery:</span><span className="text-gold-900 font-bold">12:00 PM – 2:30 PM</span></li>
              <li className="flex justify-between border-b border-gold-100 pb-1"><span>Dinner Delivery:</span><span className="text-gold-900 font-bold">07:30 PM – 9:30 PM</span></li>
              <li className="flex justify-between"><span>Service Days:</span><span className="text-gold-700 font-bold">Monday to Sunday</span></li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-gold-900 text-xs uppercase tracking-wider">Kitchen & Support</div>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center space-x-2"><Mail className="w-3.5 h-3.5 text-gold-600" /><span>shivamstm01@gmail.com</span></li>
              <li className="flex items-center space-x-2"><Phone className="w-3.5 h-3.5 text-gold-600" /><span>+91 9876543210</span></li>
              <li className="flex items-center space-x-2"><MapPin className="w-3.5 h-3.5 text-gold-600" /><span>Daily Fast Doorstep Delivery</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10 pt-5 border-t border-gold-100 text-center text-[10px] text-stone-400">
          © {new Date().getFullYear()} TiffinSystem. All rights reserved. Crafted with ❤️ for healthy home-cooked food.
        </div>
      </footer>
    </div>
  );
}
