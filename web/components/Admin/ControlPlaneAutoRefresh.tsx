'use client';

import { useEffect, useRef } from 'react';

import { usePathname, useRouter } from 'next/navigation';

export default function ControlPlaneAutoRefresh() {
  const router = useRouter();
  const pathname = usePathname();
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pathname.startsWith('/admin/control')) return;

    const source = new EventSource('/api/v1/control/events');
    const scheduleRefresh = () => {
      if (refreshTimeoutRef.current) return;
      refreshTimeoutRef.current = setTimeout(() => {
        refreshTimeoutRef.current = null;
        router.refresh();
      }, 300);
    };

    source.addEventListener('roomct', scheduleRefresh);
    source.addEventListener('joinleft', scheduleRefresh);
    source.addEventListener('statuschange', scheduleRefresh);

    return () => {
      source.close();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [pathname, router]);

  return null;
}
