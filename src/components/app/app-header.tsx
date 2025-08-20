
'use client';

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Logo } from "@/components/logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, DraftingCompass, Calculator, Home, LineChart, LogOut } from 'lucide-react';
import { useAuth } from "@/contexts/auth-context";

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    if (pathname.startsWith('/app')) return 'Pixel Map';
    if (pathname.startsWith('/calculator')) return 'LED Calculator';
    if (pathname.startsWith('/admin')) return 'Admin';
    if (pathname.startsWith('/login')) return 'Login';
    return 'MapMyLED';
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
                <DropdownMenuContent>
                    <Link href="/app">
                        <DropdownMenuItem>
                            <DraftingCompass className="mr-2 h-4 w-4" />
                            <span>Pixel Map</span>
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/calculator">
                        <DropdownMenuItem>
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>LED Calculator</span>
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                     <Link href="/admin/tracking">
                        <DropdownMenuItem>
                            <LineChart className="mr-2 h-4 w-4" />
                            <span>Tracking</span>
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <Link href="/">
                        <DropdownMenuItem>
                            <Home className="mr-2 h-4 w-4" />
                            <span>Homepage</span>
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex-1 flex justify-end">
              {user && (
                <Button variant="ghost" onClick={logout}>
                  <LogOut className="mr-2" />
                  Logout
                </Button>
              )}
            </div>
        </div>
    </header>
  );
}
