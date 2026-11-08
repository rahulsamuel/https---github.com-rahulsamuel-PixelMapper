'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { VerifyEmailPanel } from '@/components/auth/verify-email-panel';
import { Logo } from '@/components/logo';
import { useAuth } from '@/contexts/auth-context';
import { emailField } from '@/lib/validation/fields';

export default function VerifyEmailPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('email');
    const parsed = emailField.safeParse(raw ?? '');
    setEmail(parsed.success ? parsed.data : null);
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace('/app');
  }, [user, loading, router]);

  if (loading || user) return null;

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

          <VerifyEmailPanel email={email} />
        </div>
      </div>
    </div>
  );
}
