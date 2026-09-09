'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { comboService } from '@/services/api';
import { ComboPackage } from '@/types';
import {
  Utensils, ChefHat, Sparkles, ArrowRight, CheckCircle, ShieldCheck,
  Clock, HeartHandshake, Star, PackageCheck, Phone, Mail, MapPin,
  ChevronDown, Flame, Salad, Truck, Receipt, Award, Zap, Check, Menu, X, Play
} from 'lucide-react';
import Loader from '@/components/Loader';

export default function PublicHomePage() {
  const { user, isAdmin } = useAuth();
  const [combos, setCombos] = useState<ComboPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'FULL' | 'HALF'>('ALL');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const yPos = useTransform(scrollYProgress, [0, 1], [0, -100]);

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
    { q: 'How does daily tiffin ordering work?', a: 'Simply sign up, choose your Thali, pick a date, and confirm! Our kitchen prepares it fresh and delivers it hot.' },
    { q: 'What are the delivery timings?', a: 'Lunch is delivered between 12:00 PM - 02:30 PM. Dinner is delivered between 07:30 PM - 09:30 PM daily.' },
    { q: 'Is the food hygienic?', a: 'Yes! We use pure desi ghee, fresh vegetables daily, high-grade spices, and zero reused cooking oil.' },
    { q: 'How do payments work?', a: 'Pay instantly via UPI, Card, or Cash. Your account maintains a digital ledger for easy tracking.' },
    { q: 'Can I request custom dietary preferences?', a: 'Yes! Enter special instructions (e.g. less spicy, no onion-garlic) when placing your request.' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden">
      
      {/* 3D Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }} transition={{ duration: 20, repeat: Infinity }} className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] bg-emerald-600/20 rounded-full blur-[120px]" />
        <motion.div animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }} transition={{ duration: 25, repeat: Infinity }} className="absolute top-[40%] -right-[10%] w-[40vw] h-[40vw] bg-teal-600/20 rounded-full blur-[120px]" />
      </div>

      {/* 1. Animated Sticky Glass Navbar */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-slate-800/80 transition-all shadow-lg shadow-black/40"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 border border-emerald-400/50"
            >
              <Utensils className="w-5 h-5 sm:w-6 sm:h-6 drop-shadow-md" />
            </motion.div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl sm:text-2xl text-white tracking-tight group-hover:text-emerald-400 transition">
                  Tiffin<span className="text-emerald-400">System</span>
                </span>
              </div>
              <div className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-widest opacity-80">Premium Meals</div>
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-8 text-sm font-bold text-slate-300">
            <a href="#combos" className="hover:text-emerald-400 transition hover:-translate-y-0.5 transform">Menu</a>
            <a href="#experience" className="hover:text-emerald-400 transition hover:-translate-y-0.5 transform">Quality</a>
            <a href="#how-it-works" className="hover:text-emerald-400 transition hover:-translate-y-0.5 transform">How It Works</a>
            <a href="#reviews" className="hover:text-emerald-400 transition hover:-translate-y-0.5 transform">Reviews</a>
          </div>

          <div className="hidden sm:flex items-center space-x-4">
            {user ? (
              <Link
                href={isAdmin ? '/admin' : '/user'}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 text-white rounded-xl text-sm font-black shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition transform hover:scale-105 border border-emerald-400/30"
              >
                <span>Portal ({user.fullName.split(' ')[0]})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link href="/login" className="px-4 py-2 text-sm font-bold text-slate-300 hover:text-white transition">Sign In</Link>
                <Link
                  href="/login"
                  className="px-6 py-2.5 bg-white text-emerald-900 rounded-xl text-sm font-black shadow-xl shadow-white/10 flex items-center space-x-2 transition transform hover:scale-105 border border-white"
                >
                  <span>Order Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-300">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </motion.nav>

      {/* 2. Hero Section with 3D elements & Animations */}
      <section className="relative z-10 pt-16 pb-24 lg:pt-28 lg:pb-36 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="lg:col-span-6 space-y-8 text-center lg:text-left z-20"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-full bg-slate-900/80 border border-emerald-500/30 text-emerald-400 text-xs font-black shadow-2xl backdrop-blur-md"
              >
                <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                <span>100% Pure Desi Ghee & Fresh Cooking</span>
              </motion.div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-[1.05]">
                Taste The <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 drop-shadow-lg">
                  Magic Of Home
                </span>
                <br />
                Delivered Hot.
              </h1>

              <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
                Experience piping hot phulkas, rich paneer butter masala, and homestyle dal directly to your doorstep. Zero hassle, zero cleanup, pure joy.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5 pt-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-full text-base font-black shadow-[0_0_30px_-5px_rgba(16,185,129,0.4)] flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-1"
                >
                  <Utensils className="w-5 h-5" />
                  <span>Start Your Subscription</span>
                </Link>

                <a
                  href="#experience"
                  className="w-full sm:w-auto px-8 py-4 bg-transparent border-2 border-slate-700 hover:border-emerald-400 hover:text-emerald-400 text-white rounded-full text-base font-bold flex items-center justify-center space-x-2.5 transition-all transform hover:-translate-y-1"
                >
                  <Play className="w-5 h-5" />
                  <span>Watch Video</span>
                </a>
              </div>
            </motion.div>

            {/* Right Side Visuals (Images & Cards) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-6 relative z-20"
            >
              <div className="relative w-full h-[500px] flex items-center justify-center">
                {/* Decorative Elements */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-emerald-500/20 rounded-full blur-[100px] -z-10 animate-pulse" />
                
                {/* Main Image Plate */}
                <motion.div
                  animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative z-20 w-72 h-72 sm:w-96 sm:h-96 rounded-full overflow-hidden border-4 border-slate-800 shadow-2xl shadow-black/80 ring-4 ring-emerald-500/30"
                >
                  <img 
                    src="https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=800&auto=format&fit=crop" 
                    alt="Delicious Indian Thali" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-6">
                    <span className="text-white font-black text-xl tracking-wide drop-shadow-md">Chef's Special Thali</span>
                  </div>
                </motion.div>

                {/* Floating Cards */}
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  className="absolute top-10 -left-6 sm:left-4 z-30 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl flex items-center space-x-4"
                >
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">On-Time Delivery</p>
                    <p className="text-sm text-white font-black">Hot & Fresh Always</p>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                  className="absolute bottom-12 -right-6 sm:right-0 z-30 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl flex items-center space-x-3"
                >
                  <div className="flex -space-x-2">
                    <img src="https://i.pravatar.cc/100?img=1" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User"/>
                    <img src="https://i.pravatar.cc/100?img=2" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User"/>
                    <img src="https://i.pravatar.cc/100?img=3" className="w-10 h-10 rounded-full border-2 border-slate-900" alt="User"/>
                  </div>
                  <div>
                    <div className="flex items-center text-amber-400 text-xs"><Star className="w-3 h-3 fill-amber-400"/> 4.9</div>
                    <p className="text-xs text-white font-bold">500+ Happy Diners</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. Live Combos Menu */}
      <section id="combos" className="relative z-20 py-24 bg-slate-950 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
              Explore Our <span className="text-emerald-400">Daily Menu</span>
            </h2>
            <p className="text-sm sm:text-base text-slate-400">Choose from our carefully curated healthy thalis and combos.</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="flex p-1.5 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner">
              {(['ALL', 'FULL', 'HALF'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
                    activeTab === tab
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'ALL' ? 'All Packages' : tab === 'FULL' ? 'Full Thali' : 'Half Thali'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-16"><Loader text="Loading fresh kitchen menu..." /></div>
          ) : (
            <motion.div layout className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
              <AnimatePresence>
                {filteredCombos.map((combo) => (
                  <motion.div
                    key={combo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="group w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm rounded-[2.5rem] bg-gradient-to-b from-slate-800 to-slate-900 p-1 shadow-2xl hover:shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)] flex flex-col justify-between overflow-hidden relative transition-all"
                  >
                    <div className="bg-slate-950 rounded-[2.3rem] p-6 sm:p-8 h-full flex flex-col justify-between relative overflow-hidden">
                      {/* Decorative Background Glowing Blob */}
                      <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/20 rounded-full blur-[60px] group-hover:bg-emerald-500/30 transition-colors duration-500 -z-0" />
                      
                      <div className="space-y-6 relative z-10">
                        {/* Centered Price & Badge */}
                        <div className="text-center space-y-4 pt-2">
                          <span className="inline-block px-4 py-1.5 rounded-full text-[10px] uppercase tracking-widest font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm">
                            {combo.tiffinType} PACKAGE
                          </span>
                          <div className="text-5xl font-black text-white drop-shadow-md flex items-end justify-center">
                            <span className="text-2xl text-slate-400 mr-1 pb-1">₹</span>
                            {Number(combo.price).toFixed(0)}
                            <span className="text-base text-slate-500 font-bold ml-1 pb-1 tracking-normal">/meal</span>
                          </div>
                        </div>
                        
                        {/* Title & Description */}
                        <div className="text-center border-t border-slate-800/80 pt-6">
                          <h3 className="text-2xl font-black text-white group-hover:text-emerald-400 transition-colors">{combo.name}</h3>
                          {combo.description && (
                            <p className="text-sm text-slate-400 mt-2.5 leading-relaxed px-2">
                              {combo.description}
                            </p>
                          )}
                        </div>

                        {/* Beautiful List of Included Items */}
                        <div className="space-y-2.5 pt-4">
                          {combo.includedItems?.map((dish, idx) => (
                            <div key={idx} className="flex items-center space-x-3 text-sm text-slate-200 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/60 group-hover:border-slate-700 transition-colors">
                              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                              </div>
                              <span className="font-bold">{dish}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Link href="/login" className="mt-8 relative z-10 w-full py-4 bg-slate-800 group-hover:bg-emerald-500 text-white group-hover:text-slate-950 rounded-2xl text-sm font-black flex items-center justify-center space-x-2 transition-all shadow-lg hover:shadow-xl">
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

      {/* 4. Photo Gallery / Banner Grid */}
      <section className="py-12 bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <img src="https://images.unsplash.com/photo-1546833999-b9f581a1996d?q=80&w=600&auto=format&fit=crop" className="rounded-3xl h-48 w-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" alt="Food 1" />
             <img src="https://images.unsplash.com/photo-1617692855027-33b14f061079?q=80&w=600&auto=format&fit=crop" className="rounded-3xl h-48 w-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" alt="Food 2" />
             <img src="https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?q=80&w=600&auto=format&fit=crop" className="rounded-3xl h-48 w-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" alt="Food 3" />
             <img src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=600&auto=format&fit=crop" className="rounded-3xl h-48 w-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer" alt="Food 4" />
           </div>
        </div>
      </section>

      {/* 5. Features Grid */}
      <section id="how-it-works" className="relative z-10 py-24 bg-slate-900 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">Why Choose Us?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Salad, title: '100% Pure & Fresh', desc: 'No stale ingredients. We cook every morning and evening with fresh farm vegetables and pure desi ghee.' },
              { icon: Clock, title: 'Punctual Delivery', desc: 'Never skip a meal or wait. Hot food is dispatched on precise schedules straight to your address.' },
              { icon: Receipt, title: 'Digital Ledger & Invoices', desc: 'Track your consumption online. Easily download PDF GST invoices for your corporate reimbursements.' }
            ].map((f, i) => (
              <motion.div key={i} whileHover={{ y: -8 }} className="bg-slate-950 p-8 rounded-[2rem] border border-slate-800 text-center space-y-4 hover:border-emerald-500/40 transition-colors">
                <div className="w-16 h-16 mx-auto bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                  <f.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. High-Converting Animated CTA Banner */}
      <section className="relative z-10 py-24 bg-gradient-to-r from-emerald-600 to-teal-500 text-white overflow-hidden shadow-2xl">
        <div className="max-w-5xl mx-auto px-4 text-center space-y-8 relative z-10">
          <h2 className="text-4xl sm:text-6xl font-black tracking-tight drop-shadow-lg">
            Craving Good Food?
          </h2>
          <p className="text-lg sm:text-xl text-emerald-100 max-w-2xl mx-auto font-bold">
            Join 500+ others and upgrade your daily meals today.
          </p>
          <Link href="/login" className="inline-flex px-10 py-5 bg-white text-emerald-900 rounded-full text-lg font-black shadow-2xl transition transform hover:scale-105 hover:shadow-black/30 items-center space-x-3">
            <span>Order Your First Tiffin</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-950 text-slate-400 text-xs py-14 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="space-y-3.5">
            <div className="flex items-center space-x-2 text-white font-black text-lg">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
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
              <li><a href="#combos" className="hover:text-emerald-400 transition">Menu & Daily Combos</a></li>
              <li><a href="#experience" className="hover:text-emerald-400 transition">The Food Experience</a></li>
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition">How It Works</a></li>
              <li><a href="#reviews" className="hover:text-emerald-400 transition">Customer Reviews</a></li>
              <li><a href="#faq" className="hover:text-emerald-400 transition">FAQ</a></li>
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
                <span className="text-emerald-400 font-bold">Monday to Sunday</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2.5">
            <div className="font-bold text-white text-xs uppercase tracking-wider">Kitchen & Support</div>
            <ul className="space-y-2 text-[11px]">
              <li className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">shivamstm01@gmail.com</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">+91 9876543210</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
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