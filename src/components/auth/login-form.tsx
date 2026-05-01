'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Building2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoginForm() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');

  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast({ title: 'Missing fields', description: 'Email and password are required.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (!fullName.trim()) {
        toast({ title: 'Missing fields', description: 'Please enter your full name.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        toast({ title: 'Passwords do not match', description: 'Please check your password confirmation.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      if (password.length < 8) {
        toast({ title: 'Password too short', description: 'Password must be at least 8 characters.', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      const { error } = await signUp(email, password, fullName, company);
      if (error) {
        toast({ title: 'Sign up failed', description: error, variant: 'destructive' });
      } else {
        toast({ title: 'Account created!', description: 'Welcome to MapMyLED. You are now signed in.' });
      }
    } else {
      const { error } = await signIn(email, password);
      if (error) {
        toast({ title: 'Login failed', description: error, variant: 'destructive' });
      }
    }

    setIsLoading(false);
  };

  const toggle = () => {
    setMode(m => m === 'login' ? 'signup' : 'login');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm p-8 shadow-xl shadow-black/10 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'login'
            ? 'Sign in to access your projects and saved configurations.'
            : 'Join MapMyLED and start designing professional LED layouts.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sign-up only fields */}
        {mode === 'signup' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fullName" className="text-sm font-medium">Full Name <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 h-10"
                    autoComplete="name"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company" className="text-sm font-medium">
                  Company <span className="text-muted-foreground/60 font-normal">(optional)</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="Acme Productions"
                    value={company}
                    onChange={e => setCompany(e.target.value)}
                    disabled={isLoading}
                    className="pl-9 h-10"
                    autoComplete="organization"
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Email */}
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

        {/* Password */}
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-sm font-medium">
            Password <span className="text-destructive">*</span>
            {mode === 'signup' && <span className="text-muted-foreground/60 font-normal ml-1">(min 8 chars)</span>}
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isLoading}
              className="pl-9 pr-10 h-10"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Confirm password (sign-up only) */}
        {mode === 'signup' && (
          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm Password <span className="text-destructive">*</span></Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className={cn(
                  'pl-9 pr-10 h-10',
                  confirmPassword && confirmPassword !== password && 'border-destructive focus-visible:ring-destructive'
                )}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p className="text-xs text-destructive">Passwords do not match</p>
            )}
          </div>
        )}

        <Button
          type="submit"
          className="w-full h-10 font-semibold gap-2 group mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> {mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
          ) : (
            <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></>
          )}
        </Button>
      </form>

      {/* Toggle mode */}
      <div className="text-center">
        <span className="text-sm text-muted-foreground">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
        </span>
        <button
          type="button"
          onClick={toggle}
          className="text-sm text-primary hover:underline font-medium transition-colors"
          disabled={isLoading}
        >
          {mode === 'login' ? 'Sign Up' : 'Sign In'}
        </button>
      </div>
    </div>
  );
}
