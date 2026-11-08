'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TurnstileWidget } from '@/components/auth/turnstile-widget';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { emailField } from '@/lib/validation/fields';
import { Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { requestPasswordReset } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!captchaToken) return;
    const parsed = emailField.safeParse(email);
    if (!parsed.success) {
      toast({ title: 'Check your details', description: parsed.error.issues[0]?.message, variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await requestPasswordReset(parsed.data, captchaToken);
    setIsLoading(false);
    setCaptchaToken(null);
    setCaptchaKey(k => k + 1);
    if (error) {
      toast({ title: 'Could not send reset link', description: error, variant: 'destructive' });
      return;
    }
    setSentTo(parsed.data);
  };

  if (sentTo) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-xl shadow-black/10 space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Check your email</h1>
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-medium text-foreground">{sentTo}</span>, we sent a link to set a new password.
          </p>
        </div>
        <Link href="/login" className="text-sm text-primary hover:underline font-medium transition-colors">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-xl shadow-black/10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="text-sm text-muted-foreground">Enter your email and we will send you a link to set a new password.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-9 h-10"
              autoComplete="email"
            />
          </div>
        </div>

        <TurnstileWidget key={captchaKey} onTokenChange={setCaptchaToken} />

        <Button type="submit" className="w-full h-10 font-semibold gap-2 group" disabled={isLoading || !captchaToken}>
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Sending link…</>
          ) : (
            <>Send reset link <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
          )}
        </Button>
      </form>

      <div className="text-center">
        <Link href="/login" className="text-sm text-primary hover:underline font-medium transition-colors">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
