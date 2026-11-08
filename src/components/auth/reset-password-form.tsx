'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { Lock, Loader2, ArrowRight } from 'lucide-react';

const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters.' })
      .max(72, { message: 'Password must be 72 characters or fewer.' }),
    confirmPassword: z.string(),
  })
  .refine(d => d.password === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading, updatePassword } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  if (loading) return null;

  if (!user) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-xl shadow-black/10 space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">This link has expired</h1>
          <p className="text-sm text-muted-foreground">Reset links only work once and expire after a short time. Request a new one to continue.</p>
        </div>
        <Link href="/forgot-password" className="text-sm text-primary hover:underline font-medium transition-colors">
          Request a new reset link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const parsed = newPasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      toast({ title: 'Check your details', description: parsed.error.issues[0]?.message, variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const { error } = await updatePassword(parsed.data.password);
    setIsLoading(false);
    if (error) {
      toast({ title: 'Could not update password', description: error, variant: 'destructive' });
      return;
    }
    toast({ title: 'Password updated', description: 'You are signed in with your new password.' });
    router.replace('/app');
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-xl shadow-black/10 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Choose a password with at least 8 characters.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">New password <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              className="pl-9 h-10"
              autoComplete="new-password"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm new password <span className="text-destructive">*</span></Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              disabled={isLoading}
              className="pl-9 h-10"
              autoComplete="new-password"
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-10 font-semibold gap-2 group" disabled={isLoading}>
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Updating…</>
          ) : (
            <>Update password <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
          )}
        </Button>
      </form>
    </div>
  );
}
