
'use client';

import { AppHeader } from "@/components/app/app-header";
import Link from "next/link";
import type { ReactNode } from "react";

export default function CalculatorLayout({ children }: { children: ReactNode }) {
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <AppHeader />
      <main className="flex-1">
        {children}
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} MapMyLED. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/legal/terms" className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors">
            Terms of Service
          </Link>
          <Link href="/legal/privacy" className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/contact" className="text-xs hover:text-primary hover:underline underline-offset-4 transition-colors">
            Contact Us
          </Link>
        </nav>
      </footer>
    </div>
  );
}
