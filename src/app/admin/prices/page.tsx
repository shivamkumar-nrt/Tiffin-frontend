'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPricesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/combos');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
    </div>
  );
}