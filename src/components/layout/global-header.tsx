'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, User, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

function getInitials(email: string | undefined): string {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._\-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

const navItems = [
  { href: '/app',          label: 'Pixel Map' },
  { href: '/calculator',   label: 'LED Calculator' },
  { href: '/power-data',   label: 'Power & Data' },
  { href: '/rack-drawing', label: 'Rack Drawing' },
  { href: '/pre-visual',   label: 'Pre-Visual' },
];

export function GlobalHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-2xl px-4 md:px-6 flex h-14 items-center gap-6">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Logo className="h-3.5 w-auto" />
          </div>
          <span className="font-bold text-sm tracking-tight">MapMyLED</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
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

        {/* Right side actions */}
        <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
          {user ? (
            <>
              {user?.email === 'rahulsamuel@gmail.com' && (
                <>
                  {!pathname.startsWith('/admin') && (
                    <Link href="/admin/products">
                      <Button variant="ghost" size="sm" className="h-8 px-3 text-sm text-muted-foreground hover:text-foreground gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Admin
                      </Button>
                    </Link>
                  )}
                  {pathname.startsWith('/admin') && (
                    <div className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg bg-muted/60">
                        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mr-1 pl-1">LED</span>
                        <Link href="/admin/products">
                          <Button variant={pathname.startsWith('/admin/products') || pathname.startsWith('/admin/add-led') ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2.5 text-xs gap-1.5">
                            Products
                          </Button>
                        </Link>
                        <Link href="/admin/processors">
                          <Button variant={pathname.startsWith('/admin/processors') ? 'secondary' : 'ghost'} size="sm" className="h-7 px-2.5 text-xs gap-1.5">
                            Processors
                          </Button>
                        </Link>
                      </div>
                      <Link href="/admin/rack-equipment">
                        <Button variant={pathname.startsWith('/admin/rack-equipment') ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3 text-sm gap-1.5">
                          Rack Equipment
                        </Button>
                      </Link>
                      <Link href="/admin/tracking">
                        <Button variant={pathname.startsWith('/admin/tracking') ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3 text-sm gap-1.5">
                          Tracking
                        </Button>
                      </Link>
                    </div>
                  )}
                </>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full p-0">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {getInitials(user.email)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/app')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  {user?.email === 'rahulsamuel@gmail.com' && (
                    <DropdownMenuItem onClick={() => router.push('/admin/products')}>
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm" className="h-8 px-3 text-sm gap-1.5">
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
                {user?.email === 'rahulsamuel@gmail.com' && !pathname.startsWith('/admin') && (
                  <Link href="/admin/products" onClick={() => setMobileOpen(false)}>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Admin
                    </div>
                  </Link>
                )}
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link href="/login" onClick={() => setMobileOpen(false)}>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <User className="h-3.5 w-3.5" />
                  Login
                </div>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
