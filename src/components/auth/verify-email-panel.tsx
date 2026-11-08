'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function VerifyEmailPanel({ email }: { email: string | null }) {
  const [busy, setBusy] = useState<'check' | 'resend' | null>(null);
  const { toast } = useToast();

  const checkVerified = async () => {
    setBusy('check');
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        toast({ title: 'Could not check status', description: error.message, variant: 'destructive' });
      } else if (session?.user?.email_confirmed_at) {
        window.location.assign('/app');
        return;
      } else {
        toast({
          title: 'Not verified yet',
          description: 'Open the verification link in your email, then try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setBusy(null);
    }
  };

  const resendEmail = async () => {
    if (!email) return;
    setBusy('resend');
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/app` },
      });
      if (error) {
        toast({ title: 'Could not resend email', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Email sent', description: 'Check your inbox for a new verification link.' });
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-xl shadow-black/10 space-y-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-6 w-6" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Please verify your email</h1>
        {email ? (
          <p className="text-sm text-muted-foreground">
            We sent a verification link to <span className="font-medium text-foreground">{email}</span>.
            Open it to activate your account, then come back here.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Open the verification link we emailed you to activate your account. If you need a new link,
            sign in again and we will send one.
          </p>
        )}
      </div>

      <div className="space-y-3">
        <Button className="w-full h-10 gap-2" onClick={checkVerified} disabled={busy !== null}>
          {busy === 'check' ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</>
          ) : (
            <><CheckCircle2 className="h-4 w-4" /> I have verified my email</>
          )}
        </Button>

        {email && (
          <Button variant="outline" className="w-full h-10 gap-2" onClick={resendEmail} disabled={busy !== null}>
            {busy === 'resend' ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            ) : (
              <><RefreshCw className="h-4 w-4" /> Resend verification email</>
            )}
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Wrong address?{' '}
        <Link href="/login" className="underline hover:text-foreground transition-colors">Back to sign in</Link>
      </p>
    </div>
  );
}
