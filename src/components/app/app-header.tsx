
'use client';

import Link from "next/link";
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronDown, DraftingCompass, Calculator, Home, LineChart, LogOut, Package, Bolt, Server, User } from 'lucide-react';
import { useAuth } from "@/contexts/auth-context";

function getInitials(email: string | undefined): string {
  if (!email) return '?';
  const parts = email.split('@')[0].split(/[._\-]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const getPageTitle = () => {
    if (pathname.startsWith('/app')) return 'Pixel Map';
    if (pathname.startsWith('/calculator')) return 'LED Calculator';
    if (pathname.startsWith('/power-data')) return 'Power & Data';
    if (pathname.startsWith('/rack-drawing')) return 'Rack Drawing';
    if (pathname.startsWith('/admin')) return 'Admin';
    if (pathname.startsWith('/login')) return 'Login';
    return 'MapMyLED';
  }

  const handleNavigation = (href: string) => {
    router.push(href);
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="mr-6 px-2">
              <Logo className="h-6 w-6 text-primary" />
              <span className="font-bold sm:inline-block ml-2">{getPageTitle()}</span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleNavigation('/app')}>
              <DraftingCompass className="mr-2 h-4 w-4" />
              <span>Pixel Map</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/calculator')}>
              <Calculator className="mr-2 h-4 w-4" />
              <span>LED Calculator</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/power-data')}>
              <Bolt className="mr-2 h-4 w-4" />
              <span>Power & Data</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/rack-drawing')}>
              <Server className="mr-2 h-4 w-4" />
              <span>Rack Drawing</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigation('/admin/tracking')}>
              <LineChart className="mr-2 h-4 w-4" />
              <span>Tracking</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleNavigation('/admin/products')}>
              <Package className="mr-2 h-4 w-4" />
              <span>Products</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleNavigation('/')}>
              <Home className="mr-2 h-4 w-4" />
              <span>Homepage</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex-1 flex justify-end">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
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
                <DropdownMenuItem onClick={() => handleNavigation('/app')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </header>
  );
}
