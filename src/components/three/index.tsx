'use client';

import dynamic from 'next/dynamic';

// three.js is browser-only and heavy: load it lazily and never on the server.
export const GoldenBackdrop = dynamic(() => import('./GoldenBackdrop'), { ssr: false });
export const GoldenThali = dynamic(() => import('./GoldenThali'), { ssr: false });
