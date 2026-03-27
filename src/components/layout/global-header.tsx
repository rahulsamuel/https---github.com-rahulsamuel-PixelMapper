'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { LogOut, User } from 'lucide-react';
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";

export function GlobalHeader() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const navItems = [
    { href: '/', label: 'Home', exact: true },
    { href: '/app', label: 'Pixel Map' },
    { href: '/calculator', label: 'LED Calculator' },
    { href: '/power-data', label: 'Power & Data' },
    { href: '/rack-drawing', label: 'Rack Drawing' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="w-full px-4 flex h-14 items-center max-w-none">
        <Link href="/" className="mr-6 flex items-center space-x-2 flex-shrink-0">
          <Logo className="h-6 w-6 text-primary" />
          <span className="font-bold hidden sm:inline-block">MapMyLED</span>
        </Link>

        <nav className="flex items-center space-x-1 flex-1 justify-center">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "whitespace-nowrap",
                  isActive(item.href) && "bg-accent text-accent-foreground"
                )}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>

        <div className="flex items-center space-x-2 flex-shrink-0">
          {user ? (
            <>
              {pathname.startsWith('/admin') ? (
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              ) : (
                <Link href="/admin/products">
                  <Button variant="ghost" size="sm">
                    <User className="mr-2 h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              )}
            </>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                <User className="mr-2 h-4 w-4" />
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
