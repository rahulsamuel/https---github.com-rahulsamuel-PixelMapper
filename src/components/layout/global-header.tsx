'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { LogOut, User, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useState } from 'react';

const navItems = [
  { href: '/app',          label: 'Pixel Map' },
  { href: '/calculator',   label: 'LED Calculator' },
  { href: '/power-data',   label: 'Power & Data' },
  { href: '/rack-drawing', label: 'Rack Drawing' },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6 flex h-14 items-center">

        {/* Logo — left */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group mr-6">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Logo className="h-3.5 w-auto" />
          </div>
          <span className="font-bold text-sm tracking-tight">MapMyLED</span>
        </Link>

        {/* Desktop nav — center */}
        <nav className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-8 px-3 text-sm rounded-lg transition-colors',
                  isActive(item.href)
                    ? 'bg-primary/12 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        {/* Right side — auth */}
        <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
          {user ? (
            <>
              {isAdmin && (
                <Link href="/admin/tracking">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'h-8 px-3 text-sm gap-1.5',
                      isActive('/admin')
                        ? 'bg-primary/12 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="h-8 px-3 text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm" className="h-8 px-4 text-sm gap-1.5">
                <User className="h-3.5 w-3.5" />
                Login
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden ml-auto p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          onClick={() => setMobileOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-md px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <div className={cn(
                'flex items-center px-3 py-2 rounded-lg text-sm transition-colors',
                isActive(item.href)
                  ? 'bg-primary/12 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}>
                {item.label}
              </div>
            </Link>
          ))}

          <div className="border-t border-border/50 mt-2 pt-2 flex flex-col gap-1">
            {user ? (
              <>
                {isAdmin && (
                  <Link href="/admin/tracking" onClick={() => setMobileOpen(false)}>
                    <div className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                      isActive('/admin')
                        ? 'bg-primary/12 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin Dashboard
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full text-left mt-1"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <User className="h-3.5 w-3.5" />
                  Login / Sign Up
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
