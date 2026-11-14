'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MOBILE_BREAKPOINT } from '@/hooks/use-mobile';

export const SMALL_SCREEN_NOTICE_KEY = 'small-screen-notice';

export function SmallScreenGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setAllowed(true);
        return;
      }
      setAllowed(false);
      sessionStorage.setItem(SMALL_SCREEN_NOTICE_KEY, '1');
      router.replace('/');
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [router]);

  if (!allowed) return null;
  return <>{children}</>;
}
