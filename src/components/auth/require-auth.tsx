'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

export function RequireAuth({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const allowed = !!user && (!adminOnly || isAdmin);

  useEffect(() => {
    if (loading || allowed) return;
    if (!user) {
      const next = window.location.pathname + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    } else {
      router.replace('/app');
    }
  }, [loading, allowed, user, router]);

  if (loading || !allowed) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
