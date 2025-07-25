
'use client';

import { Logo } from "@/components/logo";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function CalculatorLayout({ children }: { children: ReactNode }) {
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">MapMyLED</span>
          </Link>
           <div className="flex flex-1 items-center justify-end space-x-2">
            <Link href="/app">
              <Button variant="outline">Pixel Map</Button>
            </Link>
            <Link href={"/calculator"}>
              <Button>LED Calculator</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
