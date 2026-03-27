
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
import { ChevronDown, DraftingCompass, Calculator, Home, LineChart, LogOut, Package, Bolt, Server } from 'lucide-react';
import { useAuth } from "@/contexts/auth-context";

export function AppHeader() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const getPageTitle = () => {
    if (pathname.startsWith('/app')) return 'Pixel Map';
    if (pathname.startsWith('/calculator')) return 'LED Calculator';
    if (pathname.startsWith('/power-data')) return 'Power & Data';
    if (pathname.startsWith('/rack-drawing')) return 'Rack Drawing';
    if (pathname.startsWith('/admin')) return 'Admin';
    if (pathname.startsWith('/login')) return 'Login';
    return 'MapMyLED';
  }
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="mr-6 px-2">
                        <Logo className="h-6 w-6 text-primary" />
                        <span className="font-bold sm:inline-block ml-2">{getPageTitle()}</span>
                        <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="z-[100]">
                    <DropdownMenuItem asChild>
                        <Link href="/app" className="flex items-center cursor-pointer">
                            <DraftingCompass className="mr-2 h-4 w-4" />
                            <span>Pixel Map</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/calculator" className="flex items-center cursor-pointer">
                            <Calculator className="mr-2 h-4 w-4" />
                            <span>LED Calculator</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/power-data" className="flex items-center cursor-pointer">
                            <Bolt className="mr-2 h-4 w-4" />
                            <span>Power & Data</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/rack-drawing" className="flex items-center cursor-pointer">
                            <Server className="mr-2 h-4 w-4" />
                            <span>Rack Drawing</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/admin/tracking" className="flex items-center cursor-pointer">
                            <LineChart className="mr-2 h-4 w-4" />
                            <span>Tracking</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/admin/products" className="flex items-center cursor-pointer">
                            <Package className="mr-2 h-4 w-4" />
                            <span>Products</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                        <Link href="/" className="flex items-center cursor-pointer">
                            <Home className="mr-2 h-4 w-4" />
                            <span>Homepage</span>
                        </Link>
                    </DropdownMenuItem>
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
