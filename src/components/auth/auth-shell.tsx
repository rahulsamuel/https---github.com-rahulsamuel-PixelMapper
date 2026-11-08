import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100svh-3.5rem)] flex flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)] pointer-events-none" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center space-y-2">
            <Link href="/" className="inline-flex items-center justify-center group">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="text-sm text-muted-foreground">LED Design Studio</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
