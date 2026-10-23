'use client';

import React from 'react';
import { motion } from 'framer-motion';

const MAIN =
  'https://images.unsplash.com/photo-1585937421612-70a008356fbe?q=80&w=900&auto=format&fit=crop';
const SIDE =
  'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?q=80&w=500&auto=format&fit=crop';

/**
 * Real food photography in a gold-ringed "plate": slow rotating dashed ring, soft golden halo,
 * floating motion and a smaller companion dish. Pure CSS/framer-motion, no WebGL needed.
 */
export const ThaliShowcase: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const main = compact ? 'w-52 h-52' : 'w-64 h-64 sm:w-80 sm:h-80 lg:w-[22rem] lg:h-[22rem]';
  const ring = compact ? 'w-64 h-64' : 'w-[19rem] h-[19rem] sm:w-[23rem] sm:h-[23rem] lg:w-[26rem] lg:h-[26rem]';
  const side = compact ? 'w-20 h-20 left-[calc(50%+3.5rem)] bottom-1' : 'w-24 h-24 sm:w-32 sm:h-32 left-2 sm:left-8 bottom-6';

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* golden halo */}
      <div className="absolute w-[85%] h-[85%] max-w-[30rem] max-h-[30rem] rounded-full bg-gradient-to-tr from-gold-500/35 via-gold-300/10 to-transparent blur-3xl" />

      {/* rotating dashed ring + counter-rotating thin ring */}
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
        className={`absolute ${ring} rounded-full border-2 border-dashed border-gold-400/50`}
      />
      <motion.div
        aria-hidden
        animate={{ rotate: -360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        className={`absolute ${compact ? 'w-60 h-60' : 'w-[18rem] h-[18rem] sm:w-[21.5rem] sm:h-[21.5rem] lg:w-[24rem] lg:h-[24rem]'} rounded-full border border-gold-300/30`}
      >
        <span className="absolute -top-1.5 left-1/2 w-3 h-3 -translate-x-1/2 rounded-full bg-gold-400 shadow-[0_0_14px_3px_rgba(248,198,48,0.7)]" />
      </motion.div>

      {/* main plate photo */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 1.5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className={`relative ${main} rounded-full p-[6px] bg-gradient-to-tr from-gold-500 via-gold-300 to-gold-600 shadow-[0_25px_80px_-15px_rgba(233,174,18,0.55)]`}
      >
        <div className="relative w-full h-full rounded-full overflow-hidden ring-4 ring-ink-950/80">
          <img
            src={MAIN}
            alt="Freshly cooked Indian thali with curries and rice"
            className="w-full h-full object-cover scale-110"
            loading="eager"
          />
          <div className="absolute inset-0 rounded-full bg-gradient-to-t from-ink-950/50 via-transparent to-gold-300/10" />
        </div>
      </motion.div>

      {/* companion dish */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        className={`absolute ${side} rounded-full p-[4px] bg-gradient-to-tr from-gold-600 via-gold-300 to-gold-500 shadow-xl shadow-black/50`}
      >
        <img src={SIDE} alt="Paneer butter masala" className="w-full h-full rounded-full object-cover ring-2 ring-ink-950/80" />
      </motion.div>
    </div>
  );
};

export default ThaliShowcase;
