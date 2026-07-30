'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PivotRedirect() {
  const router = useRouter();

  useEffect(() => {
    // This page is now merged into Analysis (/insights)
    router.replace('/insights');
  }, [router]);

  return null;
}
