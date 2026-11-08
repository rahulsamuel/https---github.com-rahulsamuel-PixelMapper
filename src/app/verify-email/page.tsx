'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { VerifyEmailPanel } from '@/components/auth/verify-email-panel';
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
    <AuthShell>
      <VerifyEmailPanel email={email} />
    </AuthShell>
  );
}
