
'use client';

import { Logo } from "@/components/logo";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: ReactNode }) {
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6 text-primary" />
            <span className="font-bold sm:inline-block">MapMyLED - Admin</span>
          </Link>
           <div className="flex flex-1 items-center justify-end space-x-4">
             <Link href="/app">
               <Button variant="outline">Back to App</Button>
             </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 py-12">
        <div className="container">
            {children}
        </div>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} MapMyLED. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/" className="text-xs hover:underline underline-offset-4">
            Home
          </Link>
        </nav>
      </footer>
    </div>
  );
}
